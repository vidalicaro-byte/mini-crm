import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import { tokenStore } from '../api/tokenStore';
import { resetDb } from '../mocks/db';
import { server } from '../mocks/server';
import { mockViewport } from './matchMedia';

// Pages load on demand: the first visit in each test file has to transform and import the page's
// code, which is slow on a cold start (notably on Windows). Wait longer instead of flaking.
configure({ asyncUtilTimeout: 5000 });

beforeAll(() => {
  // A request with no handler is a bug in the test, not something to let through.
  server.listen({ onUnhandledFrame: 'error' });
});

beforeEach(() => {
  mockViewport('desktop');
});

afterEach(() => {
  cleanup();
  tokenStore.clear();
  localStorage.clear();
  server.resetHandlers();
  resetDb();
});

afterAll(() => {
  server.close();
});
