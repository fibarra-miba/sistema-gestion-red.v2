import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { isApiError } from '@/types/api'
import type { GenerarLoteIn, GenerarLoteOut } from '../types'

const MES_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1)
const CURRENT_YEAR = new Date().getFullYear()
const ANIO_OPTIONS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - 1 + i)

interface FormValues {
  periodo_anio_pago: number
  periodo_mes_pago: number
  fecha_emision: string
  fecha_vencimiento: string
  bonificacion_previa_default: string
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
    bonificacion_previa_default: '0',
  }
}

interface Props {
  open: boolean
  loading?: boolean
  error?: unknown
  result?: GenerarLoteOut | null
  onConfirm: (payload: GenerarLoteIn) => void | Promise<void>
  onClose: () => void
}

export default function GenerarLoteDialog({
  open,
  loading,
  error,
  result,
  onConfirm,
  onClose,
}: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: defaults() })

  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (open) {
      reset(defaults())
      setSubmitted(false)
    }
  }, [open, reset])

  const errorMsg = resolveErrorMessage(error)
  const showResult = submitted && !!result

  const onSubmit = async (values: FormValues) => {
    const bonif = values.bonificacion_previa_default.trim()
      ? Number(values.bonificacion_previa_default)
      : 0
    const payload: GenerarLoteIn = {
      periodo_anio_pago: Number(values.periodo_anio_pago),
      periodo_mes_pago: Number(values.periodo_mes_pago),
      fecha_emision: values.fecha_emision || todayIso(),
      fecha_vencimiento: values.fecha_vencimiento || null,
      bonificacion_previa_default: bonif,
    }
    await onConfirm(payload)
    setSubmitted(true)
  }

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Generación masiva de pagos</DialogTitle>

      {showResult ? (
        <>
          <DialogContent>
            <Stack spacing={2}>
              <Alert severity="success" variant="outlined">
                Lote procesado.
              </Alert>
              <Stack direction="row" spacing={2}>
                <ResultBox label="Creados" value={result!.creados} />
                <ResultBox
                  label="Omitidos (ya existentes)"
                  value={result!.omitidos_existentes}
                />
                <ResultBox
                  label="Errores"
                  value={result!.errores.length}
                  highlight={result!.errores.length > 0}
                />
              </Stack>

              {result!.errores.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Errores por contrato
                  </Typography>
                  <List dense disablePadding>
                    {result!.errores.map((e, i) => (
                      <ListItem
                        key={`${e.contrato_id}-${i}`}
                        disableGutters
                        sx={{ alignItems: 'flex-start' }}
                      >
                        <ListItemText
                          primary={`Contrato #${e.contrato_id} (HTTP ${e.status_code})`}
                          secondary={e.error}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose} variant="contained">
              Cerrar
            </Button>
          </DialogActions>
        </>
      ) : (
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogContent>
            <Stack spacing={2}>
              <Alert severity="info" variant="outlined">
                Se generará una factura por contrato COBRABLE para el período
                seleccionado. Los contratos que ya tengan pago para ese período
                se omiten.
              </Alert>
              {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  select
                  label="Mes"
                  defaultValue={defaults().periodo_mes_pago}
                  required
                  fullWidth
                  error={!!errors.periodo_mes_pago}
                  {...register('periodo_mes_pago', {
                    required: true,
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
                  {...register('periodo_anio_pago', {
                    required: true,
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
                  {...register('fecha_emision', { required: true })}
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
                label="Bonificación por defecto"
                fullWidth
                slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
                helperText="Se aplica a cada contrato del lote."
                {...register('bonificacion_previa_default', {
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
            <Button onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" disabled={loading}>
              Generar lote
            </Button>
          </DialogActions>
        </Box>
      )}
    </Dialog>
  )
}

function ResultBox({
  label,
  value,
  highlight,
}: {
  label: string
  value: number
  highlight?: boolean
}) {
  return (
    <Box
      sx={{
        flex: 1,
        p: 1.5,
        borderRadius: 1,
        border: '1px solid',
        borderColor: highlight ? 'error.main' : 'divider',
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography
        variant="h6"
        sx={{ fontWeight: 700 }}
        color={highlight ? 'error.main' : 'text.primary'}
      >
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
