import type { DealStage } from '../../api/schemas';

export const stageLabels: Record<DealStage, string> = {
  novo: 'Novo',
  contato: 'Contato',
  proposta: 'Proposta',
  negociacao: 'Negociação',
  ganho: 'Ganho',
  perdido: 'Perdido',
};

export const stageColors: Record<DealStage, 'default' | 'info' | 'warning' | 'success' | 'error'> =
  {
    novo: 'default',
    contato: 'info',
    proposta: 'info',
    negociacao: 'warning',
    ganho: 'success',
    perdido: 'error',
  };

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const formatCurrency = (value: number) => currency.format(value);
