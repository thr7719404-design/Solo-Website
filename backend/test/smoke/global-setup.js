/**
 * Jest globalSetup — runs ONCE before any smoke spec.
 *
 * Why: the live backend has aggressive rate limits on /api/auth/login
 * and /api/auth/register (5 per 15min per IP). Sharing one test user
 * + one admin login across all suites keeps us inside the budget.
 *
 * Writes state to .smoke-state.json (gitignored) for suites to consume.
 */
const fs = require('fs');
const path = require('path');
const request = require('supertest');

const BASE_URL =
  process.env.TEST_BASE_URL ||
  'https://backend-qlyb5greec2io.whiteriver-ae956411.eastus2.azurecontainerapps.io';

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@solo-ecommerce.com';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'AdminPassword123!';

const STATE_PATH = path.resolve(__dirname, '..', '.smoke-state.json');

async function tryLoginAdmin() {
  const r = await request(BASE_URL)
    .post('/api/auth/login')
    .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  return r.status === 200 ? r.body?.tokens?.accessToken || null : null;
}

async function tryRegisterCustomer(runId) {
  const email = `qa-smoke-${runId}@solo-qa.local`;
  const password = `QaSmoke!${runId}`;
  const reg = await request(BASE_URL).post('/api/auth/register').send({
    email,
    password,
    firstName: 'QA',
    lastName: 'Smoke',
  });
  if (reg.status >= 400) {
    return { ok: false, status: reg.status, body: reg.body, email };
  }
  let accessToken = reg.body?.tokens?.accessToken;
  let refreshToken = reg.body?.tokens?.refreshToken;
  let userId = reg.body?.user?.id;
  if (!accessToken) {
    const login = await request(BASE_URL)
      .post('/api/auth/login')
      .send({ email, password });
    if (login.status !== 200) {
      return { ok: false, status: login.status, body: login.body, email };
    }
    accessToken = login.body?.tokens?.accessToken;
    refreshToken = login.body?.tokens?.refreshToken;
    userId = login.body?.user?.id;
  }
  return {
    ok: !!(accessToken && userId),
    email,
    password,
    userId,
    accessToken,
    refreshToken: refreshToken || '',
  };
}

module.exports = async function globalSetup() {
  const runId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const writesEnabled =
    (process.env.SMOKE_WRITES_ENABLED || 'true').toLowerCase() !== 'false';

  const state = {
    baseUrl: BASE_URL,
    runId,
    writesEnabled,
    adminToken: null,
    customer: null,
    warnings: [],
  };

  // Always try admin login (reused for cleanup + admin tests)
  state.adminToken = await tryLoginAdmin();
  if (!state.adminToken) {
    state.warnings.push('admin login failed — cleanup disabled');
  }

  if (writesEnabled) {
    const cust = await tryRegisterCustomer(runId);
    if (cust.ok) {
      state.customer = cust;
    } else {
      state.warnings.push(
        `customer registration failed: ${cust.status} ${JSON.stringify(cust.body)}`,
      );
    }
  }

  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
  // eslint-disable-next-line no-console
  console.log(
    `\n[globalSetup] BASE_URL=${BASE_URL} runId=${runId} adminAuthed=${!!state.adminToken} customer=${state.customer?.email || 'none'}\n`,
  );
  if (state.warnings.length) {
    // eslint-disable-next-line no-console
    console.warn('[globalSetup] warnings:', state.warnings);
  }
};
