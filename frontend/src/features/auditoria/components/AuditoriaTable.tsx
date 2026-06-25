import { Chip, Stack, Tooltip, Typography } from '@mui/material'
import DataTable, {
  type DataTableColumn,
  type DataTablePagination,
} from '@/components/ui/DataTable'
import { formatDate, formatTime } from '@/lib/format'
import type { AuditEventOut } from '../types'

interface Props {
  eventos: AuditEventOut[] | undefined
  loading?: boolean
  error?: unknown
  pagination?: DataTablePagination
}

function actorLabel(e: AuditEventOut): string {
  if (e.username_usuario) return e.username_usuario
  if (e.nombre_usuario || e.apellido_usuario) {
    return `${e.nombre_usuario ?? ''} ${e.apellido_usuario ?? ''}`.trim()
  }
  return e.usuario_id != null ? `#${e.usuario_id}` : '—'
}

const columns: DataTableColumn<AuditEventOut>[] = [
  {
    key: 'created_at',
    label: 'Fecha',
    width: 150,
    render: (e) => (
      <Stack spacing={0} sx={{ lineHeight: 1.2 }}>
        <Typography variant="body2">{formatDate(e.created_at)}</Typography>
        <Typography variant="caption" color="text.secondary">
          {formatTime(e.created_at)}
        </Typography>
      </Stack>
    ),
  },
  {
    key: 'usuario',
    label: 'Usuario',
    width: 140,
    render: (e) => actorLabel(e),
  },
  {
    key: 'modulo_auditoria',
    label: 'Módulo',
    width: 130,
    render: (e) => <Chip size="small" label={e.modulo_auditoria} variant="outlined" />,
  },
  {
    key: 'accion_auditoria',
    label: 'Acción',
    width: 150,
    render: (e) => <Chip size="small" label={e.accion_auditoria} color="primary" variant="outlined" />,
  },
  {
    key: 'entidad',
    label: 'Entidad',
    width: 160,
    showFrom: 'md',
    render: (e) =>
      e.entidad_auditoria ? (
        <Typography variant="body2">
          {e.entidad_auditoria}
          {e.entidad_id_auditoria ? (
            <Typography component="span" variant="caption" color="text.secondary">
              {' '}
              #{e.entidad_id_auditoria}
            </Typography>
          ) : null}
        </Typography>
      ) : (
        '—'
      ),
  },
  {
    key: 'detalle_auditoria',
    label: 'Detalle',
    showFrom: 'lg',
    render: (e) =>
      e.detalle_auditoria ? (
        <Tooltip title={e.detalle_auditoria}>
          <Typography
            variant="body2"
            sx={{
              maxWidth: 280,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {e.detalle_auditoria}
          </Typography>
        </Tooltip>
      ) : (
        '—'
      ),
  },
  {
    key: 'ip_origen_auditoria',
    label: 'IP',
    width: 130,
    showFrom: 'lg',
    render: (e) => e.ip_origen_auditoria ?? '—',
  },
]

export default function AuditoriaTable({ eventos, loading, error, pagination }: Props) {
  return (
    <DataTable
      columns={columns}
      rows={eventos}
      loading={loading}
      error={error}
      emptyMessage="No hay eventos de auditoría para los filtros aplicados."
      getRowKey={(e) => e.auditoria_id}
      pagination={pagination}
    />
  )
}
