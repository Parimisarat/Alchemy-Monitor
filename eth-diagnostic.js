const https = require('https');
const fs = require('fs');

const urls = [
    'https://eth-rpc.gateway.pokt.network',
    'https://cloudflare-eth.com',
    'https://rpc.ankr.com/eth',
    'https://ethereum.publicnode.com'
];

async function test(url) {
    return new Promise((resolve) => {
        const start = Date.now();
        const body = JSON.stringify({jsonrpc:"2.0",id:1,method:"eth_blockNumber",params:[]});
        const req = https.request(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0'
            },
            timeout: 5000
        }, (res) => {
            if (res.statusCode === 200) {
                resolve(`SUCCESS: ${url} [${Date.now() - start}ms]`);
            } else {
                resolve(`FAILED: ${url} - HTTP ${res.statusCode}`);
            }
        });
        req.on('error', (e) => resolve(`ERROR: ${url} - ${e.message}`));
        req.on('timeout', () => { req.destroy(); resolve(`TIMEOUT: ${url}`); });
        req.write(body);
        req.end();
    });
}

async function run() {
    let output = `Eth Test at ${new Date().toISOString()}\n`;
    for (const url of urls) {
        console.log(`Testing ${url}...`);
        const res = await test(url);
        output += res + '\n';
        console.log(res);
    }
    fs.writeFileSync('eth-results.txt', output);
    console.log('Done.');
}

run();
