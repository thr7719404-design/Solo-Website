const url = 'https://backend-qlyb5greec2io.whiteriver-ae956411.eastus2.azurecontainerapps.io/api/categories';
try {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  const text = await res.text();
  console.log(`STATUS: ${res.status}`);
  console.log(`BODY: ${text.substring(0, 800)}`);
} catch (e) {
  console.log(`ERROR: ${e.message}`);
}
