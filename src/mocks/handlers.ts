import { delay, http, HttpResponse } from 'msw';
import {
  loginRequestSchema,
  type Company,
  type Contact,
  type ContactResponse,
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

function sortBy<T>(items: T[], key: (item: T) => string, order: string | null) {
  const direction = order === 'desc' ? -1 : 1;
  return [...items].sort((a, b) => collator.compare(key(a), key(b)) * direction);
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

const contactByName = (contact: ContactResponse) => contact.name;
const contactSorters: Record<string, (contact: ContactResponse) => string> = {
  name: contactByName,
  email: (contact) => contact.email,
  company: (contact) => contact.company.name,
  createdAt: (contact) => contact.createdAt,
};

const companyByName = (company: Company) => company.name;
const companySorters: Record<string, (company: Company) => string> = {
  name: companyByName,
  industry: (company) => company.industry,
  city: (company) => company.city,
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

  // --- Deals and activities of a contact (same visibility rule as the contact itself) ------

  http.get('/api/deals', async ({ request }) => {
    await delay();
    const user = authenticate(request);
    if (!user) return unauthorized();

    const contactId = new URL(request.url).searchParams.get('contactId');
    if (!contactId) {
      return HttpResponse.json({ message: 'Informe o contato.' }, { status: 400 });
    }
    if (!canSeeContact(user, contactId)) return notFound('Contato não encontrado.');

    const deals = db.deals
      .filter((deal) => deal.contactId === contactId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return HttpResponse.json(paginate(deals, 1, 100));
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
    if (!authenticate(request)) return unauthorized();

    const params = new URL(request.url).searchParams;
    const { page, pageSize } = readPagination(params);
    const sorter = companySorters[params.get('sort') ?? 'name'] ?? companyByName;

    const filtered = db.companies.filter((company) =>
      matches(params.get('q'), company.name, company.industry, company.city),
    );
    const sorted = sortBy(filtered, sorter, params.get('order'));
    return HttpResponse.json(paginate(sorted, page, pageSize));
  }),

  http.get('/api/companies/:id', async ({ request, params }) => {
    await delay();
    if (!authenticate(request)) return unauthorized();

    const company = db.companies.find((item) => item.id === params.id);
    return company ? HttpResponse.json(company) : notFound('Empresa não encontrada.');
  }),
];
