import Link from '@mui/material/Link';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { ptBR } from '@mui/x-data-grid/locales';
import { useMemo } from 'react';
import { Link as RouterLink, useLocation } from 'react-router';
import type { CompanyResponse } from '../../api/schemas';
import { formatCurrency } from '../deals/labels';
import { SORT_FIELDS, type CompaniesFilters, type SortField } from './filters';
import { sizeLabels } from './labels';

/** The name opens the company; the list's filters go along so "Voltar" restores the same view. */
function NameLink({ id, name }: { id: string; name: string }) {
  const { search } = useLocation();
  return (
    <Link component={RouterLink} to={`/empresas/${id}`} state={{ listSearch: search }}>
      {name}
    </Link>
  );
}

const columns: GridColDef<CompanyResponse>[] = [
  {
    field: 'name',
    headerName: 'Nome',
    flex: 1.3,
    minWidth: 160,
    renderCell: ({ row }) => <NameLink id={row.id} name={row.name} />,
  },
  { field: 'industry', headerName: 'Setor', flex: 1, minWidth: 130 },
  {
    field: 'size',
    headerName: 'Porte',
    width: 110,
    valueFormatter: (value: CompanyResponse['size']) => sizeLabels[value],
  },
  {
    field: 'city',
    headerName: 'Cidade',
    flex: 1.2,
    minWidth: 170,
    valueGetter: (_value, row) => `${row.city} – ${row.state}`,
  },
  {
    field: 'contactsCount',
    headerName: 'Contatos',
    type: 'number',
    width: 110,
  },
  {
    field: 'openDealsValue',
    headerName: 'Negócios em aberto',
    type: 'number',
    width: 190,
    valueGetter: (_value, row) => row.openDeals.value,
    valueFormatter: (value: number, row) => (row.openDeals.count > 0 ? formatCurrency(value) : '—'),
  },
];

const isSortField = (field: string): field is SortField =>
  (SORT_FIELDS as readonly string[]).includes(field);

interface CompaniesTableProps {
  rows: CompanyResponse[];
  total: number;
  filters: CompaniesFilters;
  loading: boolean;
  onChange: (patch: Partial<CompaniesFilters>) => void;
}

export function CompaniesTable({ rows, total, filters, loading, onChange }: CompaniesTableProps) {
  const theme = useTheme();
  const isWide = useMediaQuery(theme.breakpoints.up('md'));
  const columnVisibilityModel = useMemo(
    () => ({ industry: isWide, size: isWide, city: isWide, openDealsValue: isWide }),
    [isWide],
  );

  // Stable references: a new object on every render makes the grid think the model changed
  // and send the user back to the first page.
  const paginationModel = useMemo(
    () => ({ page: filters.page - 1, pageSize: filters.pageSize }),
    [filters.page, filters.pageSize],
  );
  const sortModel = useMemo(
    () => [{ field: filters.sort, sort: filters.order }],
    [filters.sort, filters.order],
  );

  return (
    <DataGrid
      aria-label="Lista de empresas"
      rows={rows}
      columns={columns}
      rowCount={total}
      loading={loading}
      autoHeight
      disableColumnFilter
      disableColumnMenu
      disableRowSelectionOnClick
      disableVirtualization={import.meta.env.MODE === 'test'}
      localeText={ptBR.components.MuiDataGrid.defaultProps.localeText}
      columnVisibilityModel={columnVisibilityModel}
      pageSizeOptions={[10, 25, 50]}
      paginationMode="server"
      paginationModel={paginationModel}
      onPaginationModelChange={(model) => {
        onChange(
          model.pageSize === filters.pageSize
            ? { page: model.page + 1 }
            : { pageSize: model.pageSize as CompaniesFilters['pageSize'] },
        );
      }}
      sortingMode="server"
      sortingOrder={['asc', 'desc']}
      sortModel={sortModel}
      onSortModelChange={([item]) => {
        if (item && isSortField(item.field) && item.sort) {
          onChange({ sort: item.field, order: item.sort });
        }
      }}
    />
  );
}
