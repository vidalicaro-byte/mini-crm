import { expect, test, type Page } from '@playwright/test';
import { goTo, signIn } from './helpers.ts';

const rowLinks = (page: Page) => page.getByRole('grid').getByRole('link');
const total = async (page: Page) => {
  const text = await page
    .locator('output')
    .filter({ hasText: /contato/ })
    .first()
    .innerText();
  return Number(text.replace(/\D/g, ''));
};

test.describe('contacts', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await goTo(page, 'Contatos');
    await expect(rowLinks(page).first()).toBeVisible();
  });

  test('searches on the server, writes it to the URL and clears it', async ({ page }) => {
    const all = await total(page);
    const name = (await rowLinks(page).first().innerText()).trim();

    await page.getByLabel('Buscar contatos').fill(name);
    await expect(page).toHaveURL(/q=/);
    await expect(rowLinks(page).first()).toHaveText(name);
    await expect.poll(() => total(page)).toBeLessThan(all);

    await page.getByRole('button', { name: 'Limpar busca' }).click();
    await expect(page).not.toHaveURL(/q=/);
    await expect.poll(() => total(page)).toBe(all);
  });

  test('shows an empty state for a search with no result and recovers from it', async ({
    page,
  }) => {
    await page.getByLabel('Buscar contatos').fill('zzzz-ninguem');
    await expect(page.getByRole('heading', { name: 'Nenhum contato encontrado' })).toBeVisible();
    await page.getByRole('button', { name: 'Limpar filtros' }).first().click();
    await expect(rowLinks(page).first()).toBeVisible();
  });

  test('pages through the list and keeps the page in the URL', async ({ page }) => {
    const first = (await rowLinks(page).first().innerText()).trim();
    await page.getByRole('button', { name: /próxima página/i }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(rowLinks(page).first()).not.toHaveText(first);
  });

  test('goes back from a contact to the same filtered list', async ({ page }) => {
    const name = (await rowLinks(page).first().innerText()).trim();
    await page.getByLabel('Buscar contatos').fill(name);
    await expect(page).toHaveURL(/q=/);

    await rowLinks(page).first().click();
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
    await page.getByRole('link', { name: 'Voltar para contatos' }).click();

    await expect(page).toHaveURL(/q=/);
    await expect(page.getByLabel('Buscar contatos')).toHaveValue(name);
  });

  test('creates a contact and finds it in the list', async ({ page }) => {
    await page.getByRole('link', { name: 'Novo contato' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Novo contato' })).toBeVisible();
    await page.getByLabel(/Nome/).fill('Beatriz Exemplo Teste');
    await page.getByLabel(/E-mail/).fill('beatriz.exemplo@teste.dev');
    await page.getByLabel('Telefone').fill('11912345678');
    await page.getByLabel('Cargo').fill('Diretora');
    await page.getByRole('combobox', { name: /Empresa/ }).click();
    await page.getByRole('option').first().click();
    await page.getByRole('button', { name: 'Criar contato' }).click();

    await expect(
      page.getByRole('heading', { level: 1, name: 'Beatriz Exemplo Teste' }),
    ).toBeVisible();
    await expect(page.getByRole('alert').filter({ hasText: /criado/i })).toBeVisible();

    await goTo(page, 'Contatos');
    await page.getByLabel('Buscar contatos').fill('Beatriz Exemplo');
    await expect(rowLinks(page)).toHaveCount(1);
  });

  test('refuses a second contact with an e-mail already in use', async ({ page }) => {
    const create = async (name: string) => {
      await page.getByRole('link', { name: 'Novo contato' }).click();
      await expect(page.getByRole('heading', { level: 1, name: 'Novo contato' })).toBeVisible();
      await page.getByLabel(/Nome/).fill(name);
      await page.getByLabel(/E-mail/).fill('repetido@teste.dev');
      await page.getByRole('combobox', { name: /Empresa/ }).click();
      await page.getByRole('option').first().click();
      await page.getByRole('button', { name: 'Criar contato' }).click();
    };

    await create('Primeira Pessoa');
    await expect(page.getByRole('heading', { level: 1, name: 'Primeira Pessoa' })).toBeVisible();
    await goTo(page, 'Contatos');

    await create('Segunda Pessoa');
    await expect(page.getByText('Já existe um contato com este e-mail.')).toBeVisible();
    await expect(page.getByLabel(/Nome/)).toHaveValue('Segunda Pessoa');
  });
});

test('a seller sees fewer contacts than the administrator', async ({ page }) => {
  await signIn(page, 'admin');
  await goTo(page, 'Contatos');
  await expect(rowLinks(page).first()).toBeVisible();
  const admin = await total(page);

  await page.getByRole('button', { name: /Conta de/ }).click();
  await page.getByRole('menuitem', { name: 'Sair' }).click();
  await signIn(page, 'seller');
  await goTo(page, 'Contatos');
  await expect(rowLinks(page).first()).toBeVisible();
  expect(await total(page)).toBeLessThan(admin);
});
