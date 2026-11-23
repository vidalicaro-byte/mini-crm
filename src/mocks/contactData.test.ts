import { describe, expect, it } from 'vitest';
import { apiRequest } from '../api/client';
import { activitySchema, dealSchema, paginatedSchema } from '../api/schemas';
import { signInAs } from '../test/session';
import { db } from './db';

const getDeals = (contactId?: string) =>
  apiRequest('/deals', { schema: paginatedSchema(dealSchema), query: { contactId } });
const getActivities = (contactId?: string) =>
  apiRequest('/activities', { schema: paginatedSchema(activitySchema), query: { contactId } });

const ownedBy = (ownerId: string) => db.contacts.find((contact) => contact.ownerId === ownerId);
const notOwnedBy = (ownerId: string) => db.contacts.find((contact) => contact.ownerId !== ownerId);

describe.each([
  ['/api/deals', getDeals],
  ['/api/activities', getActivities],
])('GET %s', (_path, request) => {
  it('requires a signed-in user', async () => {
    await expect(request('x')).rejects.toMatchObject({ status: 401 });
  });

  it('requires a contact', async () => {
    signInAs('admin');
    await expect(request()).rejects.toMatchObject({ status: 400 });
  });

  it('answers 404 for a contact that does not exist', async () => {
    signInAs('admin');
    await expect(request('nao-existe')).rejects.toMatchObject({ status: 404 });
  });

  it("answers 404 for a seller asking about someone else's contact", async () => {
    signInAs('seller');
    const other = notOwnedBy('usr_2');
    if (!other) throw new Error('seed has no other owner');
    await expect(request(other.id)).rejects.toMatchObject({ status: 404 });
  });
});

describe('contact data', () => {
  it("returns only the contact's own deals", async () => {
    signInAs('seller');
    const contact = ownedBy('usr_2');
    if (!contact) throw new Error('seller owns no contact');
    const { data } = await getDeals(contact.id);
    expect(data.every((deal) => deal.contactId === contact.id)).toBe(true);
    expect(data).toHaveLength(db.deals.filter((deal) => deal.contactId === contact.id).length);
  });

  it('returns activities newest first', async () => {
    signInAs('admin');
    const contact = db.contacts.find(
      (item) => db.activities.filter((activity) => activity.contactId === item.id).length >= 2,
    );
    if (!contact) throw new Error('no contact with activities');
    const { data } = await getActivities(contact.id);
    const dates = data.map((activity) => activity.date);
    expect(dates).toEqual([...dates].sort().reverse());
  });
});
