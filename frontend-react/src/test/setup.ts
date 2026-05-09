import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

// Mock CSS modules: every imported `xxx.module.css` becomes a Proxy returning
// the requested key, so `styles.wrap` -> 'wrap'. Keeps tests independent of CSS.
// (Vitest already handles via `css: false`, but components reading style values
// need a stable identity — return the key.)
