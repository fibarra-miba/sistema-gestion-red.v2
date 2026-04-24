import {
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import EditIcon from '@mui/icons-material/Edit'
import VisibilityIcon from '@mui/icons-material/Visibility'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import { formatCurrencyARS, formatDate } from '@/lib/format'
import type { PlanOut } from '../types'
import { isPlanActivo } from '../utils'

interface PlanTableProps {
  plans: PlanOut[] | undefined
  loading?: boolean
  error?: unknown
  onView: (plan: PlanOut) => void
  onEdit: (plan: PlanOut) => void
  onDeactivate: (plan: PlanOut) => void
}

export default function PlanTable({
  plans,
  loading,
  error,
  onView,
  onEdit,
  onDeactivate,
}: PlanTableProps) {
  const columns: DataTableColumn<PlanOut>[] = [
    { key: 'plan_id', label: '#', width: 72, showFrom: 'md' },
    {
      key: 'nombre_plan',
      label: 'Nombre',
      render: (r) => (
        <Stack sx={{ minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
            {r.nombre_plan}
          </Typography>
          {/* En mobile, donde Velocidad está oculta, mostramos los Mbps acá
              como caption para no perder la info crítica del plan. */}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: { xs: 'block', sm: 'none' } }}
          >
            {r.velocidad_mbps_plan} Mbps
          </Typography>
        </Stack>
      ),
    },
    {
      key: 'velocidad_mbps_plan',
      label: 'Velocidad',
      width: 120,
      showFrom: 'sm',
      render: (r) => `${r.velocidad_mbps_plan} Mbps`,
    },
    {
      key: 'descripcion_plan',
      label: 'Descripción',
      showFrom: 'lg',
      render: (r) => (
        <Typography variant="body2" noWrap title={r.descripcion_plan ?? undefined}>
          {r.descripcion_plan ?? '—'}
        </Typography>
      ),
    },
    {
      key: 'precio_vigente',
      label: 'Precio vigente',
      width: 180,
      align: 'right',
      render: (r) => (
        <Stack sx={{ alignItems: 'flex-end' }}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}
          >
            {formatCurrencyARS(r.precio_vigente)}
          </Typography>
          {r.fecha_desde_precio_vigente && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                whiteSpace: 'nowrap',
                display: { xs: 'none', md: 'block' },
              }}
            >
              Desde {formatDate(r.fecha_desde_precio_vigente)}
            </Typography>
          )}
        </Stack>
      ),
    },
    {
      key: 'estado_plan_id',
      label: 'Estado',
      width: 110,
      showFrom: 'sm',
      render: (r) => (
        <Chip
          label={isPlanActivo(r.estado_plan_id) ? 'Activo' : 'Inactivo'}
          color={isPlanActivo(r.estado_plan_id) ? 'success' : 'default'}
          size="small"
          variant={isPlanActivo(r.estado_plan_id) ? 'filled' : 'outlined'}
        />
      ),
    },
    {
      key: 'acciones',
      label: '',
      width: 150,
      align: 'right',
      render: (r) => (
        <Stack
          direction="row"
          spacing={0.25}
          sx={{ justifyContent: 'flex-end' }}
          onClick={(e) => e.stopPropagation()}
        >
          <Tooltip title="Ver detalle">
            <IconButton size="small" onClick={() => onView(r)}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Editar">
            <IconButton size="small" onClick={() => onEdit(r)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip
            title={isPlanActivo(r.estado_plan_id) ? 'Dar de baja' : 'Ya está inactivo'}
          >
            <span>
              <IconButton
                size="small"
                color="error"
                disabled={!isPlanActivo(r.estado_plan_id)}
                onClick={() => onDeactivate(r)}
              >
                <DeleteOutlinedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      ),
    },
  ]

  return (
    <DataTable<PlanOut>
      columns={columns}
      rows={plans}
      loading={loading}
      error={error}
      getRowKey={(r) => r.plan_id}
      onRowClick={onView}
      emptyMessage="Todavía no hay planes cargados."
    />
  )
}
