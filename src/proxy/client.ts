import WebSocket from 'ws';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';

export interface ProxyConfig {
    proxyServerUrl: string;
    localPort: number;
    subdomain?: string;
}

export class ProxyClient {
    private ws: WebSocket | null = null;
    private config: ProxyConfig;
    private subdomain: string;
    private reconnectInterval: number = 5000;
    private heartbeatInterval: NodeJS.Timeout | null = null;

    constructor(config: ProxyConfig) {
        this.config = config;
        this.subdomain = config.subdomain || uuidv4();
    }

    public getPublicUrl(): string {
        return `https://${this.subdomain}.scoresync.pim4n-net.com`;
    }

    public getSubdomain(): string {
        return this.subdomain;
    }

    public connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            console.log(`Connecting to proxy server: ${this.config.proxyServerUrl}`);
            console.log(`Public URL will be: ${this.getPublicUrl()}`);
            
            this.ws = new WebSocket(this.config.proxyServerUrl);

            this.ws.on('open', () => {
                console.log('Connected to proxy server');
                this.register();
                this.startHeartbeat();
                resolve();
            });

            this.ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    this.handleMessage(message);
                } catch (error) {
                    console.error('Error parsing message:', error);
                }
            });

            this.ws.on('close', () => {
                console.log('Disconnected from proxy server. Reconnecting...');
                this.cleanup();
                setTimeout(() => this.connect(), this.reconnectInterval);
            });

            this.ws.on('error', (error) => {
                console.error('WebSocket error:', error);
                reject(error);
            });
        });
    }

    private register() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'register',
                subdomain: this.subdomain
            }));
        }
    }

    private startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                    type: 'heartbeat'
                }));
            }
        }, 30000);
    }

    private cleanup() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    private async handleMessage(message: any) {
        switch (message.type) {
            case 'registered':
                console.log(`✅ Registered with subdomain: ${message.subdomain}`);
                console.log(`🌐 Public URL: ${this.getPublicUrl()}`);
                break;
            case 'http_request':
                await this.handleHttpRequest(message);
                break;
            case 'error':
                console.error('Proxy server error:', message.message);
                break;
        }
    }

    private async handleHttpRequest(request: any) {
        try {
            const localUrl = `http://localhost:${this.config.localPort}${request.url}`;
            
            const fetchOptions: any = {
                method: request.method,
                headers: request.headers,
            };

            if (request.body) {
                fetchOptions.body = Buffer.from(request.body, 'base64');
            }

            const response = await fetch(localUrl, fetchOptions);
            const responseBuffer = await response.arrayBuffer();

            const responseMessage = {
                type: 'http_response',
                requestId: request.requestId,
                statusCode: response.status,
                headers: Object.fromEntries(response.headers.entries()),
                body: Buffer.from(responseBuffer).toString('base64')
            };

            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify(responseMessage));
            }
        } catch (error) {
            console.error('Error forwarding request:', error);
            
            const errorResponse = {
                type: 'http_response',
                requestId: request.requestId,
                statusCode: 500,
                headers: { 'content-type': 'text/plain' },
                body: Buffer.from('Internal Server Error').toString('base64')
            };

            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify(errorResponse));
            }
        }
    }

    public disconnect() {
        this.cleanup();
        if (this.ws) {
            this.ws.close();
        }
    }
}