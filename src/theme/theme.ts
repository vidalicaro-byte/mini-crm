import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  // With the default ('media') selector the theme can only follow the OS setting;
  // a data attribute is required for the manual light/dark toggle to take effect.
  cssVariables: { colorSchemeSelector: 'data' },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#2f5bea' },
        background: { default: '#f6f7fb', paper: '#ffffff' },
      },
    },
    dark: {
      palette: {
        primary: { main: '#8fa8ff' },
        background: { default: '#0f1220', paper: '#171b2e' },
      },
    },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: '"Inter Variable", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    h1: { fontSize: '2rem', fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiAppBar: { defaultProps: { elevation: 0, color: 'default' } },
  },
});
