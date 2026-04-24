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
import { useContrato } from '../hooks/useContrato'
import { contratoDisplayName } from '../utils'
import ContratoEstadoChip from './ContratoEstadoChip'

interface Props {
  open: boolean
  contratoId: number | undefined
  onClose: () => void
}

export default function ContratoDetailDialog({
  open,
  contratoId,
  onClose,
}: Props) {
  const active = open && contratoId != null
  const { data: contrato, isLoading, error } = useContrato(
    active ? contratoId : undefined,
  )

  const displayName = contrato ? contratoDisplayName(contrato) : null

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
            <DetailRow
              label="Promoción"
              value={
                contrato.aplica_promocion
                  ? contrato.promocion_id != null
                    ? `Sí · Promoción #${contrato.promocion_id}`
                    : 'Sí'
                  : 'No'
              }
            />
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
