import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import { isApiError } from '@/types/api'
import { formatCurrencyARS, formatDate } from '@/lib/format'
import { useAuth } from '@/features/auth'
import { useSnackbar } from '@/components/ui/SnackbarProvider'
import { PromocionSelect } from '@/features/promociones'
import { useContrato } from '../hooks/useContrato'
import { useContratoActions } from '../hooks/useContratoActions'
import { contratoDisplayName } from '../utils'
import ContratoEstadoChip from './ContratoEstadoChip'

interface Props {
  open: boolean
  contratoId: number | undefined
  onClose: () => void
}

// Estados terminales donde no tiene sentido tocar la promo (espeja el backend).
const ESTADOS_SIN_PROMO = [5, 6] // BAJA, CANCELADO

export default function ContratoDetailDialog({
  open,
  contratoId,
  onClose,
}: Props) {
  const active = open && contratoId != null
  const { data: contrato, isLoading, error } = useContrato(
    active ? contratoId : undefined,
  )

  const { hasCapability } = useAuth()
  const canManage = hasCapability('can_manage_contratos')
  const { showSuccess } = useSnackbar()
  const { asignarPromo, quitarPromo } = useContratoActions()

  const [promoSel, setPromoSel] = useState<number | null>(null)

  useEffect(() => {
    setPromoSel(contrato?.promocion_id ?? null)
  }, [contrato?.contrato_id, contrato?.promocion_id])

  const displayName = contrato ? contratoDisplayName(contrato) : null

  const puedeGestionarPromo =
    canManage &&
    contrato != null &&
    !ESTADOS_SIN_PROMO.includes(contrato.estado_contrato_id)

  const promoBusy = asignarPromo.isPending || quitarPromo.isPending
  const promoError = asignarPromo.error ?? quitarPromo.error

  const handleAsignar = async () => {
    if (contrato == null || promoSel == null) return
    await asignarPromo.mutateAsync({
      contratoId: contrato.contrato_id,
      promocionId: promoSel,
    })
    showSuccess('Promoción asignada al contrato.')
  }

  const handleQuitar = async () => {
    if (contrato == null) return
    await quitarPromo.mutateAsync(contrato.contrato_id)
    showSuccess('Promoción quitada del contrato.')
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {displayName ?? (contratoId != null ? `Contrato #${contratoId}` : 'Contrato')}
      </DialogTitle>
      <DialogContent>
        {isLoading && (
          <Stack spacing={1}>
            <Skeleton width="70%" height={32} />
            <Skeleton width="40%" />
            <Skeleton width="90%" />
            <Skeleton width="60%" />
          </Stack>
        )}

        {error && (
          <Alert severity="error">
            {isApiError(error) ? error.detail : 'Error al cargar el contrato.'}
          </Alert>
        )}

        {!isLoading && !error && contrato && (
          <Stack spacing={3}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Stack sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Contrato #{contrato.contrato_id}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }} noWrap>
                  {contrato.cliente_apellido}, {contrato.cliente_nombre}
                </Typography>
              </Stack>
              <ContratoEstadoChip
                estadoId={contrato.estado_contrato_id}
                descripcion={contrato.estado_contrato_descripcion}
              />
            </Stack>

            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block' }}
              >
                Precio congelado del contrato
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {formatCurrencyARS(contrato.precio_base_contrato)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                No cambia aunque varíe el precio del plan.
              </Typography>
            </Paper>

            <Divider />

            <DetailRow
              label="Domicilio"
              value={contrato.domicilio_resumen ?? '—'}
            />
            <DetailRow label="Plan" value={contrato.plan_nombre} />
            <DetailRow
              label="Inicio"
              value={formatDate(contrato.fecha_inicio_contrato)}
            />
            <DetailRow
              label="Fin"
              value={formatDate(contrato.fecha_fin_contrato)}
            />

            <Box>
              <Typography variant="caption" color="text.secondary">
                Promoción
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {contrato.aplica_promocion && contrato.promocion_id != null
                  ? `Promoción #${contrato.promocion_id}`
                  : 'Sin promoción'}
              </Typography>

              {puedeGestionarPromo && (
                <Stack spacing={1.5} sx={{ mt: 1.5 }}>
                  {promoError && (
                    <Alert severity="error">
                      {isApiError(promoError)
                        ? promoError.detail
                        : 'Error al actualizar la promoción.'}
                    </Alert>
                  )}
                  <PromocionSelect
                    value={promoSel}
                    onChange={(id) => setPromoSel(id)}
                    size="small"
                    label="Promoción"
                  />
                  <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                    {contrato.aplica_promocion && (
                      <Button
                        size="small"
                        color="error"
                        onClick={handleQuitar}
                        disabled={promoBusy}
                      >
                        Quitar
                      </Button>
                    )}
                    <Button
                      size="small"
                      variant="contained"
                      onClick={handleAsignar}
                      disabled={promoBusy || promoSel == null || promoSel === contrato.promocion_id}
                    >
                      {contrato.aplica_promocion ? 'Cambiar' : 'Asignar'}
                    </Button>
                  </Stack>
                </Stack>
              )}
            </Box>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  )
}

function DetailRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {value}
      </Typography>
    </Box>
  )
}
