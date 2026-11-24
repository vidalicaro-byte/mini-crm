import { expect, test } from '@playwright/test';
import { signIn } from './helpers.ts';

test('sends a visitor without a session to the login page', async ({ page }) => {
  await page.goto('/contatos');
  await expect(page.getByRole('heading', { level: 1, name: 'Entrar' })).toBeVisible();
});

test('shows the server message for a wrong password and keeps the e-mail', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill('marina@minicrm.demo');
  await page.getByLabel('Senha').fill('senha-errada');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByLabel('E-mail')).toHaveValue('marina@minicrm.demo');
});

test('signs in with e-mail and password, goes back after a reload and signs out', async ({
  page,
}) => {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill('marina@minicrm.demo');
  await page.getByLabel('Senha').fill('demo1234');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Visão geral' })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Visão geral' })).toBeVisible();

  await page.getByRole('button', { name: /Conta de/ }).click();
  await page.getByRole('menuitem', { name: 'Sair' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Entrar' })).toBeVisible();
});

test('a seller does not get the team page, an admin does', async ({ page }) => {
  await signIn(page, 'seller');
  const menuButton = page.getByRole('button', { name: 'Abrir menu de navegação' });
  if (await menuButton.isVisible()) await menuButton.click();
  const nav = page.getByRole('navigation', { name: 'Principal' });
  await expect(nav.getByRole('link', { name: 'Contatos' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Equipe' })).toHaveCount(0);
});
