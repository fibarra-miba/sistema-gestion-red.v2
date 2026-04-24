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
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import PauseIcon from '@mui/icons-material/Pause'
import ReplayIcon from '@mui/icons-material/Replay'
import CancelIcon from '@mui/icons-material/Cancel'
import BlockIcon from '@mui/icons-material/Block'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import BuildIcon from '@mui/icons-material/Build'
import { useState, type MouseEvent } from 'react'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import { formatCurrencyARS, formatDate } from '@/lib/format'
import type { ContractCommercialOut } from '../types'
import { contratoActions, contratoDisplayName } from '../utils'
import ContratoEstadoChip from './ContratoEstadoChip'

export type ContratoActionKind =
  | 'view'
  | 'activate'
  | 'suspend'
  | 'resume'
  | 'cancel'
  | 'terminate'
  | 'change-plan'
  | 'confirmar-tecnica'

interface Props {
  rows: ContractCommercialOut[] | undefined
  loading?: boolean
  error?: unknown
  onAction: (action: ContratoActionKind, contrato: ContractCommercialOut) => void
  emptyMessage?: string
}

// Estrategia responsive: domicilio no se muestra en la tabla (vive en
// detalle y filtros). Las columnas secundarias (id, vigencia) se ocultan
// en mobile. Nombre del contrato + estado + cliente + plan siempre visibles.
export default function ContratosTable({
  rows,
  loading,
  error,
  onAction,
  emptyMessage,
}: Props) {
  const columns: DataTableColumn<ContractCommercialOut>[] = [
    {
      key: 'contrato_id',
      label: '#',
      width: 70,
      showFrom: 'md',
    },
    {
      key: 'contrato',
      label: 'Contrato',
      render: (r) => {
        const display = contratoDisplayName(r)
        return (
          <Stack sx={{ minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 600 }}
              noWrap
              title={display}
            >
              {display}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {r.cliente_apellido}, {r.cliente_nombre}
            </Typography>
          </Stack>
        )
      },
    },
    {
      key: 'plan_nombre',
      label: 'Plan',
      showFrom: 'sm',
      render: (r) => (
        <Typography variant="body2" noWrap title={r.plan_nombre}>
          {r.plan_nombre}
        </Typography>
      ),
    },
    {
      key: 'precio_base_contrato',
      label: 'Precio',
      width: 130,
      align: 'right',
      render: (r) => (
        <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
          {formatCurrencyARS(r.precio_base_contrato)}
        </Typography>
      ),
    },
    {
      key: 'estado',
      label: 'Estado',
      width: 140,
      render: (r) => (
        <ContratoEstadoChip
          estadoId={r.estado_contrato_id}
          descripcion={r.estado_contrato_descripcion}
        />
      ),
    },
    {
      key: 'fechas',
      label: 'Vigencia',
      width: 180,
      showFrom: 'lg',
      render: (r) => (
        <Stack>
          <Typography variant="caption" sx={{ whiteSpace: 'nowrap' }}>
            Inicio: {formatDate(r.fecha_inicio_contrato)}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ whiteSpace: 'nowrap' }}
          >
            Fin: {formatDate(r.fecha_fin_contrato)}
          </Typography>
        </Stack>
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
    <DataTable<ContractCommercialOut>
      columns={columns}
      rows={rows}
      loading={loading}
      error={error}
      getRowKey={(r) => r.contrato_id}
      onRowClick={(r) => onAction('view', r)}
      emptyMessage={emptyMessage ?? 'Todavía no hay contratos cargados.'}
    />
  )
}

function RowActions({
  row,
  onAction,
}: {
  row: ContractCommercialOut
  onAction: (action: ContratoActionKind, contrato: ContractCommercialOut) => void
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const open = !!anchor
  const flags = contratoActions(row.estado_contrato_id)
  const hasAnyAction =
    flags.canActivate ||
    flags.canSuspend ||
    flags.canResume ||
    flags.canTerminate ||
    flags.canCancel ||
    flags.canChangePlan ||
    flags.canConfirmarTecnica

  const handleOpen = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    setAnchor(e.currentTarget)
  }

  const handleClose = () => setAnchor(null)

  const fire = (action: ContratoActionKind) => {
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
        {flags.canActivate && (
          <MenuItem onClick={() => fire('activate')}>
            <PlayArrowIcon fontSize="small" sx={{ mr: 1 }} /> Activar
          </MenuItem>
        )}
        {flags.canConfirmarTecnica && (
          <MenuItem onClick={() => fire('confirmar-tecnica')}>
            <BuildIcon fontSize="small" sx={{ mr: 1 }} /> Confirmar condición técnica
          </MenuItem>
        )}
        {flags.canSuspend && (
          <MenuItem onClick={() => fire('suspend')}>
            <PauseIcon fontSize="small" sx={{ mr: 1 }} /> Suspender
          </MenuItem>
        )}
        {flags.canResume && (
          <MenuItem onClick={() => fire('resume')}>
            <ReplayIcon fontSize="small" sx={{ mr: 1 }} /> Reanudar
          </MenuItem>
        )}
        {flags.canChangePlan && (
          <MenuItem onClick={() => fire('change-plan')}>
            <SwapHorizIcon fontSize="small" sx={{ mr: 1 }} /> Cambiar plan
          </MenuItem>
        )}
        {flags.canTerminate && (
          <MenuItem onClick={() => fire('terminate')}>
            <BlockIcon fontSize="small" sx={{ mr: 1 }} /> Dar de baja
          </MenuItem>
        )}
        {flags.canCancel && (
          <MenuItem onClick={() => fire('cancel')}>
            <CancelIcon fontSize="small" sx={{ mr: 1 }} /> Cancelar
          </MenuItem>
        )}
      </Menu>
    </Stack>
  )
}
