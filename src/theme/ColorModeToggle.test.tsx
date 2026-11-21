import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { AppProviders } from '../app/AppProviders';
import { ColorModeToggle } from './ColorModeToggle';

describe('ColorModeToggle', () => {
  it('switches between dark and light and remembers the choice', async () => {
    const user = userEvent.setup();
    render(
      <AppProviders>
        <ColorModeToggle />
      </AppProviders>,
    );

    await user.click(await screen.findByRole('button', { name: 'Ativar tema escuro' }));
    expect(screen.getByRole('button', { name: 'Ativar tema claro' })).toBeInTheDocument();
    expect(localStorage.getItem('mui-mode')).toBe('dark');
    // The attribute is what the theme's CSS variables key off; without it nothing changes visually.
    expect(document.documentElement).toHaveAttribute('data-dark');

    await user.click(screen.getByRole('button', { name: 'Ativar tema claro' }));
    expect(screen.getByRole('button', { name: 'Ativar tema escuro' })).toBeInTheDocument();
    expect(localStorage.getItem('mui-mode')).toBe('light');
    expect(document.documentElement).toHaveAttribute('data-light');
  });
});
