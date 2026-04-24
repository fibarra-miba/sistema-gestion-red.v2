import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemText,
  Paper,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import PaymentIcon from '@mui/icons-material/Payment'
import { isApiError } from '@/types/api'
import { formatCurrencyARS, formatDate } from '@/lib/format'
import { useMediosPagos, useTiposPago } from '@/features/catalogos'
import type { PagoMovimientoOut } from '../types'
import { usePagoDetalle } from '../hooks/usePagoDetalle'
import { formatPeriodo } from '../utils'
import PagoEstadoChip from './PagoEstadoChip'

interface Props {
  open: boolean
  pagoId: number | null
  onClose: () => void
  onRegistrar?: (pagoId: number) => void
}

export default function PagoDetalleDialog({
  open,
  pagoId,
  onClose,
  onRegistrar,
}: Props) {
  const active = open && pagoId != null
  const { data, isLoading, error } = usePagoDetalle(
    active ? (pagoId as number) : undefined,
  )
  const mediosQuery = useMediosPagos()
  const tiposQuery = useTiposPago()

  const medioPagoLabel = (id: number): string =>
    mediosQuery.data?.find((m) => m.id === id)?.descripcion ?? `#${id}`
  const tipoPagoLabel = (id: number): string =>
    tiposQuery.data?.find((t) => t.id === id)?.descripcion ?? `#${id}`

  const canRegistrar = !!data && data.pago.estado !== 'PAGADO'

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {pagoId != null ? `Pago #${pagoId}` : 'Pago'}
      </DialogTitle>
      <DialogContent>
        {isLoading && (
          <Stack spacing={1}>
            <Skeleton width="60%" height={32} />
            <Skeleton width="40%" />
            <Skeleton width="90%" />
            <Skeleton width="70%" />
          </Stack>
        )}

        {error && (
          <Alert severity="error">
            {isApiError(error) ? error.detail : 'Error al cargar el pago.'}
          </Alert>
        )}

        {!isLoading && !error && data && (
          <Stack spacing={3}>
            {/* Resumen pago */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{ alignItems: { sm: 'center' } }}
            >
              <Stack sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Contrato #{data.pago.contrato_id} · Período{' '}
                  {formatPeriodo(
                    data.pago.periodo_anio_pago,
                    data.pago.periodo_mes_pago,
                  )}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {formatCurrencyARS(data.pago.total_factura)}
                </Typography>
              </Stack>
              <PagoEstadoChip estado={data.pago.estado} />
            </Stack>

            {/* Totales */}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                divider={<Divider orientation="vertical" flexItem />}
              >
                <Metric
                  label="Total factura"
                  value={formatCurrencyARS(data.pago.total_factura)}
                />
                <Metric
                  label="Pagado"
                  value={formatCurrencyARS(data.pago.total_pagado)}
                />
                <Metric
                  label="Saldo pendiente"
                  value={formatCurrencyARS(data.pago.saldo_pendiente)}
                  highlight={data.pago.saldo_pendiente > 0}
                />
                <Metric
                  label="Excedente"
                  value={formatCurrencyARS(data.pago.excedente_credito)}
                />
              </Stack>
            </Paper>

            {/* Factura */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Factura #{data.factura.factura_venta_id}
              </Typography>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{ flexWrap: 'wrap' }}
              >
                <Metric
                  label="Emisión"
                  value={formatDate(data.factura.fecha_emision)}
                />
                <Metric
                  label="Vencimiento"
                  value={formatDate(data.factura.fecha_vencimiento)}
                />
                <Metric
                  label="Importe base"
                  value={formatCurrencyARS(data.factura.importe_base)}
                />
                <Metric
                  label="Bonificación"
                  value={formatCurrencyARS(data.factura.bonificacion)}
                />
              </Stack>
            </Box>

            <Divider />

            {/* Movimientos */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Movimientos ({data.movimientos.length})
              </Typography>
              {data.movimientos.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No hay pagos registrados todavía.
                </Typography>
              ) : (
                <Stack spacing={1.5}>
                  {data.movimientos.map((m) => (
                    <MovimientoRow
                      key={m.pago_mov_id}
                      mov={m}
                      medioLabel={medioPagoLabel(m.medio_pago_id)}
                      tipoLabel={tipoPagoLabel(m.tipo_pago_id)}
                    />
                  ))}
                </Stack>
              )}
            </Box>

            <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'action.hover' }}>
              <Typography variant="caption" color="text.secondary">
                Saldo de cuenta del cliente tras estos movimientos
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {formatCurrencyARS(data.saldo_cuenta_resultante)}
              </Typography>
            </Paper>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        {canRegistrar && onRegistrar && data && (
          <Button
            onClick={() => onRegistrar(data.pago.pago_id)}
            startIcon={<PaymentIcon />}
            variant="contained"
          >
            Registrar pago
          </Button>
        )}
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  )
}

function MovimientoRow({
  mov,
  medioLabel,
  tipoLabel,
}: {
  mov: PagoMovimientoOut
  medioLabel: string
  tipoLabel: string
}) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <Stack sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {formatCurrencyARS(mov.monto_pago)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatDate(mov.fecha_pago)} · {medioLabel} · {tipoLabel}
          </Typography>
        </Stack>
        {mov.recibo && (
          <Box>
            <Typography variant="caption" color="text.secondary">
              Recibo
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              #{mov.recibo.recibo_id}
            </Typography>
          </Box>
        )}
      </Stack>

      {mov.comprobantes.length > 0 && (
        <>
          <Divider sx={{ my: 1 }} />
          <Typography variant="caption" color="text.secondary">
            Comprobantes
          </Typography>
          <List dense disablePadding>
            {mov.comprobantes.map((c) => (
              <ListItem
                key={c.pago_comprobante_id}
                disableGutters
                secondaryAction={
                  <Tooltip title="Abrir comprobante">
                    <IconButton
                      size="small"
                      component="a"
                      href={c.comprobante_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <OpenInNewIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                }
              >
                <ListItemText
                  primary={
                    <Link
                      href={c.comprobante_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'block',
                      }}
                    >
                      {c.comprobante_url}
                    </Link>
                  }
                  secondary={c.comprobante_mime ?? undefined}
                />
              </ListItem>
            ))}
          </List>
        </>
      )}
    </Paper>
  )
}

function Metric({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <Box sx={{ minWidth: 120 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography
        variant="body1"
        sx={{ fontWeight: 700 }}
        color={highlight ? 'warning.main' : 'text.primary'}
      >
        {value}
      </Typography>
    </Box>
  )
}
