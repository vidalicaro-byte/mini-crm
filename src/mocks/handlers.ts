import { delay, http, HttpResponse } from 'msw';
import { z } from 'zod';
import { computeOverview } from './overview';
import {
  contactInputSchema,
  dealStageSchema,
  loginRequestSchema,
  periodSchema,
  COMPANY_SIZES,
  type Company,
  type CompanyResponse,
  type Contact,
  type ContactResponse,
  type Deal,
  type DealResponse,
} from '../api/schemas';
import { DEMO_PASSWORD } from '../features/auth/demoAccounts';
import { authenticate, forbidden, signToken, unauthorized } from './auth';
import { db } from './db';

const collator = new Intl.Collator('pt-BR', { sensitivity: 'base' });

function notFound(message: string) {
  return HttpResponse.json({ message }, { status: 404 });
}

function readPagination(params: URLSearchParams) {
  const page = Math.max(1, Number.parseInt(params.get('page') ?? '1', 10) || 1);
  const rawSize = Number.parseInt(params.get('pageSize') ?? '20', 10) || 20;
  return { page, pageSize: Math.min(100, Math.max(1, rawSize)) };
}

function paginate<T>(items: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize;
  return { data: items.slice(start, start + pageSize), total: items.length, page, pageSize };
}

function sortBy<T>(items: T[], key: (item: T) => string | number, order: string | null) {
  const direction = order === 'desc' ? -1 : 1;
  return [...items].sort((a, b) => {
    const left = key(a);
    const right = key(b);
    const result =
      typeof left === 'number' && typeof right === 'number'
        ? left - right
        : collator.compare(String(left), String(right));
    return result * direction;
  });
}

function matches(query: string | null, ...fields: string[]) {
  if (!query) return true;
  const needle = query.trim().toLocaleLowerCase('pt-BR');
  return fields.some((field) => field.toLocaleLowerCase('pt-BR').includes(needle));
}

function toContactResponse(contact: Contact): ContactResponse {
  const company = db.companies.find((item) => item.id === contact.companyId);
  return { ...contact, company: { id: contact.companyId, name: company?.name ?? '' } };
}

function canSeeContact(user: { id: string; role: string }, contactId: string) {
  const contact = db.contacts.find((item) => item.id === contactId);
  return Boolean(contact && (user.role === 'admin' || contact.ownerId === user.id));
}

function canSeeDeal(user: { id: string; role: string }, deal: Deal) {
  return user.role === 'admin' || deal.ownerId === user.id;
}

function toDealResponse(deal: Deal): DealResponse {
  const contact = db.contacts.find((item) => item.id === deal.contactId);
  const company = db.companies.find((item) => item.id === deal.companyId);
  return {
    ...deal,
    contact: { id: deal.contactId, name: contact?.name ?? '' },
    company: { id: deal.companyId, name: company?.name ?? '' },
  };
}

/** A company with the figures the viewer may see: a seller only counts their own contacts and deals. */
function toCompanyResponse(company: Company, user: { id: string; role: string }): CompanyResponse {
  const contactsCount = db.contacts.filter(
    (contact) =>
      contact.companyId === company.id && (user.role === 'admin' || contact.ownerId === user.id),
  ).length;
  const open = db.deals.filter(
    (deal) =>
      deal.companyId === company.id &&
      canSeeDeal(user, deal) &&
      deal.stage !== 'ganho' &&
      deal.stage !== 'perdido',
  );
  return {
    ...company,
    contactsCount,
    openDeals: { count: open.length, value: open.reduce((sum, deal) => sum + deal.value, 0) },
  };
}

function invalid(message = 'Dados inválidos.') {
  return HttpResponse.json({ message }, { status: 422 });
}

/** Rules that need the database: the company must exist and the e-mail must be unique. */
function checkContactInput(input: { email: string; companyId: string }, ignoreId?: string) {
  if (!db.companies.some((company) => company.id === input.companyId)) {
    return invalid('Empresa não encontrada.');
  }
  const email = input.email.toLowerCase();
  const taken = db.contacts.some(
    (contact) => contact.id !== ignoreId && contact.email.toLowerCase() === email,
  );
  return taken
    ? HttpResponse.json({ message: 'Já existe um contato com este e-mail.' }, { status: 409 })
    : null;
}

