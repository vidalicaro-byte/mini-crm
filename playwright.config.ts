import { defineConfig, devices } from '@playwright/test';

const port = 4173;
const isCI = Boolean(process.env.CI);

/**
 * End-to-end tests run against the production build (`vite preview`), the same files that are
 * deployed. The mock API runs inside the browser, so no backend is needed.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  // One browser at a time on a developer machine: each Chromium needs a few hundred MB.
  workers: isCI ? 2 : 1,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'retain-on-failure',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    // Lets a machine without the downloaded browsers use an installed Chrome/Chromium.
    launchOptions: { executablePath: process.env.E2E_BROWSER_PATH || undefined },
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'mobile',
      // Chromium with a phone's viewport and touch (the "Pixel 7" profile), not WebKit.
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: {
    command: `npm run build && npm run preview -- --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !isCI,
    timeout: 180_000,
  },
});
