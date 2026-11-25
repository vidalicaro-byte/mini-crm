import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

export type Account = 'admin' | 'seller';

const accountButton: Record<Account, string> = {
  admin: 'Entrar como administradora',
  seller: 'Entrar como vendedor',
};

/** Signs in with the one-click demo account and waits for the overview. */
export async function signIn(page: Page, account: Account = 'admin') {
  await page.goto('/login');
  await page.getByRole('button', { name: accountButton[account] }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Visão geral' })).toBeVisible();
}

/** Goes to a page through the menu, opening the drawer first on a phone. */
export async function goTo(
  page: Page,
  name: 'Visão geral' | 'Contatos' | 'Empresas' | 'Funil' | 'Equipe',
) {
  const menuButton = page.getByRole('button', { name: 'Abrir menu de navegação' });
  if (await menuButton.isVisible()) await menuButton.click();
  await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name }).click();
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
}

/** Fails with a readable list of the accessibility problems axe finds on the current page. */
export async function expectAccessible(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const report = violations.map(
    ({ id, impact, help, nodes }) =>
      `${impact}: ${id} — ${help}\n${nodes
        .slice(0, 3)
        .map((node) => `    ${node.target.join(' ')}`)
        .join('\n')}`,
  );
  expect(report, report.join('\n')).toEqual([]);
}
