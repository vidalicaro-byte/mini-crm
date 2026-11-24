import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { useQuery } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import { PERIODS } from '../../api/schemas';
import { Page } from '../../components/Page';
import { formatCurrency } from '../deals/labels';
import { overviewQuery } from './api';
import { deltaPercent, deltaPoints } from './delta';
import { KpiCard } from './KpiCard';
import { periodLabels, usePeriod } from './period';

// The charts library is the heaviest part of this page: load it after the numbers are on screen.
const OverviewCharts = lazy(() =>
  import('./OverviewCharts').then((module) => ({ default: module.OverviewCharts })),
);

const number = new Intl.NumberFormat('pt-BR');
const percent = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 0 });

export function DashboardPage() {
  const { period, setPeriod } = usePeriod();
  const overview = useQuery(overviewQuery(period));
  const data = overview.data;
  // Showing the previous period's numbers while the new ones load.
  const refreshing = overview.isPlaceholderData;

  return (
    <Page
      title="Visão geral"
      actions={
        <ToggleButtonGroup
          exclusive
          size="small"
          value={period}
          aria-label="Período"
          onChange={(_event, next: (typeof PERIODS)[number] | null) => next && setPeriod(next)}
        >
          {PERIODS.map((value) => (
            <ToggleButton key={value} value={value}>
              {periodLabels[value]}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      }
    >
      {overview.isError && !data ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => void overview.refetch()}>
              Tentar novamente
            </Button>
          }
        >
          Não foi possível carregar a visão geral.
        </Alert>
      ) : (
        <Box
          aria-busy={refreshing}
          sx={{ opacity: refreshing ? 0.6 : 1, transition: 'opacity 150ms' }}
        >
          {overview.isError && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Não foi possível atualizar os números.
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
              <KpiCard
                label="Contatos"
                value={data && number.format(data.totals.contacts)}
                caption={data && `em ${number.format(data.totals.companies)} empresas`}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
              <KpiCard
                label="Novos contatos"
                value={data && number.format(data.newContacts.current)}
                caption="vs. período anterior"
                delta={data && deltaPercent(data.newContacts.current, data.newContacts.previous)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
              <KpiCard
                label="Negócios em aberto"
                value={data && number.format(data.openDeals.count)}
                caption={data && `${formatCurrency(data.openDeals.value)} no funil`}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 6 }}>
              <KpiCard
                label="Receita ganha"
                value={data && formatCurrency(data.wonRevenue.current)}
                caption="vs. período anterior"
                delta={data && deltaPercent(data.wonRevenue.current, data.wonRevenue.previous)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 6 }}>
              <KpiCard
                label="Taxa de conversão"
                value={
                  data &&
                  (data.conversionRate.current === null
                    ? '—'
                    : percent.format(data.conversionRate.current))
                }
                caption={
                  data && data.conversionRate.current === null
                    ? 'Nenhum negócio fechado no período'
                    : 'ganhos entre os negócios fechados'
                }
                delta={
                  data && deltaPoints(data.conversionRate.current, data.conversionRate.previous)
                }
              />
            </Grid>
          </Grid>
          {data ? (
            <Suspense fallback={<ChartsSkeleton />}>
              <OverviewCharts overview={data} />
            </Suspense>
          ) : (
            <ChartsSkeleton />
          )}
        </Box>
      )}
    </Page>
  );
}

function ChartsSkeleton() {
  return (
    <Grid container spacing={2} sx={{ mt: 0 }}>
      {[0, 1].map((index) => (
        <Grid key={index} size={{ xs: 12, lg: 6 }}>
          <Skeleton variant="rounded" height={380} aria-label="Carregando gráfico" />
        </Grid>
      ))}
    </Grid>
  );
}
