import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { BarChart } from '@mui/x-charts/BarChart';
import type { ReactNode } from 'react';
import type { Overview } from '../../api/schemas';
import { formatCurrency, stageLabels } from '../deals/labels';

// Axis ticks without the currency sign ("300 mil"): the tooltip, caption and table say R$.
const compactNumber = new Intl.NumberFormat('pt-BR', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const shortDate = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  timeZone: 'UTC',
});
const monthYear = new Intl.DateTimeFormat('pt-BR', {
  month: 'short',
  year: '2-digit',
  timeZone: 'UTC',
});

function bucketLabel(start: string, granularity: Overview['revenue']['granularity']) {
  const date = new Date(start);
  return granularity === 'month' ? monthYear.format(date) : shortDate.format(date);
}

function ChartCard({
  title,
  summary,
  table,
  children,
}: {
  title: string;
  /** What the chart says, in words (also the chart's accessible name). */
  summary: string;
  table: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card variant="outlined" component="section" aria-label={title} sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h2" sx={{ fontSize: '1.125rem', fontWeight: 600 }}>
          {title}
        </Typography>
        {/* The caption says what the drawing says; the table below has the exact values. */}
        <figure style={{ margin: 0 }}>
          <Typography component="figcaption" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {summary}
          </Typography>
          {children}
        </figure>
        <details>
          <summary style={{ cursor: 'pointer', padding: '8px 0' }}>Ver os dados em tabela</summary>
          {table}
        </details>
      </CardContent>
    </Card>
  );
}

function DataTable({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          {head.map((cell) => (
            <TableCell key={cell} align={cell === head[0] ? 'left' : 'right'}>
              {cell}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={String(row[0])}>
            {row.map((cell, index) => (
              <TableCell key={head[index]} align={index === 0 ? 'left' : 'right'}>
                {cell}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function OverviewCharts({ overview }: { overview: Overview }) {
  // CSS variables follow the light/dark scheme without re-rendering.
  const { vars } = useTheme();
  const funnel = overview.funnel.map((item) => ({
    ...item,
    label: stageLabels[item.stage],
  }));
  const created = funnel.reduce((total, item) => total + item.count, 0);
  const revenue = overview.revenue.buckets.map((bucket) => ({
    label: bucketLabel(bucket.start, overview.revenue.granularity),
    value: bucket.value,
  }));
  const bestStage = [...funnel].sort((a, b) => b.count - a.count)[0];

  return (
    <Grid container spacing={2} sx={{ mt: 0 }}>
      <Grid size={{ xs: 12, lg: 6 }}>
        <ChartCard
          title="Negócios criados por etapa"
          summary={
            created === 0
              ? 'Nenhum negócio foi criado no período.'
              : `${created} negócios criados no período; a maioria está em ${bestStage?.label} (${bestStage?.count}).`
          }
          table={
            <DataTable
              head={['Etapa', 'Negócios', 'Valor']}
              rows={funnel.map((item) => [item.label, item.count, formatCurrency(item.value)])}
            />
          }
        >
          <BarChart
            layout="horizontal"
            dataset={funnel}
            height={300}
            yAxis={[{ scaleType: 'band', dataKey: 'label', width: 96 }]}
            xAxis={[{ tickMinStep: 1 }]}
            series={[
              {
                dataKey: 'count',
                label: 'Negócios',
                color: vars?.palette.primary.main,
                valueFormatter: (value, context) =>
                  `${value ?? 0} · ${formatCurrency(funnel[context.dataIndex]?.value ?? 0)}`,
              },
            ]}
            hideLegend
          />
        </ChartCard>
      </Grid>
      <Grid size={{ xs: 12, lg: 6 }}>
        <ChartCard
          title="Receita ganha"
          summary={`${formatCurrency(
            revenue.reduce((total, bucket) => total + bucket.value, 0),
          )} em negócios ganhos no período, por ${
            { day: 'dia', week: 'semana', month: 'mês' }[overview.revenue.granularity]
          }.`}
          table={
            <DataTable
              head={[
                { day: 'Dia', week: 'Semana (início)', month: 'Mês' }[overview.revenue.granularity],
                'Receita',
              ]}
              rows={revenue.map((bucket) => [bucket.label, formatCurrency(bucket.value)])}
            />
          }
        >
          <BarChart
            dataset={revenue}
            height={280}
            xAxis={[{ scaleType: 'band', dataKey: 'label' }]}
            yAxis={[{ width: 64, valueFormatter: (value: number) => compactNumber.format(value) }]}
            series={[
              {
                dataKey: 'value',
                label: 'Receita ganha',
                color: vars?.palette.success.main,
                valueFormatter: (value) => formatCurrency(value ?? 0),
              },
            ]}
            hideLegend
          />
        </ChartCard>
      </Grid>
    </Grid>
  );
}
