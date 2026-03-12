const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const LOG_FILE = path.join(__dirname, 'monitor.log');
const logBuffer = [`[${new Date().toLocaleTimeString()}] Monitor v2.0 Started`];

function log(msg) {
    const entry = `[${new Date().toLocaleTimeString()}] ${msg}`;
    console.log(entry);
    logBuffer.unshift(entry);
    if (logBuffer.length > 50) logBuffer.pop();
    try { fs.appendFileSync(LOG_FILE, entry + '\n'); } catch (e) {}
}

let statusData = {
    overallStatus: 'Initializing...',
    lastUpdate: new Date().toISOString(),
    services: [
        { name: 'Ethereum RPC', status: 'Checking...', latency: 'N/A', error: null },
        { name: 'Polygon RPC', status: 'Checking...', latency: 'N/A', error: null },
        { name: 'Arbitrum RPC', status: 'Checking...', latency: 'N/A', error: null },
        { name: 'Optimism RPC', status: 'Checking...', latency: 'N/A', error: null },
        { name: 'World Chain', status: 'Checking...', latency: 'N/A', error: null }
    ],
    history: []
};

async function check(url, name) {
    return new Promise((resolve) => {
        const start = Date.now();
        const body = JSON.stringify({jsonrpc:"2.0",id:1,method:"eth_blockNumber",params:[]});
        const urlObj = new URL(url);
        const req = https.request({
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'AlchemyMonitor/2.0'
            },
            timeout: 8000,
            rejectUnauthorized: false
        }, (res) => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve({name, status:'Active', latency: `${Date.now() - start}ms`, error: null});
                } else {
                    resolve({name, status:'Inactive', latency: 'Error', error: `HTTP ${res.statusCode}`});
                }
            });
        });
        req.on('error', e => resolve({name, status:'Inactive', latency: 'Error', error: e.message}));
        req.on('timeout', () => { req.destroy(); resolve({name, status:'Inactive', latency: 'Error', error: 'Timeout'}); });
        req.write(body);
        req.end();
    });
}

async function update() {
    log('--- STARTING HEALTH CHECK ---');
    const alchemyUrl = process.env.ALCHEMY_RPC_URL || '';
    
    const config = {
        'Ethereum RPC': ['https://eth.llamarpc.com', 'https://cloudflare-eth.com'],
        'Polygon RPC': ['https://polygon-rpc.com', 'https://rpc-mainnet.maticvigil.com', 'https://polygon-bor.publicnode.com'],
        'Arbitrum RPC': ['https://arb1.arbitrum.io/rpc', 'https://rpc.ankr.com/arbitrum'],
        'Optimism RPC': ['https://mainnet.optimism.io', 'https://rpc.ankr.com/optimism'],
        'World Chain': [alchemyUrl, 'https://worldchain-mainnet.gateway.pokt.network'].filter(u => u && u.startsWith('http'))
    };

    const results = [];
    for (const [name, urls] of Object.entries(config)) {
        let final = { name, status: 'Inactive', latency: 'Error', error: 'Init' };
        for (const url of urls) {
            const res = await check(url, name);
            if (res.status === 'Active') {
                log(`${name}: OK (${new URL(url).hostname})`);
                final = res;
                break;
            }
            log(`${name}: FAIL (${new URL(url).hostname}) - ${res.error}`);
            final = res;
        }
        results.push(final);
    }

    statusData.services = results;
    statusData.lastUpdate = new Date().toISOString();
    const up = results.filter(r => r.status === 'Active').length;
    statusData.overallStatus = up === results.length ? 'All Systems Active' : up > 0 ? 'Partially Active' : 'All Systems Inactive';
    statusData.history.unshift({timestamp: statusData.lastUpdate, status: statusData.overallStatus});
    if (statusData.history.length > 20) statusData.history.pop();
    log(`Cycle finished: ${statusData.overallStatus}`);
}

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.get('/api/status', (req, res) => res.json({...statusData, logs: logBuffer}));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = 3001; // Switch port to avoid ghost process conflicts
app.listen(PORT, '0.0.0.0', () => {
    log(`MONITOR v2.0 ACTIVE ON http://localhost:${PORT}`);
    update();
});
setInterval(update, 60000);
