import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { useCallback } from 'react';
import { SearchField } from '../../components/SearchField';
import { CompanyAutocomplete } from '../companies/CompanyAutocomplete';
import { hasActiveFilters, type ContactsFilters } from './filters';

interface ContactsToolbarProps {
  filters: ContactsFilters;
  onChange: (patch: Partial<ContactsFilters>, options?: { replace?: boolean }) => void;
  onClear: () => void;
}

export function ContactsToolbar({ filters, onChange, onClear }: ContactsToolbarProps) {
  const search = useCallback(
    (q: string, options: { replace: boolean }) => onChange({ q }, options),
    [onChange],
  );

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
      <SearchField
        label="Buscar contatos"
        placeholder="Nome, e-mail ou empresa"
        value={filters.q}
        onSearch={search}
      />
      <CompanyAutocomplete
        size="small"
        value={filters.companyId}
        onChange={(companyId) => onChange({ companyId })}
        width={{ xs: '100%', sm: 260 }}
      />
      {hasActiveFilters(filters) && (
        <Button onClick={onClear} sx={{ alignSelf: { sm: 'center' }, whiteSpace: 'nowrap' }}>
          Limpar filtros
        </Button>
      )}
    </Stack>
  );
}
