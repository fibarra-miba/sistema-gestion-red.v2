import { useState } from 'react'
import { Alert, Box, Button, Chip, CircularProgress, Paper, Stack, Typography } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EditIcon from '@mui/icons-material/Edit'
import BlockIcon from '@mui/icons-material/Block'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { isApiError } from '@/types/api'
import { useAuth } from '@/features/auth'
import { formatCurrencyARS } from '@/lib/format'
import {
  AnularGarantiaDialog,
  ESTADO_GARANTIA,
  EditarGarantiaDialog,
  GarantiaCobrosList,
  GarantiaEstadoChip,
  cobroGarantiaLabel,
  formatDateTime,
  useGarantia,
} from '@/features/instalaciones'

export default function GarantiaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const garantiaId = id && /^\d+$/.test(id) ? Number(id) : undefined

  const { hasRole, hasCapability } = useAuth()
  const canManage = hasRole('ADMIN', 'OPERADOR')
  const canCobrar = hasCapability('can_cobrar_garantias')
  const { data: g, isLoading, error } = useGarantia(garantiaId)

  const [editOpen, setEditOpen] = useState(false)
  const [anularOpen, setAnularOpen] = useState(false)

  if (garantiaId == null) {
    return <Alert severity="error">ID de garantía inválido.</Alert>
  }

  if (isLoading) {
    return (
      <Stack sx={{ alignItems: 'center', py: 6 }}>
        <CircularProgress />
      </Stack>
    )
  }

  if (error) {
    const detail = isApiError(error) ? error.detail : 'Error al cargar la garantía.'
    const isNotFound = isApiError(error) && error.status === 404
    return (
      <Stack spacing={2}>
        <Alert severity={isNotFound ? 'warning' : 'error'}>{detail}</Alert>
        <Box>
          <Button component={RouterLink} to="/garantias" startIcon={<ArrowBackIcon />}>
            Volver al listado
          </Button>
        </Box>
      </Stack>
    )
  }

  if (!g) return null

  const cliente = [g.cliente_apellido, g.cliente_nombre].filter(Boolean).join(', ')
  const esActiva = g.estado_garantia_id === ESTADO_GARANTIA.ACTIVA
  const pendiente = g.saldo_pendiente_cobro ?? 0
  const cobro = cobroGarantiaLabel(g)

  return (
    <Stack spacing={{ xs: 2, md: 3 }} sx={{ minWidth: 0 }}>
      <Box>
        <Button component={RouterLink} to="/garantias" startIcon={<ArrowBackIcon />} size="small">
          Garantías
        </Button>
      </Box>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={{ xs: 1.5, sm: 2 }}
        sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', minWidth: 0 }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography component="h1" variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Garantía #{g.garantia_id}
            </Typography>
            <GarantiaEstadoChip estadoId={g.estado_garantia_id} descripcion={g.descripcion_egarantia} />
          </Stack>
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center', mt: 0.75, flexWrap: 'wrap', rowGap: 0.5 }}
          >
            <Chip
              size="small"
              variant="outlined"
              component={RouterLink}
              to={`/clientes/${g.cliente_id}`}
              clickable
              label={`Cliente: ${cliente || `#${g.cliente_id}`}`}
            />
            <Chip size="small" variant="outlined" label={`Contrato #${g.contrato_id}`} />
            <Chip size="small" variant="outlined" label={`Instalación #${g.instalacion_id}`} />
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            {g.nombre_producto ?? `Producto #${g.producto_id}`} {g.marca_producto} {g.modelo_producto}
          </Typography>
        </Box>
        {canManage && (
          <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
            <Button variant="outlined" startIcon={<EditIcon />} onClick={() => setEditOpen(true)}>
              Editar
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<BlockIcon />}
              disabled={!esActiva}
              onClick={() => setAnularOpen(true)}
            >
              Anular
            </Button>
          </Stack>
        )}
      </Stack>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          Depósito
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ flexWrap: 'wrap', rowGap: 2 }}>
          <Field label="Monto total" value={formatCurrencyARS(g.monto_garantia)} />
          <Field label="Cobrado" value={formatCurrencyARS(g.total_cobrado)} />
          <Field
            label="Pendiente de cobro"
            value={formatCurrencyARS(g.saldo_pendiente_cobro)}
            color={pendiente > 0 ? 'warning.main' : undefined}
            bold={pendiente > 0}
          />
          <Field label="Estado de cobro" value={cobro.text} />
          <Field label="Inicio" value={formatDateTime(g.fecha_inicio_garantia)} />
          <Field label="Fin" value={g.fecha_fin_garantia ? formatDateTime(g.fecha_fin_garantia) : '—'} />
        </Stack>
        {(g.motivo_garantia || g.resolucion_garantia) && (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mt: 2 }}>
            {g.motivo_garantia && <Field label="Motivo" value={g.motivo_garantia} />}
            {g.resolucion_garantia && <Field label="Resolución" value={g.resolucion_garantia} />}
          </Stack>
        )}
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          Cobros
        </Typography>
        <GarantiaCobrosList garantia={g} canCobrar={canCobrar} />
      </Paper>

      {canManage && (
        <>
          <EditarGarantiaDialog garantia={editOpen ? g : null} onClose={() => setEditOpen(false)} />
          <AnularGarantiaDialog garantia={anularOpen ? g : null} onClose={() => setAnularOpen(false)} />
        </>
      )}
    </Stack>
  )
}

function Field({
  label,
  value,
  color,
  bold,
}: {
  label: string
  value: string
  color?: string
  bold?: boolean
}) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ color, fontWeight: bold ? 700 : undefined }}>
        {value}
      </Typography>
    </Box>
  )
}
