/* eslint-disable no-console -- a command-line tool: printing is its output */
/**
 * Measures the built app with Lighthouse and prints the median of several runs per page.
 *
 *   npm run lighthouse                 mobile and desktop, 3 runs each (about 10 minutes)
 *   FORMS=mobile npm run lighthouse    only the phone profile
 *   RUNS=1 npm run lighthouse          a quick look
 *
 * It builds the app, serves it, signs in once with the demo account (Lighthouse reuses that
 * browser) and measures each page. Set E2E_BROWSER_PATH to use an installed Chrome.
 */
import { chromium } from '@playwright/test';
import lighthouse, { type Flags } from 'lighthouse';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build, preview } from 'vite';

const PORT = 4174;
const DEBUG_PORT = 9223;
const BASE = `http://localhost:${PORT}`;
const RUNS = Number(process.env.RUNS ?? 3);
const FORMS = (process.env.FORMS ?? 'mobile,desktop').split(',');

const pages = [
  { name: 'Login', path: '/login', signedIn: false },
  { name: 'Visão geral', path: '/', signedIn: true },
  { name: 'Contatos', path: '/contatos', signedIn: true },
  { name: 'Funil', path: '/funil', signedIn: true },
];

const desktopConfig = {
  extends: 'lighthouse:default',
  settings: {
    formFactor: 'desktop',
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false,
    },
    throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 },
  },
} as const;

const median = (values: number[]) =>
  [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)] ?? 0;

console.log('Building…');
await build({ logLevel: 'error' });
const server = await preview({ logLevel: 'error', preview: { port: PORT, strictPort: true } });
const profile = await mkdtemp(join(tmpdir(), 'mini-crm-lighthouse-'));
const context = await chromium.launchPersistentContext(profile, {
  executablePath: process.env.E2E_BROWSER_PATH || undefined,
  args: [`--remote-debugging-port=${DEBUG_PORT}`],
});

async function signIn() {
  const page = context.pages()[0] ?? (await context.newPage());
  await page.goto(`${BASE}/login`);
  await page.getByRole('button', { name: 'Entrar como administradora' }).click();
  await page.getByRole('heading', { level: 1, name: 'Visão geral' }).waitFor();
  return page;
}

async function signOut() {
  const page = context.pages()[0];
  if (!page) return;
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${BASE}/login`);
}

const rows: string[] = [];
try {
  await signIn();
  for (const form of FORMS) {
    for (const { name, path, signedIn } of pages) {
      // The login page sends signed-in people away, so it is measured signed out.
      if (!signedIn) await signOut();
      const runs = [];
      for (let i = 0; i < RUNS; i += 1) {
        const flags: Flags = {
          port: DEBUG_PORT,
          logLevel: 'error',
          disableStorageReset: true,
          onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        };
        const result = await lighthouse(
          `${BASE}${path}`,
          flags,
          form === 'desktop' ? desktopConfig : undefined,
        );
        if (!result) throw new Error(`No result for ${name}`);
        const { categories, audits } = result.lhr;
        runs.push({
          performance: Math.round((categories.performance?.score ?? 0) * 100),
          accessibility: Math.round((categories.accessibility?.score ?? 0) * 100),
          bestPractices: Math.round((categories['best-practices']?.score ?? 0) * 100),
          seo: Math.round((categories.seo?.score ?? 0) * 100),
          lcp: audits['largest-contentful-paint']?.numericValue ?? 0,
          tbt: audits['total-blocking-time']?.numericValue ?? 0,
          cls: audits['cumulative-layout-shift']?.numericValue ?? 0,
        });
      }
      const row = `| ${form} | ${name} | ${median(runs.map((r) => r.performance))} | ${median(runs.map((r) => r.accessibility))} | ${median(runs.map((r) => r.bestPractices))} | ${median(runs.map((r) => r.seo))} | ${(median(runs.map((r) => r.lcp)) / 1000).toFixed(1)} s | ${Math.round(median(runs.map((r) => r.tbt)))} ms | ${median(runs.map((r) => r.cls)).toFixed(3)} |`;
      rows.push(row);
      console.log(row);
      if (!signedIn) await signIn();
    }
  }
  console.log(
    `\nMedian of ${RUNS} runs.\n\n| Profile | Page | Performance | Accessibility | Best practices | SEO | LCP | TBT | CLS |\n|---|---|---|---|---|---|---|---|---|\n${rows.join('\n')}`,
  );
} finally {
  await context.close();
  await server.close();
  await rm(profile, { recursive: true, force: true });
}
