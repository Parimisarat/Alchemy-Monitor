const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('--- MONITOR STARTING ---');

let statusData = {
    overallStatus: 'Checking...',
    lastUpdate: new Date().toISOString(),
    services: [
        { name: 'Ethereum RPC', status: 'Checking...', latency: 'N/A', error: null },
        { name: 'Polygon RPC', status: 'Checking...', latency: 'N/A', error: null },
        { name: 'Arbitrum RPC', status: 'Checking...', latency: 'N/A', error: null },
        { name: 'Optimism RPC', status: 'Checking...', latency: 'N/A', error: null }
    ],
    history: [],
    logs: []
};

async function check(url, name) {
    console.log(`Checking ${name}...`);
    return new Promise((resolve) => {
        const start = Date.now();
        const body = JSON.stringify({jsonrpc:"2.0",id:1,method:"eth_blockNumber",params:[]});
        const req = https.request(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            timeout: 5000
        }, (res) => {
            const latency = Date.now() - start;
            if (res.statusCode === 200) {
                resolve({name, status:'Operational', latency: `${latency}ms`, error: null});
            } else {
                resolve({name, status:'Major Outage', latency: 'Error', error: `HTTP ${res.statusCode}`});
            }
        });
        req.on('error', (e) => resolve({name, status:'Major Outage', latency: 'Error', error: e.message}));
        req.on('timeout', () => { req.destroy(); resolve({name, status:'Major Outage', latency: 'Error', error: 'Timeout'}); });
        req.write(body);
        req.end();
    });
}

async function update() {
    console.log('Update started...');
    const eps = {
        'Ethereum RPC': 'https://cloudflare-eth.com',
        'Polygon RPC': 'https://rpc.ankr.com/polygon',
        'Arbitrum RPC': 'https://arb1.arbitrum.io/rpc',
        'Optimism RPC': 'https://mainnet.optimism.io'
    };
    
    // Process one by one for maximum stability initially
    const results = [];
    for (const [name, url] of Object.entries(eps)) {
        results.push(await check(url, name));
    }

    statusData.services = results.map(r => ({...r, lastCheck: new Date().toISOString()}));
    statusData.lastUpdate = new Date().toISOString();
    
    const count = results.filter(r => r.status === 'Operational').length;
    statusData.overallStatus = count === 4 ? 'All Systems Operational' : count > 0 ? 'Degraded Performance' : 'Major Systems Outage';
    
    statusData.history.unshift({timestamp: statusData.lastUpdate, status: statusData.overallStatus});
    if (statusData.history.length > 10) statusData.history.pop();
    console.log(`Update complete: ${statusData.overallStatus}`);
}

update();
setInterval(update, 60000);

module.exports = {
    getStatus: () => statusData
};
