import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { configDefaults, defineConfig } from 'vitest/config';

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  resolve: {
    // Only in the production build: tests and the dev server keep the real package.
    alias:
      command === 'build'
        ? [
            {
              find: 'tldts',
              replacement: fileURLToPath(new URL('./src/mocks/tldts-stub.ts', import.meta.url)),
            },
          ]
        : [],
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    // The end-to-end tests are Playwright's (`npm run e2e`), not Vitest's.
    exclude: [...configDefaults.exclude, 'e2e/**'],
    // Each worker holds a whole jsdom: on a small machine too many at once run out of memory.
    // CI machines choose for themselves.
    maxWorkers: process.env.CI ? undefined : 2,
    testTimeout: 40_000,
    hookTimeout: 40_000,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/test/**', 'src/**/*.test.{ts,tsx}'],
    },
  },
}));
