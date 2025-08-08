import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { v4 as uuidv4 } from 'uuid';

interface ProxyConnection {
    id: string;
    ws: WebSocket;
    subdomain: string;
    lastHeartbeat: number;
}

export class ProxyServer {
    private app = express();
    private server = createServer(this.app);
    private wss = new WebSocketServer({ server: this.server });
    private connections = new Map<string, ProxyConnection>();
    private subdomainToConnection = new Map<string, string>();

    constructor() {
        this.setupWebSocket();
        this.setupHttpProxy();
        this.startHealthCheck();
    }

    private setupWebSocket() {
        this.wss.on('connection', (ws, req) => {
            const connectionId = uuidv4();
            console.log(`New WebSocket connection: ${connectionId}`);

            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    this.handleWebSocketMessage(connectionId, ws, message);
                } catch (error) {
                    console.error('Invalid message format:', error);
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Invalid message format'
                    }));
                }
            });

            ws.on('close', () => {
                this.removeConnection(connectionId);
            });

            ws.on('error', (error) => {
                console.error(`WebSocket error for ${connectionId}:`, error);
                this.removeConnection(connectionId);
            });
        });
    }

    private handleWebSocketMessage(connectionId: string, ws: WebSocket, message: any) {
        switch (message.type) {
            case 'register':
                this.registerConnection(connectionId, ws, message.subdomain);
                break;
            case 'heartbeat':
                this.updateHeartbeat(connectionId);
                break;
            case 'http_response':
                // このメッセージはHTTPプロキシハンドラーで処理される
                break;
        }
    }

    private registerConnection(connectionId: string, ws: WebSocket, subdomain: string) {
        // 既存の同じサブドメインの接続があれば削除
        const existingConnectionId = this.subdomainToConnection.get(subdomain);
        if (existingConnectionId) {
            this.removeConnection(existingConnectionId);
        }

        const connection: ProxyConnection = {
            id: connectionId,
            ws,
            subdomain,
            lastHeartbeat: Date.now()
        };

        this.connections.set(connectionId, connection);
        this.subdomainToConnection.set(subdomain, connectionId);

        ws.send(JSON.stringify({
            type: 'registered',
            connectionId,
            subdomain
        }));

        console.log(`✅ Registered connection ${connectionId} for subdomain ${subdomain}`);
    }

    private setupHttpProxy() {
        this.app.use(async (req, res) => {
            const host = req.get('host');
            if (!host) {
                return res.status(400).send('Host header missing');
            }

            // サブドメインを抽出 (例: abc123.scoresync.pim4n-net.com -> abc123)
            const subdomain = host.split('.')[0];
            const connectionId = this.subdomainToConnection.get(subdomain as string);

            if (!connectionId) {
                return res.status(404).send('Service not found');
            }

            const connection = this.connections.get(connectionId);
            if (!connection || connection.ws.readyState !== WebSocket.OPEN) {
                return res.status(503).send('Service temporarily unavailable');
            }

            const requestId = uuidv4();
            let responseHandled = false;

            // レスポンスハンドラーを設定
            const responseHandler = (data: Buffer) => {
                if (responseHandled) return;

                try {
                    const message = JSON.parse(data.toString());
                    if (message.type === 'http_response' && message.requestId === requestId) {
                        responseHandled = true;
                        // connectionの存在チェックを追加
                        if (connection) {
                            connection.ws.off('message', responseHandler);
                        }

                        res.status(message.statusCode);
                        Object.entries(message.headers).forEach(([key, value]) => {
                            res.set(key, value as string);
                        });
                        res.send(Buffer.from(message.body, 'base64'));
                    }
                } catch (error) {
                    if (!responseHandled) {
                        responseHandled = true;
                        // connectionの存在チェックを追加
                        if (connection) {
                            connection.ws.off('message', responseHandler);
                        }
                        console.error('Error handling response:', error);
                        res.status(500).send('Internal server error');
                    }
                }
            };

            connection.ws.on('message', responseHandler);

            // ボディを読み込み
            let body: Buffer | null = null;

            const sendRequest = () => {
                // connectionの再チェック（クロージャ内で参照するため）
                const currentConnection = this.connections.get(connectionId);
                if (!currentConnection || currentConnection.ws.readyState !== WebSocket.OPEN) {
                    if (!responseHandled) {
                        responseHandled = true;
                        res.status(503).send('Service temporarily unavailable');
                    }
                    return;
                }

                // リクエストをローカルサーバーに転送
                const requestData = {
                    type: 'http_request',
                    requestId,
                    method: req.method,
                    url: req.url,
                    headers: req.headers,
                    body: body ? body.toString('base64') : null
                };

                currentConnection.ws.send(JSON.stringify(requestData));

                // タイムアウト設定
                setTimeout(() => {
                    if (!responseHandled) {
                        responseHandled = true;
                        // connectionの存在チェックを追加
                        if (connection) {
                            connection.ws.off('message', responseHandler);
                        }
                        res.status(504).send('Gateway timeout');
                    }
                }, 30000);
            };

            if (req.method !== 'GET' && req.method !== 'HEAD') {
                const chunks: Buffer[] = [];
                req.on('data', (chunk) => chunks.push(chunk));
                req.on('end', () => {
                    body = Buffer.concat(chunks);
                    sendRequest();
                });
            } else {
                sendRequest();
            }
        });
    }

    private updateHeartbeat(connectionId: string) {
        const connection = this.connections.get(connectionId);
        if (connection) {
            connection.lastHeartbeat = Date.now();
        }
    }

    private removeConnection(connectionId: string) {
        const connection = this.connections.get(connectionId);
        if (connection) {
            this.subdomainToConnection.delete(connection.subdomain);
            this.connections.delete(connectionId);
            console.log(`❌ Removed connection ${connectionId} (${connection.subdomain})`);
        }
    }

    private startHealthCheck() {
        setInterval(() => {
            const now = Date.now();
            for (const [connectionId, connection] of this.connections) {
                if (now - connection.lastHeartbeat > 60000) { // 60秒タイムアウト
                    console.log(`⏰ Connection ${connectionId} timed out`);
                    connection.ws.terminate();
                    this.removeConnection(connectionId);
                }
            }
        }, 30000);
    }

    public listen(port: number) {
        this.server.listen(port, () => {
            console.log(`🚀 Proxy server listening on port ${port}`);
        });
    }
}

// サーバー起動用（開発/テスト用）
if (require.main === module) {
    const proxyServer = new ProxyServer();
    proxyServer.listen(443);
}