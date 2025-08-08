import { Sonolus } from "@sonolus/express";
import express from "express";
import { getLocalIpv4, getfile } from "./utils.js";
import { install } from "./sonolus.js";
import { packPath } from "@sonolus/free-pack";
import { initializeCharts } from "./charts.js";
import { ProxyClient } from "./proxy/client.js";

const app = express();
export const sonolus = new Sonolus()

const ipAddress = getLocalIpv4();
const port = 3939;
const chartDirectory = './levels'; 

// プロキシクライアントの設定
const proxyClient = new ProxyClient({
    proxyServerUrl: 'wss://xxx.scoresync.pim4n-net.com',
    localPort: port
});

app.use(sonolus.router)

async function startServer() {
    install()
    getfile()
    
    await initializeCharts(chartDirectory);
    
    sonolus.load(packPath)
    
    app.listen(port, async () => {
        console.log('🎵 Score Sync Server Started!')
        console.log(`📍 Local server: http://localhost:${port}`)
        console.log(`🏠 Local network: http://${ipAddress}:${port}`)
        console.log(`🌐 Sonolus client: https://open.sonolus.com/${ipAddress}:${port}/`)
        
        // プロキシ接続開始
        try {
            await proxyClient.connect();
            console.log(`🚀 Public URL: ${proxyClient.getPublicUrl()}`);
            console.log(`🎮 Public Sonolus: https://open.sonolus.com/proxy/${proxyClient.getSubdomain()}.scoresync.pim4n-net.com/`);
        } catch (error) {
            console.error('❌ Failed to connect to proxy server:', error);
            console.log('ℹ️  Server is running locally only');
        }
    })
}

// グレースフルシャットダウン
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    proxyClient.disconnect();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down...');
    proxyClient.disconnect();
    process.exit(0);
});

startServer().catch(error => {
    console.error('❌ Server startup error:', error);
});