import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';
import { mockViewport } from './matchMedia';

beforeEach(() => {
  mockViewport('desktop');
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});
