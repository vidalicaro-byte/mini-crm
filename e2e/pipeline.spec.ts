import { expect, test, type Page } from '@playwright/test';
import { goTo, signIn } from './helpers.ts';

const column = (page: Page, stage: string) =>
  page.getByRole('region', { name: new RegExp(`^${stage}`) });

/** The title of the first card in a column. */
async function firstCardTitle(page: Page, stage: string) {
  const heading = column(page, stage).getByRole('heading', { level: 3 }).first();
  await expect(heading).toBeVisible();
  return (await heading.innerText()).trim();
}

test.beforeEach(async ({ page }) => {
  await signIn(page);
  await goTo(page, 'Funil');
});

test('moves a deal with the "Mover" menu', async ({ page }) => {
  const title = await firstCardTitle(page, 'Novo');
  await page.getByRole('button', { name: `Mover ${title}` }).click();
  await page.getByRole('menuitem', { name: 'Proposta' }).click();
  await expect(
    column(page, 'Proposta').getByRole('heading', { level: 3, name: title }),
  ).toBeVisible();
  await expect(column(page, 'Novo').getByRole('heading', { level: 3, name: title })).toHaveCount(0);
});

test('moves a deal with the keyboard only', async ({ page }) => {
  const title = await firstCardTitle(page, 'Novo');
  await page.getByRole('button', { name: `Arrastar ${title}` }).focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowRight');
  // The announcement for screen readers also tells us the move has been registered.
  await expect(
    page.locator('[aria-live]').filter({ hasText: 'está sobre a etapa Contato' }),
  ).toBeAttached();
  await page.keyboard.press('Space');
  await expect(
    column(page, 'Contato').getByRole('heading', { level: 3, name: title }),
  ).toBeVisible();
});

test('moves a deal by dragging it with the mouse', async ({ page, isMobile }) => {
  test.skip(
    isMobile,
    'Dragging with a mouse is a desktop interaction; phones use the menu or touch.',
  );
  const title = await firstCardTitle(page, 'Novo');
  const handle = page.getByRole('button', { name: `Arrastar ${title}` });
  const from = await handle.boundingBox();
  const to = await column(page, 'Proposta').boundingBox();
  if (!from || !to) throw new Error('nothing to drag');

  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + 30, from.y + 10, { steps: 4 });
  await page.mouse.move(to.x + to.width / 2, to.y + 120, { steps: 12 });
  await page.mouse.up();

  await expect(
    column(page, 'Proposta').getByRole('heading', { level: 3, name: title }),
  ).toBeVisible();
});

test('a deal opens its contact', async ({ page }) => {
  const card = column(page, 'Novo').getByRole('listitem').first();
  const contact = card.getByRole('link');
  const name = (await contact.innerText()).trim();
  await contact.click();
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
});
