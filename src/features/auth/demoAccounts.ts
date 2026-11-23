/**
 * Credentials of the demo users served by the mock API. The login page offers them as
 * one-click shortcuts only while the mock API is on (VITE_ENABLE_MOCKS is not "false").
 */
export const DEMO_PASSWORD = 'demo1234';

export const demoAccounts = [
  { label: 'Entrar como administradora', email: 'marina@minicrm.demo' },
  { label: 'Entrar como vendedor', email: 'rafael@minicrm.demo' },
] as const;

export const demoAccountsEnabled = import.meta.env.VITE_ENABLE_MOCKS !== 'false';
