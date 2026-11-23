import { describe, expect, it } from 'vitest';
import { contactInputSchema } from './schemas';

const valid = {
  name: 'Ana Souza',
  email: 'ana@exemplo.com.br',
  phone: '(11) 91234-5678',
  jobTitle: 'Diretora',
  companyId: 'cmp_1',
};

const messageFor = (input: object) => {
  const result = contactInputSchema.safeParse({ ...valid, ...input });
  return result.success ? null : result.error.issues[0]?.message;
};

describe('contactInputSchema', () => {
  it('accepts a complete contact', () => {
    expect(contactInputSchema.safeParse(valid).success).toBe(true);
  });

  it('trims whitespace around text', () => {
    const result = contactInputSchema.parse({
      ...valid,
      name: '  Ana Souza ',
      email: ' ana@exemplo.com.br ',
    });
    expect(result.name).toBe('Ana Souza');
    expect(result.email).toBe('ana@exemplo.com.br');
  });

  it('requires a name of at least two letters', () => {
    expect(messageFor({ name: '' })).toBe('Informe o nome (mínimo 2 letras).');
    expect(messageFor({ name: ' A ' })).toBe('Informe o nome (mínimo 2 letras).');
  });

  it('requires a well-formed e-mail', () => {
    expect(messageFor({ email: '' })).toBe('Informe um e-mail válido.');
    expect(messageFor({ email: 'ana@' })).toBe('Informe um e-mail válido.');
  });

  it.each(['', '11912345678', '(11) 1234-5678', '1134567890'])('accepts phone %j', (phone) => {
    expect(messageFor({ phone })).toBeNull();
  });

  it.each(['123', '(11) 91234-56789', 'telefone'])('rejects phone %j', (phone) => {
    expect(messageFor({ phone })).toMatch(/DDD/);
  });

  it('allows an empty job title but not an absurdly long one', () => {
    expect(messageFor({ jobTitle: '' })).toBeNull();
    expect(messageFor({ jobTitle: 'x'.repeat(81) })).toBe('Cargo muito longo.');
  });

  it('requires a company', () => {
    expect(messageFor({ companyId: '' })).toBe('Escolha a empresa.');
  });
});
