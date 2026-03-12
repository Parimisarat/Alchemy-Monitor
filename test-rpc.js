const axios = require('axios');
const url = 'https://eth-mainnet.g.alchemy.com/v2/qMa-v6rCjDh_9QchTTdWE';

async function test() {
    try {
        const response = await axios.post(url, {
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_blockNumber',
            params: []
        });
        console.log('SUCCESS:', response.data);
    } catch (error) {
        console.log('ERROR:', error.message);
        if (error.response) {
            console.log('ERROR DATA:', error.response.data);
        }
    }
}

test();
