import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import { Chip } from '@mui/material'
import { formatCurrencyARS, formatDate } from '@/lib/format'
import type { CuentaMovimientoOut } from '../types'
import { tipoMovLabel } from '../utils'

interface Props {
  rows: CuentaMovimientoOut[] | undefined
  loading?: boolean
  error?: unknown
}

function tipoColor(
  tipo: CuentaMovimientoOut['tipo'],
): 'default' | 'success' | 'warning' | 'info' | 'error' {
  switch (tipo) {
    case 'FACTURA':
      return 'warning'
    case 'PAGO':
      return 'success'
    case 'AJUSTE_D':
      return 'error'
    case 'AJUSTE_H':
      return 'info'
    default:
      return 'default'
  }
}

export default function CuentaMovimientosList({ rows, loading, error }: Props) {
  const columns: DataTableColumn<CuentaMovimientoOut>[] = [
    {
      key: 'fecha',
      label: 'Fecha',
      width: 120,
      render: (r) => formatDate(r.fecha),
    },
    {
      key: 'tipo',
      label: 'Tipo',
      width: 130,
      render: (r) => (
        <Chip
          size="small"
          label={tipoMovLabel(r.tipo)}
          color={tipoColor(r.tipo)}
          variant="filled"
        />
      ),
    },
    {
      key: 'signo',
      label: 'Signo',
      width: 70,
      align: 'center',
      showFrom: 'sm',
      render: (r) => r.signo,
    },
    {
      key: 'importe',
      label: 'Importe',
      width: 140,
      align: 'right',
      render: (r) => `${r.signo === '-' ? '-' : '+'}${formatCurrencyARS(r.importe)}`,
    },
    {
      key: 'referencia',
      label: 'Referencia',
      width: 140,
      showFrom: 'md',
      render: (r) => {
        if (r.factura_venta_id != null) return `Factura #${r.factura_venta_id}`
        if (r.pago_id != null) return `Pago #${r.pago_id}`
        return '—'
      },
    },
    {
      key: 'observacion',
      label: 'Observación',
      showFrom: 'lg',
      render: (r) => r.observacion ?? '—',
    },
  ]

  return (
    <DataTable<CuentaMovimientoOut>
      columns={columns}
      rows={rows}
      loading={loading}
      error={error}
      emptyMessage="La cuenta no tiene movimientos en el rango seleccionado."
      getRowKey={(r) => r.det_cuenta_id}
    />
  )
}
