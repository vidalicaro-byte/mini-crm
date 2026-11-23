import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useEffect, useRef, useState } from 'react';
import { CompanyAutocomplete } from '../companies/CompanyAutocomplete';
import { hasActiveFilters, type ContactsFilters } from './filters';

const SEARCH_DELAY_MS = 300;

interface ContactsToolbarProps {
  filters: ContactsFilters;
  onChange: (patch: Partial<ContactsFilters>, options?: { replace?: boolean }) => void;
  onClear: () => void;
}

export function ContactsToolbar({ filters, onChange, onClear }: ContactsToolbarProps) {
  const [text, setText] = useState(filters.q);
  // The last value this component wrote to the URL, so its own echo never overwrites typing.
  const lastSent = useRef(filters.q);

  // The URL changed from outside (Back button, "clear filters", shared link): follow it.
  useEffect(() => {
    if (filters.q !== lastSent.current) {
      lastSent.current = filters.q;
      setText(filters.q);
    }
  }, [filters.q]);

  // Typing updates the URL after a pause, replacing the entry so Back does not step through keystrokes.
  useEffect(() => {
    const trimmed = text.trim();
    if (trimmed === lastSent.current) return;
    const timer = setTimeout(() => {
      lastSent.current = trimmed;
      onChange({ q: trimmed }, { replace: true });
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [text, onChange]);

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
      <TextField
        label="Buscar contatos"
        placeholder="Nome, e-mail ou empresa"
        value={text}
        onChange={(event) => setText(event.target.value)}
        size="small"
        sx={{ flex: 1 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: text ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  aria-label="Limpar busca"
                  onClick={() => setText('')}
                  edge="end"
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null,
          },
        }}
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
