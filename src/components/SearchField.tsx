import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import { useEffect, useRef, useState } from 'react';

const SEARCH_DELAY_MS = 300;

interface SearchFieldProps {
  label: string;
  placeholder?: string;
  /** The search text kept in the URL. */
  value: string;
  /** Called after the user pauses typing. */
  onSearch: (text: string, options: { replace: boolean }) => void;
}

/**
 * A search box that keeps its text in sync with a value stored elsewhere (the URL): it follows
 * outside changes (Back button, "clear filters") and reports typing only after a pause.
 */
export function SearchField({ label, placeholder, value, onSearch }: SearchFieldProps) {
  const [text, setText] = useState(value);
  // The last value this component reported, so its own echo never overwrites typing.
  const lastSent = useRef(value);

  // The value changed from outside (Back button, "clear filters", shared link): follow it.
  useEffect(() => {
    if (value !== lastSent.current) {
      lastSent.current = value;
      setText(value);
    }
  }, [value]);

  // Typing is reported after a pause, replacing the history entry so Back does not step through keystrokes.
  useEffect(() => {
    const trimmed = text.trim();
    if (trimmed === lastSent.current) return;
    const timer = setTimeout(() => {
      lastSent.current = trimmed;
      onSearch(trimmed, { replace: true });
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [text, onSearch]);

  return (
    <TextField
      label={label}
      placeholder={placeholder}
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
  );
}
