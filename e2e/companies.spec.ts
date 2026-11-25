import { expect, test, type Page } from '@playwright/test';
import { goTo, signIn } from './helpers.ts';

const rowLinks = (page: Page) => page.getByRole('grid').getByRole('link');
const total = async (page: Page) => {
  const text = await page
    .locator('output')
    .filter({ hasText: /empresa/ })
    .first()
    .innerText();
  return Number(text.replace(/\D/g, ''));
};

test.beforeEach(async ({ page }) => {
  await signIn(page);
  await goTo(page, 'Empresas');
  await expect(rowLinks(page).first()).toBeVisible();
});

test('lists every company and filters them by size, keeping it in the URL', async ({ page }) => {
  expect(await total(page)).toBe(40);

  await page.getByRole('combobox', { name: 'Porte' }).click();
  await page.getByRole('option', { name: 'Grande' }).click();

  await expect(page).toHaveURL(/porte=grande/);
  await expect.poll(() => total(page)).toBeLessThan(40);
  await expect(page.getByRole('gridcell', { name: 'Pequena' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Limpar filtros' }).click();
  await expect(page).not.toHaveURL(/porte=/);
  await expect.poll(() => total(page)).toBe(40);
});

test('searches by name and shows an empty state when nothing matches', async ({ page }) => {
  await page.getByLabel('Buscar empresas').fill('zzzz-nenhuma');
  await expect(page.getByRole('heading', { name: 'Nenhuma empresa encontrada' })).toBeVisible();
  await page.getByRole('button', { name: 'Limpar filtros' }).first().click();
  await expect(rowLinks(page).first()).toBeVisible();
});

test('opens a company, shows its contacts and goes back to the same filtered list', async ({
  page,
}) => {
  await page.getByRole('combobox', { name: 'Porte' }).click();
  await page.getByRole('option', { name: 'Média' }).click();
  await expect(page).toHaveURL(/porte=media/);

  const name = (await rowLinks(page).first().innerText()).trim();
  await rowLinks(page).first().click();
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Negócios' })).toBeVisible();

  await page.getByRole('link', { name: 'Voltar para empresas' }).click();
  await expect(page).toHaveURL(/porte=media/);
});

test('goes from a company to one of its contacts', async ({ page }) => {
  // The companies with the most contacts come first, so the first one has contacts to open.
  const header = page.getByRole('columnheader', { name: /Contatos/ });
  await header.click();
  await header.click();
  await expect(page).toHaveURL(/sentido=desc/);

  await rowLinks(page).first().click();
  const contactLink = page.getByRole('region', { name: 'Contatos' }).getByRole('link').first();
  await expect(contactLink).toBeVisible();
  const name = (await contactLink.innerText()).trim();
  await contactLink.click();
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
});
