import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { createQueryClient } from '../api/queryClient';
import { AppProviders } from '../app/AppProviders';
import { routes } from '../app/routes';
import { signInAs, type TestUser } from './session';

/** The app's own client (including its 401 handling) but with no retries, so errors show at once. */
export function createTestQueryClient() {
  return createQueryClient({ retry: false });
}

/**
 * Renders the whole app on an in-memory router, starting at `path`, and waits for the first
 * page to appear (the session is checked with the API before anything shows).
 * By default the admin is already signed in; pass `{ as: null }` to start signed out.
 * Pass `{ waitForPage: false }` when no page is expected to show up (e.g. a failing session check).
 */
export async function renderApp(
  path = '/',
  { as = 'admin', waitForPage = true }: { as?: TestUser | null; waitForPage?: boolean } = {},
) {
  if (as) signInAs(as);
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const user = userEvent.setup();
  const queryClient = createTestQueryClient();
  render(
    <AppProviders queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  // Generous: the first visit to a lazy page imports its code, which can take several seconds on a
  // cold start. Normal runs return as soon as the heading shows up.
  if (waitForPage) await screen.findByRole('heading', { level: 1 }, { timeout: 30_000 });
  return { user, router, queryClient };
}
