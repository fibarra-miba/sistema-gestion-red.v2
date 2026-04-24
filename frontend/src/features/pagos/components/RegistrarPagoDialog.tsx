import { useEffect, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import { isApiError } from '@/types/api'
import { formatCurrencyARS } from '@/lib/format'
import { useMediosPagos, useTiposPago } from '@/features/catalogos'
import type { PagoMovimientoIn } from '../types'
import { datetimeLocalToIso, isoToDatetimeLocal } from '../utils'

interface ComprobanteField {
  url: string
  mime: string
  hash: string
}

interface FormValues {
  fecha_pago: string
  monto_pago: string
  medio_pago_id: number | ''
  tipo_pago_id: number | ''
  observacion: string
  comprobantes: ComprobanteField[]
}

function nowLocal(): string {
  return isoToDatetimeLocal(new Date().toISOString())
}

function defaults(): FormValues {
  return {
    fecha_pago: nowLocal(),
    monto_pago: '',
    medio_pago_id: '',
    tipo_pago_id: '',
    observacion: '',
    comprobantes: [],
  }
}

interface Props {
  open: boolean
  pagoId: number | null
  saldoPendiente?: number | null
  totalFactura?: number | null
  periodoLabel?: string | null
  loading?: boolean
  error?: unknown
  onConfirm: (pagoId: number, payload: PagoMovimientoIn) => void | Promise<void>
  onCancel: () => void
}

export default function RegistrarPagoDialog({
  open,
  pagoId,
  saldoPendiente,
  totalFactura,
  periodoLabel,
  loading,
  error,
  onConfirm,
  onCancel,
}: Props) {
  const mediosQuery = useMediosPagos()
  const tiposQuery = useTiposPago()

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: defaults() })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'comprobantes',
  })

  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (open) {
      reset(defaults())
      setInitialized(false)
    }
  }, [open, reset])

  // Precargar monto con saldo pendiente (si hay) al abrir.
  useEffect(() => {
    if (open && !initialized && saldoPendiente != null) {
      setValue('monto_pago', String(saldoPendiente))
      setInitialized(true)
    }
  }, [open, initialized, saldoPendiente, setValue])

  const monto = Number(watch('monto_pago') || 0)
  const excedente =
    saldoPendiente != null && monto > saldoPendiente
      ? monto - saldoPendiente
      : 0

  const errorMsg = resolveErrorMessage(error)

  const onSubmit = async (values: FormValues) => {
    if (pagoId == null) return
    const comprobantes = values.comprobantes
      .filter((c) => c.url.trim())
      .map((c) => ({
        url: c.url.trim(),
        mime: c.mime.trim() || null,
        hash: c.hash.trim() || null,
      }))

    const payload: PagoMovimientoIn = {
      fecha_pago: datetimeLocalToIso(values.fecha_pago),
      monto_pago: Number(values.monto_pago),
      medio_pago_id: Number(values.medio_pago_id),
      tipo_pago_id: Number(values.tipo_pago_id),
      observacion: values.observacion.trim() || null,
      comprobantes: comprobantes.length > 0 ? comprobantes : null,
    }
    await onConfirm(pagoId, payload)
  }

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onCancel}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Registrar pago
        {pagoId != null && ` · #${pagoId}`}
      </DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent>
          <Stack spacing={2}>
            {(periodoLabel || totalFactura != null) && (
              <Paper variant="outlined" sx={{ p: 1.5 }}>
                <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap' }}>
                  {periodoLabel && (
                    <Summary label="Período" value={periodoLabel} />
                  )}
                  {totalFactura != null && (
                    <Summary
                      label="Total factura"
                      value={formatCurrencyARS(totalFactura)}
                    />
                  )}
                  {saldoPendiente != null && (
                    <Summary
                      label="Saldo pendiente"
                      value={formatCurrencyARS(saldoPendiente)}
                    />
                  )}
                </Stack>
              </Paper>
            )}

            {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

            {excedente > 0 && (
              <Alert severity="info">
                El monto supera el saldo en {formatCurrencyARS(excedente)}. Se
                generará saldo a favor del cliente.
              </Alert>
            )}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                type="datetime-local"
                label="Fecha de pago"
                required
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
                error={!!errors.fecha_pago}
                helperText={errors.fecha_pago?.message}
                {...register('fecha_pago', {
                  required: 'Fecha requerida',
                })}
              />
              <TextField
                type="number"
                label="Monto"
                required
                fullWidth
                slotProps={{ htmlInput: { min: 0.01, step: '0.01' } }}
                error={!!errors.monto_pago}
                helperText={errors.monto_pago?.message}
                {...register('monto_pago', {
                  required: 'Monto requerido',
                  validate: (v) => {
                    const n = Number(v)
                    if (Number.isNaN(n)) return 'Debe ser un número'
                    if (n <= 0) return 'Debe ser mayor a 0'
                    return true
                  },
                })}
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                select
                label="Medio de pago"
                required
                fullWidth
                defaultValue=""
                error={!!errors.medio_pago_id}
                helperText={
                  errors.medio_pago_id?.message ??
                  (mediosQuery.error ? 'Error al cargar medios.' : ' ')
                }
                disabled={mediosQuery.isLoading}
                {...register('medio_pago_id', {
                  required: 'Requerido',
                  valueAsNumber: true,
                })}
              >
                {(mediosQuery.data ?? []).map((m) => (
                  <MenuItem key={m.id} value={m.id}>
                    {m.descripcion}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Tipo de pago"
                required
                fullWidth
                defaultValue=""
                error={!!errors.tipo_pago_id}
                helperText={
                  errors.tipo_pago_id?.message ??
                  (tiposQuery.error ? 'Error al cargar tipos.' : ' ')
                }
                disabled={tiposQuery.isLoading}
                {...register('tipo_pago_id', {
                  required: 'Requerido',
                  valueAsNumber: true,
                })}
              >
                {(tiposQuery.data ?? []).map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.descripcion}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <TextField
              label="Observación"
              fullWidth
              multiline
              rows={2}
              slotProps={{ htmlInput: { maxLength: 200 } }}
              error={!!errors.observacion}
              helperText={errors.observacion?.message}
              {...register('observacion', {
                maxLength: { value: 200, message: 'Máximo 200 caracteres' },
              })}
            />

            <Box>
              <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: 'center', mb: 1 }}
              >
                <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                  Comprobantes
                </Typography>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => append({ url: '', mime: '', hash: '' })}
                >
                  Agregar
                </Button>
              </Stack>

              {fields.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  Sin comprobantes adjuntos.
                </Typography>
              )}

              <Stack spacing={1.5}>
                {fields.map((f, idx) => (
                  <Paper
                    key={f.id}
                    variant="outlined"
                    sx={{ p: 1.5 }}
                  >
                    <Stack spacing={1}>
                      <Stack direction="row" spacing={1}>
                        <TextField
                          label="URL"
                          required
                          fullWidth
                          size="small"
                          error={!!errors.comprobantes?.[idx]?.url}
                          helperText={
                            errors.comprobantes?.[idx]?.url?.message
                          }
                          {...register(`comprobantes.${idx}.url`, {
                            required: 'URL requerida',
                          })}
                        />
                        <IconButton
                          size="small"
                          onClick={() => remove(idx)}
                          aria-label={`eliminar comprobante ${idx + 1}`}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                        <TextField
                          label="MIME"
                          size="small"
                          fullWidth
                          {...register(`comprobantes.${idx}.mime`)}
                        />
                        <TextField
                          label="Hash"
                          size="small"
                          fullWidth
                          slotProps={{ htmlInput: { maxLength: 64 } }}
                          {...register(`comprobantes.${idx}.hash`, {
                            maxLength: {
                              value: 64,
                              message: 'Máximo 64 caracteres',
                            },
                          })}
                          error={!!errors.comprobantes?.[idx]?.hash}
                          helperText={
                            errors.comprobantes?.[idx]?.hash?.message
                          }
                        />
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            Registrar
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {value}
      </Typography>
    </Box>
  )
}

function resolveErrorMessage(error: unknown): string | null {
  if (!error) return null
  if (isApiError(error)) return error.detail
  if (error instanceof Error) return error.message
  return 'Error inesperado.'
}
