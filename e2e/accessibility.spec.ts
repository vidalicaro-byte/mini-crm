import { expect, test } from '@playwright/test';
import { expectAccessible, goTo, signIn } from './helpers.ts';

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`accessibility (${colorScheme} theme)`, () => {
    test.use({ colorScheme });

    test('login', async ({ page }) => {
      await page.goto('/login');
      await expect(page.getByRole('heading', { level: 1, name: 'Entrar' })).toBeVisible();
      await expectAccessible(page);
    });

    test('overview', async ({ page }) => {
      await signIn(page);
      await expect(page.getByText('Receita ganha').first()).toBeVisible();
      await expectAccessible(page);
    });

    test('contacts list', async ({ page }) => {
      await signIn(page);
      await goTo(page, 'Contatos');
      await expect(page.getByRole('grid')).toBeVisible();
      await expectAccessible(page);
    });

    test('contact detail', async ({ page }) => {
      await signIn(page);
      await goTo(page, 'Contatos');
      await page.getByRole('grid').getByRole('link').first().click();
      await expect(page.getByRole('heading', { name: 'Histórico de atividades' })).toBeVisible();
      await expectAccessible(page);
    });

    test('new contact form, with its errors showing', async ({ page }) => {
      await signIn(page);
      await goTo(page, 'Contatos');
      await page.getByRole('link', { name: 'Novo contato' }).click();
      await page.getByRole('button', { name: 'Criar contato' }).click();
      await expect(page.getByText('Informe o nome (mínimo 2 letras).')).toBeVisible();
      await expectAccessible(page);
    });

    test('funnel', async ({ page }) => {
      await signIn(page);
      await goTo(page, 'Funil');
      await expect(page.getByRole('heading', { level: 2, name: /Novo/ })).toBeVisible();
      await expectAccessible(page);
    });
  });
}
