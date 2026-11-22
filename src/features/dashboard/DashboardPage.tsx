import { Page } from '../../components/Page';
import { OverviewCounts } from './OverviewCounts';

export function DashboardPage() {
  return (
    <Page
      title="Visão geral"
      description="Indicadores e gráficos do funil de vendas chegam nas próximas etapas."
    >
      <OverviewCounts />
    </Page>
  );
}
