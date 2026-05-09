/**
 * Shared smoke-state loader. Reads .smoke-state.json produced by global-setup.js.
 * All write specs use this single customer + admin token to stay inside
 * the live backend's auth rate limits (5 register / 5 login per 15min per IP).
 */
import * as fs from 'fs';
import * as path from 'path';
import { api } from './smoke-client';

export interface SmokeCustomer {
  email: string;
  password: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
}

export interface SmokeState {
  baseUrl: string;
  runId: string;
  writesEnabled: boolean;
  adminToken: string | null;
  customer: SmokeCustomer | null;
  warnings: string[];
}

const STATE_PATH = path.resolve(__dirname, '..', '.smoke-state.json');

let _state: SmokeState | null = null;
export function getState(): SmokeState {
  if (_state) return _state;
  if (!fs.existsSync(STATE_PATH)) {
    _state = {
      baseUrl: '',
      runId: 'no-state',
      writesEnabled: false,
      adminToken: null,
      customer: null,
      warnings: ['state file missing — globalSetup did not run'],
    };
    return _state;
  }
  _state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
  return _state!;
}

export function writesReady(): boolean {
  const s = getState();
  return !!(s.writesEnabled && s.customer && s.customer.accessToken);
}

export function adminReady(): boolean {
  return !!getState().adminToken;
}

export function authedAs(token: string) {
  return {
    get: (p: string) => api().get(p).set('Authorization', `Bearer ${token}`),
    post: (p: string) => api().post(p).set('Authorization', `Bearer ${token}`),
    patch: (p: string) =>
      api().patch(p).set('Authorization', `Bearer ${token}`),
    put: (p: string) => api().put(p).set('Authorization', `Bearer ${token}`),
    delete: (p: string) =>
      api().delete(p).set('Authorization', `Bearer ${token}`),
  };
}

export function asCustomer() {
  const c = getState().customer!;
  return authedAs(c.accessToken);
}

export function asAdmin() {
  const t = getState().adminToken!;
  return authedAs(t);
}
