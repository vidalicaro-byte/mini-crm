import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link as RouterLink } from 'react-router';
import { ApiError } from '../../api/client';
import { contactInputSchema, type ContactInput } from '../../api/schemas';
import { CompanyAutocomplete } from '../companies/CompanyAutocomplete';

interface ContactFormProps {
  defaultValues: ContactInput;
  submitLabel: string;
  /** Where "Cancelar" goes. */
  cancelTo: string;
  /** Router state carried to the page "Cancelar" goes to (e.g. the list's filters). */
  cancelState?: unknown;
  /** Saves the contact. Throwing an ApiError keeps the user on the form with the message. */
  onSubmit: (values: ContactInput) => Promise<void>;
}

export function ContactForm({
  defaultValues,
  submitLabel,
  cancelTo,
  cancelState,
  onSubmit,
}: ContactFormProps) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({ resolver: zodResolver(contactInputSchema), defaultValues });
  const [formError, setFormError] = useState<string | null>(null);

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await onSubmit(values);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        // The only field-level rule the server decides: the e-mail is already taken.
        setError('email', { message: error.message }, { shouldFocus: true });
      } else {
        setFormError(
          error instanceof ApiError && error.status !== 0
            ? error.message
            : 'Não foi possível salvar. Verifique a conexão e tente novamente.',
        );
      }
    }
  });

  return (
    <form onSubmit={submit} noValidate aria-label="Dados do contato">
      <Stack spacing={2.5} sx={{ maxWidth: 560, mt: 2 }}>
        {formError && <Alert severity="error">{formError}</Alert>}
        <TextField
          label="Nome"
          required
          autoComplete="off"
          error={Boolean(errors.name)}
          helperText={errors.name?.message}
          {...register('name')}
        />
        <TextField
          label="E-mail"
          type="email"
          required
          autoComplete="off"
          error={Boolean(errors.email)}
          helperText={errors.email?.message}
          {...register('email')}
        />
        <TextField
          label="Telefone"
          type="tel"
          autoComplete="off"
          placeholder="(11) 91234-5678"
          error={Boolean(errors.phone)}
          helperText={errors.phone?.message ?? 'Opcional, com DDD.'}
          {...register('phone')}
        />
        <TextField
          label="Cargo"
          autoComplete="off"
          error={Boolean(errors.jobTitle)}
          helperText={errors.jobTitle?.message}
          {...register('jobTitle')}
        />
        <Controller
          name="companyId"
          control={control}
          render={({ field }) => (
            <CompanyAutocomplete
              required
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              inputRef={field.ref}
              error={Boolean(errors.companyId)}
              helperText={errors.companyId?.message}
            />
          )}
        />
        <Stack direction="row" spacing={1.5}>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando…' : submitLabel}
          </Button>
          <Button component={RouterLink} to={cancelTo} state={cancelState}>
            Cancelar
          </Button>
        </Stack>
      </Stack>
    </form>
  );
}
