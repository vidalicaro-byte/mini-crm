import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

interface PageProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export function Page({ title, description, children }: PageProps) {
  return (
    <>
      <title>{`${title} · Mini-CRM`}</title>
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
