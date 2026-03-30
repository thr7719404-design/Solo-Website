try {
  const resp = await fetch('https://backend-qlyb5greec2io.whiteriver-ae956411.eastus2.azurecontainerapps.io/api/categories');
  const data = await resp.json();
  console.log('Status:', resp.status);
  console.log('Categories count:', Array.isArray(data) ? data.length : 'N/A');
  console.log('First:', JSON.stringify(data[0] || data).substring(0, 200));
} catch (e) {
  console.error('ERROR:', e.message);
}
