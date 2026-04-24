import { IconButton, Stack, Tooltip } from '@mui/material'
import PaymentIcon from '@mui/icons-material/Payment'
import VisibilityIcon from '@mui/icons-material/Visibility'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import { formatCurrencyARS, formatDate } from '@/lib/format'
import type { ContratoPagoListItemOut } from '../types'
import { formatPeriodo } from '../utils'
import PagoEstadoChip from './PagoEstadoChip'

export type PagoRowActionKind = 'view' | 'registrar'

interface Props {
  rows: ContratoPagoListItemOut[] | undefined
  loading?: boolean
  error?: unknown
  onAction: (kind: PagoRowActionKind, row: ContratoPagoListItemOut) => void
}

export default function PagosContratoTable({
  rows,
  loading,
  error,
  onAction,
}: Props) {
  const columns: DataTableColumn<ContratoPagoListItemOut>[] = [
    {
      key: 'pago_id',
      label: '#',
      width: 72,
      render: (r) => `#${r.pago_id}`,
    },
    {
      key: 'periodo',
      label: 'Período',
      width: 110,
      render: (r) => formatPeriodo(r.periodo_anio_pago, r.periodo_mes_pago),
    },
    {
      key: 'fecha_emision',
      label: 'Emisión',
      width: 120,
      showFrom: 'sm',
      render: (r) => formatDate(r.fecha_emision),
    },
    {
      key: 'fecha_vencimiento',
      label: 'Vencimiento',
      width: 130,
      showFrom: 'md',
      render: (r) => formatDate(r.fecha_vencimiento),
    },
    {
      key: 'estado',
      label: 'Estado',
      width: 110,
      render: (r) => <PagoEstadoChip estado={r.estado} />,
    },
    {
      key: 'total_factura',
      label: 'Total',
      width: 130,
      align: 'right',
      render: (r) => formatCurrencyARS(r.total_factura),
    },
    {
      key: 'total_pagado',
      label: 'Pagado',
      width: 130,
      align: 'right',
      showFrom: 'md',
      render: (r) => formatCurrencyARS(r.total_pagado),
    },
    {
      key: 'saldo_pendiente',
      label: 'Saldo',
      width: 130,
      align: 'right',
      render: (r) => formatCurrencyARS(r.saldo_pendiente),
    },
    {
      key: 'excedente_credito',
      label: 'Excedente',
      width: 130,
      align: 'right',
      showFrom: 'lg',
      render: (r) =>
        r.excedente_credito > 0 ? formatCurrencyARS(r.excedente_credito) : '—',
    },
    {
      key: 'actions',
      label: '',
      width: 120,
      align: 'right',
      render: (r) => (
        <Stack
          direction="row"
          spacing={0.5}
          sx={{ justifyContent: 'flex-end' }}
          onClick={(e) => e.stopPropagation()}
        >
          <Tooltip title="Ver detalle">
            <IconButton
              size="small"
              onClick={() => onAction('view', r)}
              aria-label={`ver pago ${r.pago_id}`}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip
            title={
              r.estado === 'PAGADO' ? 'Ya está pagado' : 'Registrar pago'
            }
          >
            <span>
              <IconButton
                size="small"
                color="primary"
                disabled={r.estado === 'PAGADO'}
                onClick={() => onAction('registrar', r)}
                aria-label={`registrar pago ${r.pago_id}`}
              >
                <PaymentIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      ),
    },
  ]

  return (
    <DataTable<ContratoPagoListItemOut>
      columns={columns}
      rows={rows}
      loading={loading}
      error={error}
      emptyMessage="Este contrato no tiene pagos generados."
      getRowKey={(r) => r.pago_id}
      onRowClick={(r) => onAction('view', r)}
    />
  )
}
