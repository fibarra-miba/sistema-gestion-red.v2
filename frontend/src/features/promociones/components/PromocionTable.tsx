import { Chip, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import ToggleOnIcon from '@mui/icons-material/ToggleOn'
import ToggleOffIcon from '@mui/icons-material/ToggleOff'
import DataTable, {
  type DataTableColumn,
  type DataTablePagination,
} from '@/components/ui/DataTable'
import { formatCurrencyARS, formatDate } from '@/lib/format'
import { TIPO_PROMO_PORCENTAJE, type PromocionOut } from '../types'

interface PromocionTableProps {
  promociones: PromocionOut[] | undefined
  loading?: boolean
  error?: unknown
  pagination?: DataTablePagination
  canManage?: boolean
  onEdit: (promo: PromocionOut) => void
  onToggleActivo: (promo: PromocionOut) => void
}

export function formatDescuento(promo: PromocionOut): string {
  if (promo.tipo_promo_id === TIPO_PROMO_PORCENTAJE && promo.porcentaje_descuento != null) {
    return `${promo.porcentaje_descuento}%`
  }
  if (promo.monto_descuento != null) {
    return formatCurrencyARS(promo.monto_descuento)
  }
  return '—'
}

export default function PromocionTable({
  promociones,
  loading,
  error,
  pagination,
  canManage = false,
  onEdit,
  onToggleActivo,
}: PromocionTableProps) {
  const columns: DataTableColumn<PromocionOut>[] = [
    { key: 'promocion_id', label: '#', width: 72, showFrom: 'md' },
    {
      key: 'nombre_promo',
      label: 'Promoción',
      render: (r) => (
        <Stack sx={{ minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
            {r.nombre_promo}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            noWrap
            sx={{ display: { xs: 'block', sm: 'none' } }}
          >
            {r.descripcion_tpromo ?? '—'} · {formatDescuento(r)}
          </Typography>
        </Stack>
      ),
    },
    {
      key: 'tipo',
      label: 'Tipo',
      width: 150,
      showFrom: 'sm',
      render: (r) => (
        <Chip label={r.descripcion_tpromo ?? '—'} size="small" variant="outlined" />
      ),
    },
    {
      key: 'descuento',
      label: 'Descuento',
      width: 120,
      showFrom: 'sm',
      render: (r) => (
        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
          {formatDescuento(r)}
        </Typography>
      ),
    },
    {
      key: 'vigencia',
      label: 'Vigencia',
      width: 180,
      showFrom: 'md',
      render: (r) => (
        <Typography variant="body2" color="text.secondary" noWrap>
          {formatDate(r.fecha_vigencia_desde_promo)} →{' '}
          {r.fecha_vigencia_hasta_promo ? formatDate(r.fecha_vigencia_hasta_promo) : 'sin fin'}
        </Typography>
      ),
    },
    {
      key: 'activo_promo',
      label: 'Estado',
      width: 110,
      showFrom: 'sm',
      render: (r) => (
        <Chip
          label={r.activo_promo ? 'Activa' : 'Inactiva'}
          color={r.activo_promo ? 'success' : 'default'}
          size="small"
          variant={r.activo_promo ? 'filled' : 'outlined'}
        />
      ),
    },
  ]

  if (canManage) {
    columns.push({
      key: 'acciones',
      label: '',
      width: 110,
      align: 'right',
      render: (r) => (
        <Stack
          direction="row"
          spacing={0.25}
          sx={{ justifyContent: 'flex-end' }}
          onClick={(e) => e.stopPropagation()}
        >
          <Tooltip title="Editar">
            <IconButton size="small" onClick={() => onEdit(r)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={r.activo_promo ? 'Desactivar' : 'Activar'}>
            <IconButton
              size="small"
              color={r.activo_promo ? 'error' : 'success'}
              onClick={() => onToggleActivo(r)}
            >
              {r.activo_promo ? (
                <ToggleOffIcon fontSize="small" />
              ) : (
                <ToggleOnIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    })
  }

  return (
    <DataTable<PromocionOut>
      columns={columns}
      rows={promociones}
      loading={loading}
      error={error}
      pagination={pagination}
      getRowKey={(r) => r.promocion_id}
      onRowClick={canManage ? onEdit : undefined}
      emptyMessage="No hay promociones para los filtros aplicados."
    />
  )
}
