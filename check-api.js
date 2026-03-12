const http = require('http');
const fs = require('fs');

http.get('http://localhost:3000/api/status', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        fs.writeFileSync('api-check.txt', data);
        console.log('API response saved to api-check.txt');
        process.exit(0);
    });
}).on('error', (e) => {
    fs.writeFileSync('api-check.txt', 'ERROR: ' + e.message);
    process.exit(1);
});
