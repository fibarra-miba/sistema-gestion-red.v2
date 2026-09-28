import { Box, Button, Chip, IconButton, Tooltip, Typography } from '@mui/material'
import HistoryIcon from '@mui/icons-material/History'
import TuneIcon from '@mui/icons-material/Tune'
import DataTable, {
  type DataTableColumn,
  type DataTablePagination,
} from '@/components/ui/DataTable'
import { formatCurrencyARS } from '@/lib/format'
import type { ExistenciaOut } from '../types'

interface Props {
  existencias: ExistenciaOut[] | undefined
  loading?: boolean
  error?: unknown
  canManage?: boolean
  onKardex?: (e: ExistenciaOut) => void
  onMovimiento?: (e: ExistenciaOut) => void
  pagination?: DataTablePagination
}

export default function ExistenciasTable({
  existencias,
  loading,
  error,
  canManage,
  onKardex,
  onMovimiento,
  pagination,
}: Props) {
  const columns: DataTableColumn<ExistenciaOut>[] = [
    {
      key: 'producto',
      label: 'Producto',
      render: (e) => (
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
            {e.nombre_producto}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {e.marca_producto} · {e.modelo_producto}
          </Typography>
        </Box>
      ),
    },
    {
      key: 'cantidad',
      label: 'Existencia',
      align: 'right',
      render: (e) => (
        <Chip
          size="small"
          label={`${e.cantidad} ${e.unidad_stock_producto ?? 'u.'}`}
          color={e.cantidad > 0 ? 'success' : 'default'}
          variant={e.cantidad > 0 ? 'filled' : 'outlined'}
        />
      ),
    },
    {
      key: 'costo_promedio',
      label: 'Costo prom. (PMP)',
      align: 'right',
      showFrom: 'sm',
      render: (e) => formatCurrencyARS(e.costo_promedio),
    },
    {
      key: 'valor',
      label: 'Valorizado',
      align: 'right',
      showFrom: 'md',
      render: (e) => formatCurrencyARS(e.valor),
    },
    {
      key: 'acciones',
      label: '',
      align: 'right',
      width: canManage ? 210 : 56,
      render: (e) => (
        <Box sx={{ display: 'inline-flex' }}>
          <Tooltip title="Movimientos (kardex)">
            <IconButton size="small" onClick={() => onKardex?.(e)}>
              <HistoryIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {canManage && (
            <Button
              size="small"
              startIcon={<TuneIcon fontSize="small" />}
              onClick={() => onMovimiento?.(e)}
            >
              Cargar / ajustar
            </Button>
          )}
        </Box>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      rows={existencias}
      loading={loading}
      error={error}
      getRowKey={(e) => e.producto_id}
      emptyMessage="No hay productos en stock."
      pagination={pagination}
    />
  )
}
