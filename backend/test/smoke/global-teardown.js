/**
 * Jest globalTeardown — runs ONCE after all smoke specs.
 * Soft-deletes the test customer via admin endpoint and removes state file.
 */
const fs = require('fs');
const path = require('path');
const request = require('supertest');

const STATE_PATH = path.resolve(__dirname, '..', '.smoke-state.json');

module.exports = async function globalTeardown() {
  if (!fs.existsSync(STATE_PATH)) return;
  let state;
  try {
    state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
  } catch {
    return;
  }
  const baseUrl = state.baseUrl;
  const adminToken = state.adminToken;
  const customer = state.customer;
  const summary = { deleted: 0, failed: [] };

  if (adminToken && customer?.userId) {
    try {
      const r = await request(baseUrl)
        .delete(`/api/admin/customers/${customer.userId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      if (r.status >= 200 && r.status < 400) {
        summary.deleted++;
      } else {
        summary.failed.push({
          userId: customer.userId,
          email: customer.email,
          status: r.status,
        });
      }
    } catch (e) {
      summary.failed.push({
        userId: customer.userId,
        email: customer.email,
        error: e?.message,
      });
    }
  }

  // eslint-disable-next-line no-console
  console.log(
    `\n[globalTeardown] cleanup deleted=${summary.deleted} failed=${summary.failed.length}`,
  );
  if (summary.failed.length) {
    // eslint-disable-next-line no-console
    console.warn('[globalTeardown] failed:', summary.failed);
  }

  try {
    fs.unlinkSync(STATE_PATH);
  } catch {
    /* noop */
  }
};
