import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

interface PageProps {
  title: string;
  description?: string;
  /** Shown above the title, e.g. a "back" link. */
  back?: ReactNode;
  /** Buttons shown beside the title. */
  actions?: ReactNode;
  children?: ReactNode;
}

export function Page({ title, description, back, actions, children }: PageProps) {
  return (
    <>
      <title>{`${title} · Mini-CRM`}</title>
      {back}
      <Stack
        direction="row"
        sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}
      >
        <Typography variant="h1" component="h1" gutterBottom>
          {title}
        </Typography>
        {actions}
      </Stack>
      {description && (
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {description}
        </Typography>
      )}
      {children}
    </>
  );
}
