/**
 * Generates the demo data used by the mock API (src/mocks/seed.json).
 *
 * Run with `npm run seed`. The output is committed so the data is stable and the
 * production bundle does not need to ship faker. Dates are relative to REFERENCE_DATE;
 * the mock database shifts them to "now" when it loads.
 */
import { fakerPT_BR as faker } from '@faker-js/faker';
import { writeFileSync } from 'node:fs';

const REFERENCE_DATE = new Date('2026-11-21T12:00:00.000Z');
const DAY_MS = 24 * 60 * 60 * 1000;

faker.seed(2026);
faker.setDefaultRefDate(REFERENCE_DATE);

const daysAgo = (days: number) => new Date(REFERENCE_DATE.getTime() - days * DAY_MS);
const addDays = (date: Date, days: number) => new Date(date.getTime() + days * DAY_MS);
const between = (from: Date, to: Date) => faker.date.between({ from, to });
const slug = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const industries = [
  'Tecnologia',
  'Varejo',
  'Saúde',
  'Educação',
  'Indústria',
  'Logística',
  'Serviços financeiros',
  'Agronegócio',
  'Construção',
];
const sizes = ['pequena', 'media', 'grande'] as const;

const users = [
  { id: 'usr_1', name: 'Marina Albuquerque', email: 'marina@minicrm.demo', role: 'admin' },
  { id: 'usr_2', name: 'Rafael Tavares', email: 'rafael@minicrm.demo', role: 'vendedor' },
  { id: 'usr_3', name: 'Camila Duarte', email: 'camila@minicrm.demo', role: 'vendedor' },
  { id: 'usr_4', name: 'Bruno Nogueira', email: 'bruno@minicrm.demo', role: 'vendedor' },
  { id: 'usr_5', name: 'Letícia Moraes', email: 'leticia@minicrm.demo', role: 'vendedor' },
];
const sellers = users.filter((user) => user.role === 'vendedor');

const companies = Array.from({ length: 40 }, (_, index) => {
  const name = faker.company.name();
  return {
    id: `cmp_${index + 1}`,
    name,
    industry: faker.helpers.arrayElement(industries),
    size: faker.helpers.arrayElement(sizes),
    city: faker.location.city(),
    state: faker.location.state({ abbreviated: true }),
    website: `https://www.${slug(name)}.com.br`,
  };
});

const contacts = Array.from({ length: 180 }, (_, index) => {
  const company = faker.helpers.arrayElement(companies);
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  return {
    id: `ct_${index + 1}`,
    name: `${firstName} ${lastName}`,
    email: `${slug(firstName)}.${slug(lastName)}@${slug(company.name)}.com.br`,
    phone: faker.phone.number({ style: 'national' }),
    jobTitle: faker.person.jobTitle(),
    companyId: company.id,
    ownerId: faker.helpers.arrayElement(sellers).id,
    createdAt: between(daysAgo(540), daysAgo(5)).toISOString(),
  };
});

const stageWeights = [
  { value: 'novo', weight: 18 },
  { value: 'contato', weight: 18 },
  { value: 'proposta', weight: 16 },
  { value: 'negociacao', weight: 14 },
  { value: 'ganho', weight: 15 },
  { value: 'perdido', weight: 9 },
] as const;
const dealKinds = [
  'Licenças',
  'Implantação',
  'Contrato anual',
  'Consultoria',
  'Renovação',
  'Upgrade',
];

const deals = Array.from({ length: 90 }, (_, index) => {
  const contact = faker.helpers.arrayElement(contacts);
  const company = companies.find((item) => item.id === contact.companyId);
  const stage = faker.helpers.weightedArrayElement([...stageWeights]);
  const createdAt = between(daysAgo(270), daysAgo(3));
  const expectedCloseDate = addDays(createdAt, faker.number.int({ min: 15, max: 90 }));
  const isClosed = stage === 'ganho' || stage === 'perdido';
  const latestClose = new Date(
    Math.min(REFERENCE_DATE.getTime(), addDays(expectedCloseDate, 30).getTime()),
  );
  const closedAt = isClosed ? between(addDays(createdAt, 1), latestClose) : null;
  return {
    id: `deal_${index + 1}`,
    title: `${faker.helpers.arrayElement(dealKinds)} – ${company?.name ?? ''}`,
    value: faker.number.int({ min: 20, max: 1500 }) * 100,
    stage,
    contactId: contact.id,
    companyId: contact.companyId,
    ownerId: contact.ownerId,
    createdAt: createdAt.toISOString(),
    expectedCloseDate: expectedCloseDate.toISOString(),
    closedAt: closedAt ? closedAt.toISOString() : null,
  };
});

const activityTemplates = {
  call: [
    'Ligação para entender a necessidade',
    'Ligação de acompanhamento',
    'Retorno sobre a proposta',
  ],
  email: [
    'Envio de apresentação comercial',
    'Envio de proposta',
    'Resposta sobre prazos e valores',
  ],
  meeting: [
    'Reunião de descoberta',
    'Demonstração do produto',
    'Reunião de alinhamento com a diretoria',
  ],
  note: [
    'Cliente pediu desconto para fechar neste mês',
    'Decisor está de férias até a próxima semana',
    'Compara com outro fornecedor',
  ],
} as const;

const activities = Array.from({ length: 300 }, (_, index) => {
  const contact = faker.helpers.arrayElement(contacts);
  const contactDeals = deals.filter((deal) => deal.contactId === contact.id);
  const type = faker.helpers.arrayElement(['call', 'email', 'meeting', 'note'] as const);
  const deal = contactDeals.length > 0 ? faker.helpers.arrayElement(contactDeals) : null;
  return {
    id: `act_${index + 1}`,
    type,
    contactId: contact.id,
    dealId: deal ? deal.id : null,
    ownerId: contact.ownerId,
    date: between(new Date(contact.createdAt), REFERENCE_DATE).toISOString(),
    summary: faker.helpers.arrayElement(activityTemplates[type]),
  };
});

const seed = {
  referenceDate: REFERENCE_DATE.toISOString(),
  users,
  companies,
  contacts,
  deals,
  activities,
};

writeFileSync(new URL('../src/mocks/seed.json', import.meta.url), JSON.stringify(seed, null, 2));
process.stdout.write(
  `seed: ${users.length} users, ${companies.length} companies, ${contacts.length} contacts, ${deals.length} deals, ${activities.length} activities\n`,
);
