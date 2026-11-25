import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

/** A titled card on a detail page; the title names the region for screen readers. */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card variant="outlined" component="section" aria-label={title}>
      <CardContent>
        <Typography variant="h2" sx={{ fontSize: '1.125rem', fontWeight: 600, mb: 1 }}>
          {title}
        </Typography>
        {children}
      </CardContent>
    </Card>
  );
}

/** One label/value pair; use inside a `<dl>`. */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <Typography component="dt" variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography component="dd" sx={{ m: 0 }}>
        {children}
      </Typography>
    </div>
  );
}
