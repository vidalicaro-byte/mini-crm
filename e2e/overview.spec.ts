import { expect, test } from '@playwright/test';
import { goTo, signIn } from './helpers.ts';

test.beforeEach(async ({ page }) => {
  await signIn(page);
});

test('switches the period, keeps it in the URL and keeps it after a reload', async ({ page }) => {
  await page.getByRole('button', { name: '90 dias' }).click();
  await expect(page).toHaveURL(/periodo=90d/);
  await expect(page.getByRole('button', { name: '90 dias' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await page.reload();
  await expect(page.getByRole('button', { name: '90 dias' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await page.getByRole('button', { name: '30 dias' }).click();
  await expect(page).not.toHaveURL(/periodo=/);
});

test('describes the charts in words and offers their data as a table', async ({ page }) => {
  await page.getByRole('button', { name: '12 meses' }).click();
  await expect(page.getByText('Ver os dados em tabela').first()).toBeVisible();
  await page.getByText('Ver os dados em tabela').last().click();
  await expect(page.getByRole('table').last()).toBeVisible();
});

test('counts a deal as revenue once it is moved to "Ganho"', async ({ page }) => {
  await page.getByRole('button', { name: '90 dias' }).click();
  const revenue = page
    .locator('div', { has: page.getByText('Receita ganha', { exact: true }) })
    .last();
  const before = await revenue.innerText();

  await goTo(page, 'Funil');
  const heading = page
    .getByRole('region', { name: /^Proposta/ })
    .getByRole('heading', { level: 3 })
    .first();
  const title = (await heading.innerText()).trim();
  await page.getByRole('button', { name: `Mover ${title}` }).click();
  await page.getByRole('menuitem', { name: 'Ganho' }).click();
  await expect(
    page.getByRole('region', { name: /^Ganho/ }).getByRole('heading', { level: 3, name: title }),
  ).toBeVisible();

  await goTo(page, 'Visão geral');
  await page.getByRole('button', { name: '90 dias' }).click();
  await expect.poll(() => revenue.innerText()).not.toBe(before);
});
