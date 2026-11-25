import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useCallback } from 'react';
import { COMPANY_SIZES } from '../../api/schemas';
import { SearchField } from '../../components/SearchField';
import { hasActiveFilters, type CompaniesFilters } from './filters';
import { sizeLabels } from './labels';

interface CompaniesToolbarProps {
  filters: CompaniesFilters;
  onChange: (patch: Partial<CompaniesFilters>, options?: { replace?: boolean }) => void;
  onClear: () => void;
}

export function CompaniesToolbar({ filters, onChange, onClear }: CompaniesToolbarProps) {
  const search = useCallback(
    (q: string, options: { replace: boolean }) => onChange({ q }, options),
    [onChange],
  );

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
      <SearchField
        label="Buscar empresas"
        placeholder="Nome, setor ou cidade"
        value={filters.q}
        onSearch={search}
      />
      <TextField
        select
        size="small"
        label="Porte"
        value={filters.size}
        onChange={(event) => onChange({ size: event.target.value as CompaniesFilters['size'] })}
        sx={{ width: { xs: '100%', sm: 180 } }}
      >
        <MenuItem value="">Todos</MenuItem>
        {COMPANY_SIZES.map((size) => (
          <MenuItem key={size} value={size}>
            {sizeLabels[size]}
          </MenuItem>
        ))}
      </TextField>
      {hasActiveFilters(filters) && (
        <Button onClick={onClear} sx={{ alignSelf: { sm: 'center' }, whiteSpace: 'nowrap' }}>
          Limpar filtros
        </Button>
      )}
    </Stack>
  );
}
