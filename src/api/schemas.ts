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

export const companySchema = z.object({
  id: z.string(),
  name: z.string(),
  industry: z.string(),
  size: z.enum(['pequena', 'media', 'grande']),
  city: z.string(),
  state: z.string(),
  website: z.string(),
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
export type Contact = z.infer<typeof contactSchema>;
export type ContactInput = z.infer<typeof contactInputSchema>;
export type ContactResponse = z.infer<typeof contactResponseSchema>;
export type Deal = z.infer<typeof dealSchema>;
export type DealStage = z.infer<typeof dealStageSchema>;
export type Activity = z.infer<typeof activitySchema>;
export type Seed = z.infer<typeof seedSchema>;
export type Paginated<T> = { data: T[]; total: number; page: number; pageSize: number };
