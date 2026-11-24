import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import type { Delta } from './delta';

interface KpiCardProps {
  label: string;
  /** undefined while loading. */
  value: string | undefined;
  /** Small line under the value. */
  caption?: string;
  delta?: Delta | null;
}

const toneColor = { up: 'success', down: 'error', flat: 'default' } as const;

export function KpiCard({ label, value, caption, delta }: KpiCardProps) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Typography color="text.secondary" gutterBottom>
          {label}
        </Typography>
        {/* The skeleton lives inside the same Typography so it has the same height as the value. */}
        <Typography variant="h4" component="p" sx={{ fontWeight: 700 }}>
          {value === undefined ? <Skeleton width={96} /> : value}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          component="div"
          sx={{ mt: 0.5, minHeight: 24 }}
        >
          {value === undefined ? (
            <Skeleton width={140} />
          ) : (
            <>
              {delta && (
                <Chip
                  size="small"
                  variant="outlined"
                  color={toneColor[delta.tone]}
                  label={delta.text}
                  // The sentence replaces the symbol-only text for screen readers.
                  aria-label={delta.description}
                  sx={{ mr: 1 }}
                />
              )}
              {caption}
            </>
          )}
        </Typography>
      </CardContent>
    </Card>
  );
}
