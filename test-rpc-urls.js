const axios = require('axios');

async function test(url, name) {
    try {
        console.log(`Testing ${name} (${url})...`);
        const start = Date.now();
        const res = await axios.post(url, {
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_blockNumber',
            params: []
        }, { timeout: 10000 });
        console.log(`✅ ${name} SUCCESS: ${res.status} [${Date.now() - start}ms]`);
    } catch (e) {
        console.log(`❌ ${name} FAILED: ${e.message}`);
    }
}

async function run() {
    await test('https://eth.llamarpc.com', 'Llama Ethereum');
    await test('https://rpc.ankr.com/eth', 'Ankr Ethereum');
    await test('https://cloudflare-eth.com', 'Cloudflare Ethereum');
    await test('https://polygon-rpc.com', 'Polygon Official');
    await test('https://arb1.arbitrum.io/rpc', 'Arbitrum Official');
    await test('https://mainnet.optimism.io', 'Optimism Official');
}

run();
