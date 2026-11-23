import { describe, expect, it } from 'vitest';
import { apiRequest } from '../api/client';
import { dealResponseSchema, paginatedSchema } from '../api/schemas';
import { moveDeal } from '../features/deals/api';
import { signInAs } from '../test/session';
import { db } from './db';

const allDeals = () => apiRequest('/deals', { schema: paginatedSchema(dealResponseSchema) });

describe('GET /api/deals without a contact (the board)', () => {
  it('requires a signed-in user', async () => {
    await expect(allDeals()).rejects.toMatchObject({ status: 401 });
  });

  it('gives the admin every deal, with contact and company names', async () => {
    signInAs('admin');
    const { data } = await allDeals();
    expect(data).toHaveLength(db.deals.length);
    expect(data.every((deal) => deal.contact.name !== '' && deal.company.name !== '')).toBe(true);
  });

  it('gives a seller only their own deals', async () => {
    signInAs('seller');
    const { data } = await allDeals();
    expect(data.length).toBeGreaterThan(0);
    expect(data.length).toBeLessThan(db.deals.length);
    expect(data.every((deal) => deal.ownerId === 'usr_2')).toBe(true);
  });
});

describe('PATCH /api/deals/:id', () => {
  const open = () => {
    const deal = db.deals.find((item) => item.stage === 'novo');
    if (!deal) throw new Error('seed has no new deal');
    return deal;
  };

  it('moves a deal to another stage', async () => {
    signInAs('admin');
    const deal = open();
    const moved = await moveDeal(deal.id, 'proposta');
    expect(moved.stage).toBe('proposta');
    expect(db.deals.find((item) => item.id === deal.id)?.stage).toBe('proposta');
  });

  it('stamps the closing date on a won deal and clears it when reopened', async () => {
    signInAs('admin');
    const deal = open();
    expect((await moveDeal(deal.id, 'ganho')).closedAt).not.toBeNull();
    expect((await moveDeal(deal.id, 'negociacao')).closedAt).toBeNull();
  });

  it('rejects an unknown stage with 422', async () => {
    signInAs('admin');
    await expect(
      apiRequest(`/deals/${open().id}`, {
        schema: dealResponseSchema,
        method: 'PATCH',
        body: { stage: 'voando' },
      }),
    ).rejects.toMatchObject({ status: 422 });
  });

  it('answers 404 for a deal that does not exist', async () => {
    signInAs('admin');
    await expect(moveDeal('nao-existe', 'ganho')).rejects.toMatchObject({ status: 404 });
  });

  it("answers 404 when a seller moves someone else's deal", async () => {
    signInAs('seller');
    const other = db.deals.find((deal) => deal.ownerId !== 'usr_2');
    if (!other) throw new Error('seed has no other owner');
    await expect(moveDeal(other.id, 'ganho')).rejects.toMatchObject({ status: 404 });
    expect(other.stage).not.toBe('ganho');
  });

  it('requires a signed-in user', async () => {
    await expect(moveDeal(open().id, 'ganho')).rejects.toMatchObject({ status: 401 });
  });
});
