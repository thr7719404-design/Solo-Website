// One-shot cleanup utility for QA smoke test data.
// Polls admin login until rate-limit clears, then deletes any residual
// qa-smoke-* customers and removes the local smoke-state file.
const fs = require('fs');
const path = require('path');

const BASE =
  process.env.SMOKE_BASE_URL ||
  'https://backend-qlyb5greec2io.whiteriver-ae956411.eastus2.azurecontainerapps.io';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@solo-ecommerce.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'AdminPassword123!';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function loginAdmin() {
  for (let attempt = 1; attempt <= 60; attempt++) {
    const r = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });
    const text = await r.text();
    let j = null;
    try {
      j = JSON.parse(text);
    } catch {
      /* not json */
    }
    if (r.ok && j) {
      const token = j.accessToken || j.tokens?.accessToken;
      if (token) return token;
    }
    if (r.status === 429) {
      const wait = Math.min(60_000, 30_000 + attempt * 5_000);
      console.log(`[cleanup] login 429 (attempt ${attempt}); waiting ${wait / 1000}s`);
      await sleep(wait);
      continue;
    }
    throw new Error(`login failed ${r.status} ${text.slice(0, 200)}`);
  }
  throw new Error('login: exhausted retries');
}

async function listCustomers(token) {
  const candidates = [
    '/api/admin/customers?limit=500',
    '/api/admin/users?limit=500',
  ];
  for (const p of candidates) {
    const r = await fetch(`${BASE}${p}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    if (!r.ok) continue;
    const j = await r.json();
    const list = j.data || j.items || j.users || j.customers || j;
    if (Array.isArray(list)) return list;
  }
  return [];
}

async function deleteCustomer(token, id) {
  const r = await fetch(`${BASE}/api/admin/customers/${id}`, {
    method: 'DELETE',
    headers: { authorization: `Bearer ${token}` },
  });
  return r.status;
}

(async () => {
  const stateFile = path.join(__dirname, 'test', '.smoke-state.json');
  if (fs.existsSync(stateFile)) {
    try {
      fs.unlinkSync(stateFile);
      console.log('[cleanup] removed', stateFile);
    } catch (e) {
      console.log('[cleanup] could not remove state file:', e.message);
    }
  }

  console.log('[cleanup] base:', BASE);
  const token = await loginAdmin();
  console.log('[cleanup] admin login OK');

  const customers = await listCustomers(token);
  console.log('[cleanup] total customers:', customers.length);

  const matches = customers.filter((u) =>
    /qa-smoke|solo-qa\.local/i.test(u.email || ''),
  );
  console.log('[cleanup] qa-smoke matches:', matches.length);

  let deleted = 0;
  let failed = 0;
  for (const m of matches) {
    const id = m.id || m.userId;
    const status = await deleteCustomer(token, id);
    console.log(`[cleanup] DELETE ${m.email} (${id}) -> ${status}`);
    if (status >= 200 && status < 300) deleted++;
    else failed++;
  }

  console.log(
    `[cleanup] done deleted=${deleted} failed=${failed} matched=${matches.length}`,
  );
  process.exit(failed > 0 ? 1 : 0);
})().catch((e) => {
  console.error('[cleanup] error:', e.message);
  process.exit(2);
});