const contactByName = (contact: ContactResponse) => contact.name;
const contactSorters: Record<string, (contact: ContactResponse) => string> = {
  name: contactByName,
  email: (contact) => contact.email,
  company: (contact) => contact.company.name,
  createdAt: (contact) => contact.createdAt,
};

const companyByName = (company: CompanyResponse) => company.name;
const sizeRank = (company: CompanyResponse) => COMPANY_SIZES.indexOf(company.size);
const companySorters: Record<string, (company: CompanyResponse) => string | number> = {
  name: companyByName,
  industry: (company) => company.industry,
  size: sizeRank,
  city: (company) => company.city,
  contactsCount: (company) => company.contactsCount,
  openDealsValue: (company) => company.openDeals.value,
};

export const handlers = [
  // --- Authentication ---------------------------------------------------------------------

  http.post('/api/auth/login', async ({ request }) => {
    await delay();
    const credentials = loginRequestSchema.safeParse(await request.json().catch(() => null));
    if (!credentials.success) {
      return HttpResponse.json({ message: 'Informe e-mail e senha.' }, { status: 400 });
    }

    const email = credentials.data.email.trim().toLowerCase();
    const user = db.users.find((item) => item.email.toLowerCase() === email);
    if (!user || credentials.data.password !== DEMO_PASSWORD) {
      return HttpResponse.json({ message: 'E-mail ou senha incorretos.' }, { status: 401 });
    }
    return HttpResponse.json({ token: signToken(user), user });
  }),

  http.get('/api/auth/me', async ({ request }) => {
    await delay();
    const user = authenticate(request);
    return user ? HttpResponse.json(user) : unauthorized();
  }),

  // --- Users (admin only) -----------------------------------------------------------------

  http.get('/api/users', async ({ request }) => {
    await delay();
    const user = authenticate(request);
    if (!user) return unauthorized();
    if (user.role !== 'admin') return forbidden();

    const { page, pageSize } = readPagination(new URL(request.url).searchParams);
    return HttpResponse.json(
      paginate(
        sortBy(db.users, (item) => item.name, 'asc'),
        page,
        pageSize,
      ),
    );
  }),

  // --- Contacts: sellers only see the contacts they own -----------------------------------

  http.get('/api/contacts', async ({ request }) => {
    await delay();
    const user = authenticate(request);
    if (!user) return unauthorized();

    const params = new URL(request.url).searchParams;
    const { page, pageSize } = readPagination(params);
    const companyId = params.get('companyId');
    const sorter = contactSorters[params.get('sort') ?? 'name'] ?? contactByName;

    const filtered = db.contacts
      .filter((contact) => user.role === 'admin' || contact.ownerId === user.id)
      .filter((contact) => !companyId || contact.companyId === companyId)
      .map(toContactResponse)
      .filter((contact) =>
        matches(params.get('q'), contact.name, contact.email, contact.company.name),
      );

    const sorted = sortBy(filtered, sorter, params.get('order'));
    return HttpResponse.json(paginate(sorted, page, pageSize));
  }),

  http.get('/api/contacts/:id', async ({ request, params }) => {
    await delay();
    const user = authenticate(request);
    if (!user) return unauthorized();

    const contact = db.contacts.find((item) => item.id === params.id);
    // Someone else's contact is reported as missing, so its existence isn't revealed.
    const visible = contact && (user.role === 'admin' || contact.ownerId === user.id);
    return visible
      ? HttpResponse.json(toContactResponse(contact))
      : notFound('Contato não encontrado.');
  }),

  http.post('/api/contacts', async ({ request }) => {
    await delay();
    const user = authenticate(request);
    if (!user) return unauthorized();

    const input = contactInputSchema.safeParse(await request.json().catch(() => null));
    if (!input.success) return invalid(input.error.issues[0]?.message);
    const problem = checkContactInput(input.data);
    if (problem) return problem;

    // The new contact belongs to whoever creates it.
    const contact: Contact = {
      ...input.data,
      id: `ct_${crypto.randomUUID().slice(0, 8)}`,
      ownerId: user.id,
      createdAt: new Date().toISOString(),
    };
    db.contacts.push(contact);
    return HttpResponse.json(toContactResponse(contact), { status: 201 });
  }),

  http.patch('/api/contacts/:id', async ({ request, params }) => {
    await delay();
    const user = authenticate(request);
    if (!user) return unauthorized();

    const contact = db.contacts.find((item) => item.id === params.id);
    if (!contact || !canSeeContact(user, contact.id)) return notFound('Contato não encontrado.');

    const input = contactInputSchema.safeParse(await request.json().catch(() => null));
    if (!input.success) return invalid(input.error.issues[0]?.message);
    const problem = checkContactInput(input.data, contact.id);
    if (problem) return problem;

    Object.assign(contact, input.data);
    return HttpResponse.json(toContactResponse(contact));
  }),

  http.get('/api/overview', async ({ request }) => {
    await delay();
    const user = authenticate(request);
    if (!user) return unauthorized();

    const period = periodSchema.safeParse(new URL(request.url).searchParams.get('period') ?? '30d');
    if (!period.success)
      return HttpResponse.json({ message: 'Período inválido.' }, { status: 400 });

    return HttpResponse.json(computeOverview(db, user, period.data));
  }),

  // --- Deals and activities of a contact (same visibility rule as the contact itself) ------

  http.get('/api/deals', async ({ request }) => {
    await delay();
    const user = authenticate(request);
    if (!user) return unauthorized();

    const params = new URL(request.url).searchParams;
    const contactId = params.get('contactId');
    const companyId = params.get('companyId');
    if (contactId && !canSeeContact(user, contactId)) return notFound('Contato não encontrado.');

    // With a contact: that contact's deals. Otherwise the deals the user may see, optionally
    // narrowed to one company (the funnel board asks for all of them).
    const deals = db.deals
      .filter((deal) => (contactId ? deal.contactId === contactId : canSeeDeal(user, deal)))
      .filter((deal) => !companyId || deal.companyId === companyId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(toDealResponse);
    return HttpResponse.json(paginate(deals, 1, 200));
  }),

  http.patch('/api/deals/:id', async ({ request, params }) => {
    await delay();
    const user = authenticate(request);
    if (!user) return unauthorized();

    const deal = db.deals.find((item) => item.id === params.id);
    if (!deal || !canSeeDeal(user, deal)) return notFound('Negócio não encontrado.');

    const body = z
      .object({ stage: dealStageSchema })
      .safeParse(await request.json().catch(() => null));
    if (!body.success) return invalid('Etapa inválida.');

    deal.stage = body.data.stage;
    // Closing a deal stamps the date; reopening it clears it.
    const closed = deal.stage === 'ganho' || deal.stage === 'perdido';
    deal.closedAt = closed ? (deal.closedAt ?? new Date().toISOString()) : null;
    return HttpResponse.json(toDealResponse(deal));
  }),

  http.get('/api/activities', async ({ request }) => {
    await delay();
    const user = authenticate(request);
    if (!user) return unauthorized();

    const contactId = new URL(request.url).searchParams.get('contactId');
    if (!contactId) {
      return HttpResponse.json({ message: 'Informe o contato.' }, { status: 400 });
    }
    if (!canSeeContact(user, contactId)) return notFound('Contato não encontrado.');

    const activities = db.activities
      .filter((activity) => activity.contactId === contactId)
      .sort((a, b) => b.date.localeCompare(a.date));
    return HttpResponse.json(paginate(activities, 1, 100));
  }),

  // --- Companies: visible to everyone signed in -------------------------------------------

  http.get('/api/companies', async ({ request }) => {
    await delay();
    const user = authenticate(request);
    if (!user) return unauthorized();

    const params = new URL(request.url).searchParams;
    const { page, pageSize } = readPagination(params);
    const sorter = companySorters[params.get('sort') ?? 'name'] ?? companyByName;
    const size = params.get('size');

    const filtered = db.companies
      .filter((company) => !size || company.size === size)
      .map((company) => toCompanyResponse(company, user))
      .filter((company) => matches(params.get('q'), company.name, company.industry, company.city));
    // Sorted by name first, so companies that tie on the chosen column keep a stable order.
    const sorted = sortBy(sortBy(filtered, companyByName, 'asc'), sorter, params.get('order'));
    return HttpResponse.json(paginate(sorted, page, pageSize));
  }),

  http.get('/api/companies/:id', async ({ request, params }) => {
    await delay();
    const user = authenticate(request);
    if (!user) return unauthorized();

    const company = db.companies.find((item) => item.id === params.id);
    return company
      ? HttpResponse.json(toCompanyResponse(company, user))
      : notFound('Empresa não encontrada.');
  }),
];
