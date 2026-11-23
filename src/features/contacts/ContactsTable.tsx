import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { ptBR } from '@mui/x-data-grid/locales';
import { useMemo } from 'react';
import type { ContactResponse } from '../../api/schemas';
import { SORT_FIELDS, type ContactsFilters, type SortField } from './filters';

const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' });

const columns: GridColDef<ContactResponse>[] = [
  { field: 'name', headerName: 'Nome', flex: 1.2, minWidth: 160 },
  { field: 'email', headerName: 'E-mail', flex: 1.4, minWidth: 200 },
  {
    field: 'company',
    headerName: 'Empresa',
    flex: 1,
    minWidth: 160,
    valueGetter: (_value, row) => row.company.name,
  },
  { field: 'phone', headerName: 'Telefone', width: 150, sortable: false },
  {
    field: 'createdAt',
    headerName: 'Criado em',
    width: 130,
    valueFormatter: (value: string) => dateFormat.format(new Date(value)),
  },
];

const isSortField = (field: string): field is SortField =>
  (SORT_FIELDS as readonly string[]).includes(field);

interface ContactsTableProps {
  rows: ContactResponse[];
  total: number;
  filters: ContactsFilters;
  loading: boolean;
  onChange: (patch: Partial<ContactsFilters>) => void;
}

export function ContactsTable({ rows, total, filters, loading, onChange }: ContactsTableProps) {
  const theme = useTheme();
  const isWide = useMediaQuery(theme.breakpoints.up('md'));
  const columnVisibilityModel = useMemo(
    () => ({ email: isWide, phone: isWide, createdAt: isWide }),
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
      aria-label="Lista de contatos"
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
            : { pageSize: model.pageSize as ContactsFilters['pageSize'] },
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
