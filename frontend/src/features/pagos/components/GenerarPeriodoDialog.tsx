import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material'
import { isApiError } from '@/types/api'
import type { GenerarPeriodoIn } from '../types'

const MES_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1)
const CURRENT_YEAR = new Date().getFullYear()
const ANIO_OPTIONS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - 1 + i)

interface FormValues {
  periodo_anio_pago: number
  periodo_mes_pago: number
  fecha_emision: string
  fecha_vencimiento: string
  bonificacion_previa: string
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function defaults(): FormValues {
  const today = new Date()
  return {
    periodo_anio_pago: today.getFullYear(),
    periodo_mes_pago: today.getMonth() + 1,
    fecha_emision: todayIso(),
    fecha_vencimiento: '',
    bonificacion_previa: '0',
  }
}

interface Props {
  open: boolean
  contratoLabel?: string | null
  loading?: boolean
  error?: unknown
  onConfirm: (payload: GenerarPeriodoIn) => void | Promise<void>
  onCancel: () => void
}

export default function GenerarPeriodoDialog({
  open,
  contratoLabel,
  loading,
  error,
  onConfirm,
  onCancel,
}: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: defaults() })

  useEffect(() => {
    if (open) reset(defaults())
  }, [open, reset])

  const errorMsg = resolveErrorMessage(error)

  const onSubmit = async (values: FormValues) => {
    const bonif = values.bonificacion_previa.trim()
      ? Number(values.bonificacion_previa)
      : 0
    const payload: GenerarPeriodoIn = {
      periodo_anio_pago: Number(values.periodo_anio_pago),
      periodo_mes_pago: Number(values.periodo_mes_pago),
      fecha_emision: values.fecha_emision || todayIso(),
      fecha_vencimiento: values.fecha_vencimiento || null,
      bonificacion_previa: bonif,
    }
    await onConfirm(payload)
  }

  return (
    <Dialog open={open} onClose={loading ? undefined : onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>Generar período</DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent>
          <Stack spacing={2}>
            {contratoLabel && (
              <Alert severity="info" variant="outlined">
                {contratoLabel}
              </Alert>
            )}
            {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                select
                label="Mes"
                defaultValue={defaults().periodo_mes_pago}
                required
                fullWidth
                error={!!errors.periodo_mes_pago}
                helperText={errors.periodo_mes_pago?.message}
                {...register('periodo_mes_pago', {
                  required: 'Requerido',
                  valueAsNumber: true,
                })}
              >
                {MES_OPTIONS.map((m) => (
                  <MenuItem key={m} value={m}>
                    {String(m).padStart(2, '0')}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Año"
                defaultValue={defaults().periodo_anio_pago}
                required
                fullWidth
                error={!!errors.periodo_anio_pago}
                helperText={errors.periodo_anio_pago?.message}
                {...register('periodo_anio_pago', {
                  required: 'Requerido',
                  valueAsNumber: true,
                })}
              >
                {ANIO_OPTIONS.map((a) => (
                  <MenuItem key={a} value={a}>
                    {a}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                type="date"
                label="Fecha emisión"
                required
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
                error={!!errors.fecha_emision}
                helperText={errors.fecha_emision?.message}
                {...register('fecha_emision', {
                  required: 'Fecha emisión requerida',
                })}
              />

              <TextField
                type="date"
                label="Fecha vencimiento (opcional)"
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
                {...register('fecha_vencimiento')}
              />
            </Stack>

            <TextField
              type="number"
              label="Bonificación previa"
              fullWidth
              slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
              error={!!errors.bonificacion_previa}
              helperText={
                errors.bonificacion_previa?.message ??
                'Monto fijo que se descuenta de la factura.'
              }
              {...register('bonificacion_previa', {
                validate: (v) => {
                  if (!v) return true
                  const n = Number(v)
                  if (Number.isNaN(n)) return 'Debe ser un número'
                  if (n < 0) return 'No puede ser negativo'
                  return true
                },
              })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            Generar
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}

function resolveErrorMessage(error: unknown): string | null {
  if (!error) return null
  if (isApiError(error)) return error.detail
  if (error instanceof Error) return error.message
  return 'Error inesperado.'
}
