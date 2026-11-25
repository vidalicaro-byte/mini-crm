import { z } from 'zod';

export const userRoleSchema = z.enum(['admin', 'vendedor']);
export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: userRoleSchema,
});

export const loginRequestSchema = z.object({
  // Trimmed first: people often paste an address with a trailing space.
  email: z.string().trim().pipe(z.email('Informe um e-mail válido.')),
  password: z.string().min(1, 'Informe a senha.'),
});
export const loginResponseSchema = z.object({ token: z.string(), user: userSchema });

export const COMPANY_SIZES = ['pequena', 'media', 'grande'] as const;
export const companySizeSchema = z.enum(COMPANY_SIZES);

export const companySchema = z.object({
  id: z.string(),
  name: z.string(),
  industry: z.string(),
  size: companySizeSchema,
  city: z.string(),
  state: z.string(),
  website: z.string(),
});

/**
 * What the API returns for a company: the record plus figures about the people the viewer may
 * see (a seller's figures only count their own contacts and deals).
 */
export const companyResponseSchema = companySchema.extend({
  contactsCount: z.number(),
  openDeals: z.object({ count: z.number(), value: z.number() }),
});

export const contactSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  jobTitle: z.string(),
  companyId: z.string(),
  ownerId: z.string(),
  createdAt: z.string(),
});

/** What the API returns for a contact: the record plus its company's name. */
export const contactResponseSchema = contactSchema.extend({
  company: z.object({ id: z.string(), name: z.string() }),
});

/** What the contact form sends (and the API accepts): validated the same way on both sides. */
export const contactInputSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome (mínimo 2 letras).').max(100, 'Nome muito longo.'),
  email: z.string().trim().pipe(z.email('Informe um e-mail válido.')),
  // Optional, but when present it must look like a Brazilian number with area code.
  phone: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || /^\d{10,11}$/.test(value.replace(/\D/g, '')),
      'Informe o telefone com DDD, por exemplo (11) 91234-5678.',
    ),
  jobTitle: z.string().trim().max(80, 'Cargo muito longo.'),
  companyId: z.string().min(1, 'Escolha a empresa.'),
});

export const dealStageSchema = z.enum([
  'novo',
  'contato',
  'proposta',
  'negociacao',
  'ganho',
  'perdido',
]);
export const dealSchema = z.object({
  id: z.string(),
  title: z.string(),
  value: z.number(),
  stage: dealStageSchema,
  contactId: z.string(),
  companyId: z.string(),
  ownerId: z.string(),
  createdAt: z.string(),
  expectedCloseDate: z.string(),
  closedAt: z.string().nullable(),
});

/** What the API returns for a deal: the record plus the names the board and lists display. */
export const dealResponseSchema = dealSchema.extend({
  contact: z.object({ id: z.string(), name: z.string() }),
  company: z.object({ id: z.string(), name: z.string() }),
});

export const PERIODS = ['7d', '30d', '90d', '12m'] as const;
export const periodSchema = z.enum(PERIODS);

const trendSchema = z.object({ current: z.number(), previous: z.number() });

/** The overview's numbers, computed by the API for the chosen period and the user's own data. */
export const overviewSchema = z.object({
  period: periodSchema,
  totals: z.object({ contacts: z.number(), companies: z.number() }),
  newContacts: trendSchema,
  wonRevenue: trendSchema,
  /** Won / (won + lost) among deals closed in the period; null when none was closed. */
  conversionRate: z.object({ current: z.number().nullable(), previous: z.number().nullable() }),
  /** A snapshot of now: deals that are not won or lost yet. */
  openDeals: z.object({ count: z.number(), value: z.number() }),
  /** Deals created in the period, by the stage they are in now. */
  funnel: z.array(z.object({ stage: dealStageSchema, count: z.number(), value: z.number() })),
  revenue: z.object({
    granularity: z.enum(['day', 'week', 'month']),
    buckets: z.array(z.object({ start: z.string(), value: z.number() })),
  }),
});

export const activitySchema = z.object({
  id: z.string(),
  type: z.enum(['call', 'email', 'meeting', 'note']),
  contactId: z.string(),
  dealId: z.string().nullable(),
  ownerId: z.string(),
  date: z.string(),
  summary: z.string(),
});

export const seedSchema = z.object({
  referenceDate: z.string(),
  users: z.array(userSchema),
  companies: z.array(companySchema),
  contacts: z.array(contactSchema),
  deals: z.array(dealSchema),
  activities: z.array(activitySchema),
});

export function paginatedSchema<T extends z.ZodType>(item: T) {
  return z.object({
    data: z.array(item),
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
  });
}

export const apiErrorBodySchema = z.object({ message: z.string() });

export type User = z.infer<typeof userSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type Company = z.infer<typeof companySchema>;
export type CompanySize = z.infer<typeof companySizeSchema>;
export type CompanyResponse = z.infer<typeof companyResponseSchema>;
export type Contact = z.infer<typeof contactSchema>;
export type ContactInput = z.infer<typeof contactInputSchema>;
export type ContactResponse = z.infer<typeof contactResponseSchema>;
export type Deal = z.infer<typeof dealSchema>;
export type Period = z.infer<typeof periodSchema>;
export type Overview = z.infer<typeof overviewSchema>;
export type DealResponse = z.infer<typeof dealResponseSchema>;
export type DealStage = z.infer<typeof dealStageSchema>;
export type Activity = z.infer<typeof activitySchema>;
export type Seed = z.infer<typeof seedSchema>;
export type Paginated<T> = { data: T[]; total: number; page: number; pageSize: number };
