import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { useQuery } from '@tanstack/react-query';
import type { Ref } from 'react';
import { companiesQuery } from './api';

interface CompanyAutocompleteProps {
  /** The selected company's id, or '' for none. */
  value: string;
  onChange: (companyId: string) => void;
  onBlur?: () => void;
  inputRef?: Ref<HTMLInputElement>;
  label?: string;
  size?: 'small' | 'medium';
  required?: boolean;
  error?: boolean;
  helperText?: string;
  width?: number | string | Record<string, number | string>;
}

export function CompanyAutocomplete({
  value,
  onChange,
  onBlur,
  inputRef,
  label = 'Empresa',
  size = 'medium',
  required,
  error,
  helperText,
  width,
}: CompanyAutocompleteProps) {
  const companies = useQuery(companiesQuery({ page: 1, pageSize: 100, sort: 'name' }));
  const options = companies.data?.data ?? [];
  const selected = options.find((company) => company.id === value) ?? null;

  return (
    <Autocomplete
      size={size}
      options={options}
      value={selected}
      loading={companies.isPending}
      loadingText="Carregando…"
      noOptionsText="Nenhuma empresa"
      getOptionLabel={(company) => company.name}
      isOptionEqualToValue={(option, current) => option.id === current.id}
      onChange={(_event, company) => onChange(company?.id ?? '')}
      onBlur={onBlur}
      sx={{ width }}
      // Company names are not unique, so the id (not the label) must be the React key.
      renderOption={({ key: _key, ...props }, company) => (
        <li key={company.id} {...props}>
          {company.name}
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          error={error}
          helperText={helperText}
          inputRef={inputRef}
        />
      )}
    />
  );
}
