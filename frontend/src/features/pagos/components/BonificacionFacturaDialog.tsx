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
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { isApiError } from '@/types/api'
import { formatCurrencyARS } from '@/lib/format'
import type { PatchFacturaBonificacionIn } from '../types'

interface FormValues {
  bonificacion_fventas: string
}

interface Props {
  open: boolean
  facturaVentaId: number | null
  bonificacionActual?: number | null
  importeBase?: number | null
  loading?: boolean
  error?: unknown
  onConfirm: (
    facturaVentaId: number,
    payload: PatchFacturaBonificacionIn,
  ) => void | Promise<void>
  onCancel: () => void
}

export default function BonificacionFacturaDialog({
  open,
  facturaVentaId,
  bonificacionActual,
  importeBase,
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
  } = useForm<FormValues>({
    defaultValues: { bonificacion_fventas: '0' },
  })

  useEffect(() => {
    if (open) {
      reset({
        bonificacion_fventas:
          bonificacionActual != null ? String(bonificacionActual) : '0',
      })
    }
  }, [open, bonificacionActual, reset])

  const errorMsg = resolveErrorMessage(error)

  const onSubmit = async (values: FormValues) => {
    if (facturaVentaId == null) return
    await onConfirm(facturaVentaId, {
      bonificacion_fventas: Number(values.bonificacion_fventas),
    })
  }

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onCancel}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>
        Ajustar bonificación {facturaVentaId != null && `· F #${facturaVentaId}`}
      </DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent>
          <Stack spacing={2}>
            {importeBase != null && (
              <Typography variant="body2" color="text.secondary">
                Importe base: <strong>{formatCurrencyARS(importeBase)}</strong>
              </Typography>
            )}
            {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

            <TextField
              type="number"
              label="Bonificación"
              required
              fullWidth
              slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
              error={!!errors.bonificacion_fventas}
              helperText={
                errors.bonificacion_fventas?.message ??
                'El backend rechaza el cambio si la factura tiene pagos registrados.'
              }
              {...register('bonificacion_fventas', {
                required: 'Requerido',
                validate: (v) => {
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
            Guardar
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
