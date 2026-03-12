const https = require('https');
const fs = require('fs');

const polyUrls = [
    'https://polygon.llamarpc.com',
    'https://1rpc.io/matic',
    'https://polygon-rpc.com',
    'https://rpc-mainnet.maticvigil.com'
];

async function test(url) {
    return new Promise((resolve) => {
        const body = JSON.stringify({jsonrpc:"2.0",id:1,method:"eth_blockNumber",params:[]});
        const req = https.request(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
            timeout: 5000
        }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve(`URL: ${url} | STATUS: ${res.statusCode} | DATA: ${data.substring(0, 50)}`));
        });
        req.on('error', e => resolve(`URL: ${url} | ERROR: ${e.message}`));
        req.on('timeout', () => { req.destroy(); resolve(`URL: ${url} | TIMEOUT`); });
        req.write(body);
        req.end();
    });
}

async function run() {
    let out = `Poly Test at ${new Date().toISOString()}\n`;
    for (const url of polyUrls) {
        out += await test(url) + '\n';
    }
    fs.writeFileSync('poly-test.txt', out);
    console.log('Results written to poly-test.txt');
}
run();
