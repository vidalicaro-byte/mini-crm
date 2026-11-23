import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '../../mocks/server';
import { renderApp } from '../../test/renderApp';

describe('OverviewCounts', () => {
  it('shows the totals once they load', async () => {
    await renderApp('/');

    // "Contatos" is also a menu link, so scope the lookup to the page content.
    const content = within(screen.getByRole('main'));
    expect(await content.findByText('180')).toBeInTheDocument();
    expect(content.getByText('40')).toBeInTheDocument();
    expect(content.getByText('Contatos')).toBeInTheDocument();
    expect(content.getByText('Empresas')).toBeInTheDocument();
  });

  it('shows an error with a retry button, and recovers when the retry succeeds', async () => {
    server.use(
      http.get('/api/contacts', () => HttpResponse.json({ message: 'Falha' }, { status: 500 })),
    );
    const { user } = await renderApp('/');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar os totais.',
    );

    server.resetHandlers();
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByText('180')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
