const https = require('https');
const fs = require('fs');

const url = 'https://backend-qlyb5greec2io.whiteriver-ae956411.eastus2.azurecontainerapps.io/api/categories';

const req = https.get(url, { timeout: 15000 }, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    fs.writeFileSync('d:\\Solo Website\\api-result.txt', `STATUS: ${res.statusCode}\nBODY: ${data.substring(0, 1000)}`);
    process.exit(0);
  });
});

req.on('error', (e) => {
  fs.writeFileSync('d:\\Solo Website\\api-result.txt', `ERROR: ${e.message}`);
  process.exit(1);
});

req.on('timeout', () => {
  fs.writeFileSync('d:\\Solo Website\\api-result.txt', 'ERROR: Request timed out after 15s');
  req.destroy();
  process.exit(1);
});
