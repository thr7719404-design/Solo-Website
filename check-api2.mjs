import { writeFileSync } from 'fs';
const url = 'https://backend-qlyb5greec2io.whiteriver-ae956411.eastus2.azurecontainerapps.io/api/categories';
try {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  const text = await res.text();
  writeFileSync('api-result.txt', `STATUS: ${res.status}\nBODY: ${text.substring(0, 1000)}`);
} catch (e) {
  writeFileSync('api-result.txt', `ERROR: ${e.message}`);
}
