import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import { resetDb } from '../mocks/db';
import { server } from '../mocks/server';
import { mockViewport } from './matchMedia';

beforeAll(() => {
  // A request with no handler is a bug in the test, not something to let through.
  server.listen({ onUnhandledFrame: 'error' });
});

beforeEach(() => {
  mockViewport('desktop');
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  server.resetHandlers();
  resetDb();
});

afterAll(() => {
  server.close();
});
