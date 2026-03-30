const { execSync } = require('child_process');
const fs = require('fs');

try {
  const result = execSync(
    'az containerapp logs show -n backend-qlyb5greec2io -g rg-Solo-Website --tail 30 --type console 2>&1',
    { encoding: 'utf8', timeout: 30000 }
  );
  fs.writeFileSync('d:\\Solo Website\\container-logs.txt', result);
} catch (e) {
  fs.writeFileSync('d:\\Solo Website\\container-logs.txt', `ERROR: ${e.message}\nSTDOUT: ${e.stdout || ''}\nSTDERR: ${e.stderr || ''}`);
}
