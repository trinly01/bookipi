const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/sale/purchase',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(JSON.stringify({userId: 'test123'}))
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`BODY: ${data}`);
  });
});

req.on('error', (e) => {
  console.error(`Request error: ${e.message}`);
});

req.write(JSON.stringify({userId: 'test123'}));
req.end();
