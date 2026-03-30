import { writeFileSync } from 'fs';
const url = 'https://backend-qlyb5greec2io.whiteriver-ae956411.eastus2.azurecontainerapps.io/api/categories';
try {
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  const text = await res.text();
  writeFileSync('d:\\Solo Website\\api-final-result.txt', `STATUS: ${res.status}\nBODY: ${text.substring(0, 2000)}`);
} catch (e) {
  writeFileSync('d:\\Solo Website\\api-final-result.txt', `ERROR: ${e.message}`);
}
