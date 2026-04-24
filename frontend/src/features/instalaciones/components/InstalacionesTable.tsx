import {
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import VisibilityIcon from '@mui/icons-material/Visibility'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined'
import ReplayIcon from '@mui/icons-material/Replay'
import BlockIcon from '@mui/icons-material/Block'
import { useState, type MouseEvent } from 'react'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import type { InstalacionOut } from '../types'
import {
  formatDateTime,
  instalacionActions,
  instalacionContratoLabel,
  instalacionDomicilioLabel,
} from '../utils'
import InstalacionEstadoChip from './InstalacionEstadoChip'

export type InstalacionActionKind =
  | 'view'
  | 'completar'
  | 'cancelar'
  | 'fallar'
  | 'reintentar'
  | 'darBaja'

interface Props {
  rows: InstalacionOut[] | undefined
  loading?: boolean
  error?: unknown
  onAction: (action: InstalacionActionKind, instalacion: InstalacionOut) => void
  emptyMessage?: string
}

export default function InstalacionesTable({
  rows,
  loading,
  error,
  onAction,
  emptyMessage,
}: Props) {
  const columns: DataTableColumn<InstalacionOut>[] = [
    {
      key: 'instalacion_id',
      label: '#',
      width: 70,
      showFrom: 'md',
    },
    {
      key: 'contrato',
      label: 'Contrato',
      render: (r) => {
        const label = instalacionContratoLabel(r)
        return (
          <Stack sx={{ minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 600 }}
              noWrap
              title={label}
            >
              {label}
            </Typography>
            {r.codigo_instalacion && (
              <Typography variant="caption" color="text.secondary" noWrap>
                Cód. {r.codigo_instalacion}
              </Typography>
            )}
          </Stack>
        )
      },
    },
    {
      key: 'domicilio',
      label: 'Domicilio',
      showFrom: 'md',
      render: (r) => {
        const label = instalacionDomicilioLabel(r)
        return (
          <Typography variant="body2" noWrap title={label}>
            {label}
          </Typography>
        )
      },
    },
    {
      key: 'fecha',
      label: 'Fecha',
      width: 170,
      render: (r) => (
        <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
          {formatDateTime(r.fecha_instalacion)}
        </Typography>
      ),
    },
    {
      key: 'estado',
      label: 'Estado',
      width: 130,
      render: (r) => <InstalacionEstadoChip estadoId={r.estado_instalacion_id} />,
    },
    {
      key: 'observacion',
      label: 'Observación',
      showFrom: 'xl',
      render: (r) => (
        <Typography
          variant="body2"
          noWrap
          title={r.observacion_instalacion ?? undefined}
          color="text.secondary"
        >
          {r.observacion_instalacion ?? '—'}
        </Typography>
      ),
    },
    {
      key: 'acciones',
      label: '',
      width: 96,
      align: 'right',
      render: (r) => <RowActions row={r} onAction={onAction} />,
    },
  ]

  return (
    <DataTable<InstalacionOut>
      columns={columns}
      rows={rows}
      loading={loading}
      error={error}
      getRowKey={(r) => r.instalacion_id}
      onRowClick={(r) => onAction('view', r)}
      emptyMessage={emptyMessage ?? 'Todavía no hay instalaciones cargadas.'}
    />
  )
}

function RowActions({
  row,
  onAction,
}: {
  row: InstalacionOut
  onAction: (action: InstalacionActionKind, instalacion: InstalacionOut) => void
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const open = !!anchor
  const flags = instalacionActions(row.estado_instalacion_id)
  const hasAnyAction =
    flags.canCompletar ||
    flags.canCancelar ||
    flags.canFallar ||
    flags.canReintentar ||
    flags.canDarBaja

  const handleOpen = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    setAnchor(e.currentTarget)
  }
  const handleClose = () => setAnchor(null)

  const fire = (action: InstalacionActionKind) => {
    handleClose()
    onAction(action, row)
  }

  return (
    <Stack
      direction="row"
      spacing={0.25}
      sx={{ justifyContent: 'flex-end' }}
      onClick={(e) => e.stopPropagation()}
    >
      <Tooltip title="Ver detalle">
        <IconButton size="small" onClick={() => onAction('view', row)}>
          <VisibilityIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title={hasAnyAction ? 'Acciones' : 'Sin acciones disponibles'}>
        <span>
          <IconButton size="small" onClick={handleOpen} disabled={!hasAnyAction}>
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Menu anchorEl={anchor} open={open} onClose={handleClose}>
        {flags.canCompletar && (
          <MenuItem onClick={() => fire('completar')}>
            <CheckCircleIcon fontSize="small" sx={{ mr: 1 }} /> Completar
          </MenuItem>
        )}
        {flags.canCancelar && (
          <MenuItem onClick={() => fire('cancelar')}>
            <CancelIcon fontSize="small" sx={{ mr: 1 }} /> Cancelar
          </MenuItem>
        )}
        {flags.canFallar && (
          <MenuItem onClick={() => fire('fallar')}>
            <ErrorOutlineIcon fontSize="small" sx={{ mr: 1 }} /> Marcar como fallida
          </MenuItem>
        )}
        {flags.canReintentar && (
          <MenuItem onClick={() => fire('reintentar')}>
            <ReplayIcon fontSize="small" sx={{ mr: 1 }} /> Reintentar
          </MenuItem>
        )}
        {flags.canDarBaja && (
          <MenuItem onClick={() => fire('darBaja')}>
            <BlockIcon fontSize="small" sx={{ mr: 1 }} /> Dar de baja instalación
          </MenuItem>
        )}
      </Menu>
    </Stack>
  )
}
