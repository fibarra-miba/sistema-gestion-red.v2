import {
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import { formatCurrencyARS, formatDate } from '@/lib/format'
import { useKardex } from '../hooks/useKardex'
import type { ExistenciaOut, MovimientoStockOut } from '../types'

interface Props {
  existencia: ExistenciaOut | null
  open: boolean
  onClose: () => void
}

export default function KardexDialog({ existencia, open, onClose }: Props) {
  const productoId = existencia?.producto_id ?? null
  const { data, isLoading, error } = useKardex(open ? productoId : null)

  const columns: DataTableColumn<MovimientoStockOut>[] = [
    { key: 'fecha_mstock', label: 'Fecha', render: (m) => formatDate(m.fecha_mstock) },
    {
      key: 'descripcion_tmstock',
      label: 'Movimiento',
      render: (m) => (
        <Chip
          size="small"
          label={m.descripcion_tmstock}
          color={m.signo_tmstock === '+' ? 'success' : 'warning'}
          variant="outlined"
        />
      ),
    },
    {
      key: 'cantidad',
      label: 'Cantidad',
      align: 'right',
      render: (m) => `${m.signo_tmstock}${m.factor_b_stock}`,
    },
    {
      key: 'costo_unitario_mstock',
      label: 'Costo unit.',
      align: 'right',
      showFrom: 'sm',
      render: (m) => formatCurrencyARS(m.costo_unitario_mstock),
    },
    {
      key: 'observacion_dmstock',
      label: 'Observación',
      showFrom: 'md',
      render: (m) => m.observacion_dmstock ?? '—',
    },
  ]

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Kardex — {existencia?.nombre_producto}
        <Typography variant="body2" color="text.secondary">
          Existencia actual: {existencia?.cantidad} {existencia?.unidad_stock_producto ?? 'u.'}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <DataTable
          columns={columns}
          rows={data}
          loading={isLoading}
          error={error}
          getRowKey={(m) => m.mov_stock_id}
          emptyMessage="Sin movimientos de stock."
        />
      </DialogContent>
    </Dialog>
  )
}
