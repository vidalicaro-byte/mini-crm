import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

interface PageProps {
  title: string;
  description?: string;
  /** Shown above the title, e.g. a "back" link. */
  back?: ReactNode;
  children?: ReactNode;
}

export function Page({ title, description, back, children }: PageProps) {
  return (
    <>
      <title>{`${title} · Mini-CRM`}</title>
      {back}
      <Typography variant="h1" component="h1" gutterBottom>
        {title}
      </Typography>
      {description && (
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {description}
        </Typography>
      )}
      {children}
    </>
  );
}
