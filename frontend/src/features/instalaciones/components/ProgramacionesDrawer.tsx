import {
  Alert,
  Badge,
  Box,
  Divider,
  Drawer,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import EventIcon from '@mui/icons-material/Event'
import PlayCircleIcon from '@mui/icons-material/PlayCircle'
import { useMemo, useState } from 'react'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import { isApiError } from '@/types/api'
import { useProgramaciones } from '../hooks/useProgramaciones'
import {
  ESTADO_PROGRAMACION,
  ESTADO_PROGRAMACION_OPTIONS,
  formatDateTime,
  programacionContratoLabel,
  programacionDomicilioLabel,
} from '../utils'
import type {
  ListProgramacionesParams,
  ProgramacionInstalacionOut,
} from '../types'
import ProgramacionEstadoChip from './ProgramacionEstadoChip'

export type ProgramacionActionKind = 'reprogramar' | 'ejecutar'

interface Props {
  open: boolean
  onClose: () => void
  onAction: (
    action: ProgramacionActionKind,
    programacion: ProgramacionInstalacionOut,
  ) => void
}

// Drawer lateral con las programaciones. Por defecto filtra por
// PROGRAMADA (pendientes de ejecutar) — el usuario puede cambiar.
export default function ProgramacionesDrawer({
  open,
  onClose,
  onAction,
}: Props) {
  const [filters, setFilters] = useState<ListProgramacionesParams>({
    estado_programacion_id: ESTADO_PROGRAMACION.PROGRAMADA,
  })

  const params = useMemo(() => filters, [filters])
  const { data, isLoading, error } = useProgramaciones(params)

  const pendientesCount =
    filters.estado_programacion_id === ESTADO_PROGRAMACION.PROGRAMADA
      ? data?.length ?? 0
      : data?.filter(
          (p) => p.estado_programacion_id === ESTADO_PROGRAMACION.PROGRAMADA,
        ).length ?? 0

  const errorMsg = error && isApiError(error) ? error.detail : null

  const columns: DataTableColumn<ProgramacionInstalacionOut>[] = [
    { key: 'programacion_id', label: '#', width: 70 },
    {
      key: 'fecha',
      label: 'Fecha',
      width: 170,
      render: (r) => (
        <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
          {formatDateTime(r.fecha_programacion_pinstalacion)}
        </Typography>
      ),
    },
    {
      key: 'tecnico',
      label: 'Técnico',
      render: (r) => (
        <Typography variant="body2" noWrap title={r.tecnico_pinstalacion ?? undefined}>
          {r.tecnico_pinstalacion ?? '—'}
        </Typography>
      ),
    },
    {
      key: 'contrato',
      label: 'Contrato',
      showFrom: 'sm',
      render: (r) => {
        const contrato = programacionContratoLabel(r)
        const domicilio = programacionDomicilioLabel(r)
        return (
          <Stack sx={{ minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 600 }}
              noWrap
              title={contrato}
            >
              {contrato}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
              title={domicilio}
            >
              {domicilio}
            </Typography>
          </Stack>
        )
      },
    },
    {
      key: 'estado',
      label: 'Estado',
      width: 130,
      render: (r) => (
        <ProgramacionEstadoChip estadoId={r.estado_programacion_id} />
      ),
    },
    {
      key: 'acciones',
      label: '',
      width: 96,
      align: 'right',
      render: (r) => <ProgramacionRowActions row={r} onAction={onAction} />,
    },
  ]

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 560, md: 720 },
            maxWidth: '100%',
          },
        },
      }}
    >
      <Stack sx={{ height: '100%' }}>
        <Stack
          direction="row"
          spacing={1}
          sx={{
            p: 2,
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Badge
              color="warning"
              badgeContent={pendientesCount}
              max={99}
              showZero={false}
            >
              <EventIcon />
            </Badge>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Programaciones
            </Typography>
          </Stack>
          <IconButton onClick={onClose} size="small" aria-label="cerrar">
            <CloseIcon />
          </IconButton>
        </Stack>

        <Box sx={{ p: 2 }}>
          <TextField
            select
            size="small"
            label="Estado"
            value={filters.estado_programacion_id ?? ''}
            onChange={(e) =>
              setFilters({
                ...filters,
                estado_programacion_id: e.target.value
                  ? Number(e.target.value)
                  : undefined,
              })
            }
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="">Todas</MenuItem>
            {ESTADO_PROGRAMACION_OPTIONS.map((opt) => (
              <MenuItem key={opt.id} value={opt.id}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        <Divider />

        <Box sx={{ flex: 1, minHeight: 0, p: 2, overflow: 'auto' }}>
          {errorMsg && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMsg}
            </Alert>
          )}
          <DataTable<ProgramacionInstalacionOut>
            columns={columns}
            rows={data}
            loading={isLoading}
            error={error}
            getRowKey={(r) => r.programacion_id}
            emptyMessage="No hay programaciones para este filtro."
          />
        </Box>
      </Stack>
    </Drawer>
  )
}

function ProgramacionRowActions({
  row,
  onAction,
}: {
  row: ProgramacionInstalacionOut
  onAction: (
    action: ProgramacionActionKind,
    programacion: ProgramacionInstalacionOut,
  ) => void
}) {
  const isProgramada =
    row.estado_programacion_id === ESTADO_PROGRAMACION.PROGRAMADA

  return (
    <Stack direction="row" spacing={0.25} sx={{ justifyContent: 'flex-end' }}>
      <Tooltip title={isProgramada ? 'Ejecutar (crear instalación)' : 'Solo disponible si está PROGRAMADA'}>
        <span>
          <IconButton
            size="small"
            color="primary"
            onClick={() => onAction('ejecutar', row)}
            disabled={!isProgramada}
          >
            <PlayCircleIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={isProgramada ? 'Reprogramar' : 'Solo disponible si está PROGRAMADA'}>
        <span>
          <IconButton
            size="small"
            onClick={() => onAction('reprogramar', row)}
            disabled={!isProgramada}
          >
            <EventIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  )
}
