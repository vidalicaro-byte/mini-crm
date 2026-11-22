import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { server } from '../mocks/server';
import { ApiError, apiRequest } from './client';

const schema = z.object({ ok: z.boolean() });

describe('apiRequest', () => {
  it('returns the validated body', async () => {
    server.use(http.get('/api/ping', () => HttpResponse.json({ ok: true })));
    await expect(apiRequest('/ping', { schema })).resolves.toEqual({ ok: true });
  });

  it('sends query params and skips empty ones', async () => {
    let received = '';
    server.use(
      http.get('/api/search', ({ request }) => {
        received = new URL(request.url).search;
        return HttpResponse.json({ ok: true });
      }),
    );
    await apiRequest('/search', {
      schema,
      query: { q: 'ana', page: 2, empty: '', missing: undefined },
    });
    expect(received).toBe('?q=ana&page=2');
  });

  it('turns an error response into an ApiError using the server message', async () => {
    server.use(
      http.get('/api/ping', () =>
        HttpResponse.json({ message: 'Sem permissão.' }, { status: 403 }),
      ),
    );
    await expect(apiRequest('/ping', { schema })).rejects.toMatchObject({
      name: 'ApiError',
      status: 403,
      message: 'Sem permissão.',
    });
  });

  it('falls back to a generic message when the error body is not JSON', async () => {
    server.use(http.get('/api/ping', () => new HttpResponse('boom', { status: 500 })));
    await expect(apiRequest('/ping', { schema })).rejects.toMatchObject({
      status: 500,
      message: 'Erro inesperado (500).',
    });
  });

  it('rejects a body that does not match the schema', async () => {
    server.use(http.get('/api/ping', () => HttpResponse.json({ ok: 'yes' })));
    await expect(apiRequest('/ping', { schema })).rejects.toThrow(
      'O servidor enviou uma resposta inesperada.',
    );
  });

  it('reports network failures with status 0', async () => {
    server.use(http.get('/api/ping', () => HttpResponse.error()));
    const error = await apiRequest('/ping', { schema }).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 0, message: 'Não foi possível conectar ao servidor.' });
  });
});
