const fs = require('fs');
const https = require('https');
const os = require('os');

async function testUrl(url) {
    return new Promise((resolve) => {
        const start = Date.now();
        const req = https.get(url, { timeout: 5000 }, (res) => {
            resolve(`${url}: SUCCESS ${res.statusCode} [${Date.now() - start}ms]`);
        });
        req.on('error', (e) => resolve(`${url}: ERROR ${e.message}`));
        req.on('timeout', () => { req.destroy(); resolve(`${url}: TIMEOUT`); });
    });
}

async function run() {
    let report = `Report at ${new Date().toISOString()}\n`;
    report += `Node Version: ${process.version}\n`;
    report += `Platform: ${process.platform}\n`;
    report += `Arch: ${process.arch}\n`;
    report += `CWD: ${process.cwd()}\n`;
    
    report += '\nConnectivity Tests:\n';
    const urls = [
        'https://www.google.com',
        'https://cloudflare-eth.com',
        'https://rpc.ankr.com/eth'
    ];
    
    for (const url of urls) {
        report += await testUrl(url) + '\n';
    }
    
    fs.writeFileSync('env-report.txt', report);
    process.exit(0);
}

run();
