import { Chip } from '@mui/material'
import DataTable, {
  type DataTableColumn,
  type DataTablePagination,
} from '@/components/ui/DataTable'
import { formatCurrencyARS, formatDate } from '@/lib/format'
import type { CompraListItem } from '../types'

interface Props {
  compras: CompraListItem[] | undefined
  loading?: boolean
  error?: unknown
  onRowClick?: (compra: CompraListItem) => void
  pagination?: DataTablePagination
}

export default function ComprasTable({
  compras,
  loading,
  error,
  onRowClick,
  pagination,
}: Props) {
  const columns: DataTableColumn<CompraListItem>[] = [
    { key: 'factura_compra_id', label: '#', width: 64, render: (c) => `#${c.factura_compra_id}` },
    { key: 'fecha_fcompras', label: 'Fecha', render: (c) => formatDate(c.fecha_fcompras) },
    { key: 'nombre_prov', label: 'Proveedor', render: (c) => c.nombre_prov ?? '—' },
    {
      key: 'codigo_fcompras',
      label: 'Código',
      showFrom: 'md',
      render: (c) => c.codigo_fcompras ?? '—',
    },
    {
      key: 'importe_total_fcompras',
      label: 'Total',
      align: 'right',
      render: (c) => formatCurrencyARS(c.importe_total_fcompras),
    },
    {
      key: 'descripcion_efcompra',
      label: 'Estado',
      align: 'center',
      render: (c) => (
        <Chip
          size="small"
          label={c.descripcion_efcompra ?? '—'}
          color={c.descripcion_efcompra === 'EMITIDA' ? 'success' : 'default'}
          variant={c.descripcion_efcompra === 'EMITIDA' ? 'filled' : 'outlined'}
        />
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      rows={compras}
      loading={loading}
      error={error}
      getRowKey={(c) => c.factura_compra_id}
      emptyMessage="No hay compras registradas."
      onRowClick={onRowClick}
      pagination={pagination}
    />
  )
}
