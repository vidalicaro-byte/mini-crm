import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import IconButton from '@mui/material/IconButton';
import { useColorScheme } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';

export function ColorModeToggle() {
  const { mode, systemMode, setMode } = useColorScheme();

  // The mode is only known after the first render on the client.
  if (!mode) return null;

  const isDark = (mode === 'system' ? systemMode : mode) === 'dark';
  const label = isDark ? 'Ativar tema claro' : 'Ativar tema escuro';

  return (
    <Tooltip title={label}>
      <IconButton
        aria-label={label}
        color="inherit"
        onClick={() => setMode(isDark ? 'light' : 'dark')}
      >
        {isDark ? <LightModeIcon /> : <DarkModeIcon />}
      </IconButton>
    </Tooltip>
  );
}
