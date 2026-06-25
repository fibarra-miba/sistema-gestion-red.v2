import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { isApiError } from '@/types/api'
import { useSnackbar } from '@/components/ui/SnackbarProvider'
import { useAjusteStock, useDevolucionStock } from '../hooks/useStockMovimientos'
import type { ExistenciaOut } from '../types'

type TipoMov = 'AJUSTE_POSITIVO' | 'AJUSTE_NEGATIVO' | 'DEVOLUCION'

interface FormValues {
  tipo: TipoMov
  cantidad: string
  motivo: string
}

interface Props {
  existencia: ExistenciaOut | null
  open: boolean
  onClose: () => void
}

export default function MovimientoStockDialog({ existencia, open, onClose }: Props) {
  const { showSuccess } = useSnackbar()
  const ajuste = useAjusteStock()
  const devolucion = useDevolucionStock()

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { tipo: 'AJUSTE_POSITIVO', cantidad: '', motivo: '' },
  })

  useEffect(() => {
    if (open) {
      reset({ tipo: 'AJUSTE_POSITIVO', cantidad: '', motivo: '' })
      ajuste.reset()
      devolucion.reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!existencia) return null

  const pending = ajuste.isPending || devolucion.isPending
  const error = ajuste.error ?? devolucion.error
  const errorMsg = resolveErrorMessage(error)

  const onSubmit = async (values: FormValues) => {
    const cantidad = Number(values.cantidad)
    const motivo = values.motivo.trim()
    if (values.tipo === 'DEVOLUCION') {
      await devolucion.mutateAsync({
        producto_id: existencia.producto_id,
        cantidad,
        motivo,
      })
    } else {
      await ajuste.mutateAsync({
        producto_id: existencia.producto_id,
        cantidad,
        positivo: values.tipo === 'AJUSTE_POSITIVO',
        motivo,
      })
    }
    showSuccess('Movimiento de stock registrado.')
    onClose()
  }

  const unidad = existencia.unidad_stock_producto ?? 'u.'

  return (
    <Dialog open={open} onClose={pending ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Movimiento de stock</DialogTitle>
      <DialogContent>
        <Stack
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          spacing={2}
          noValidate
          sx={{ mt: 0.5 }}
        >
          <Typography variant="body2" color="text.secondary">
            {existencia.nombre_producto} — existencia actual: {existencia.cantidad} {unidad}
          </Typography>

          {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

          <Controller
            control={control}
            name="tipo"
            render={({ field }) => (
              <TextField {...field} select label="Tipo de movimiento" required>
                <MenuItem value="AJUSTE_POSITIVO">Ajuste positivo (+)</MenuItem>
                <MenuItem value="AJUSTE_NEGATIVO">Ajuste negativo (−)</MenuItem>
                <MenuItem value="DEVOLUCION">Devolución a stock (+)</MenuItem>
              </TextField>
            )}
          />

          <TextField
            label={`Cantidad (${unidad})`}
            type="number"
            required
            slotProps={{ htmlInput: { min: 0, step: 'any' } }}
            error={!!errors.cantidad}
            helperText={errors.cantidad?.message}
            {...register('cantidad', {
              required: 'Cantidad requerida',
              validate: (v) => Number(v) > 0 || 'Debe ser mayor a cero',
            })}
          />

          <TextField
            label="Motivo"
            required
            error={!!errors.motivo}
            helperText={errors.motivo?.message}
            {...register('motivo', {
              required: 'Motivo requerido',
              maxLength: { value: 150, message: 'Máximo 150 caracteres' },
            })}
          />

          <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
            <Button onClick={onClose} disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" disabled={pending}>
              Registrar
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  )
}

function resolveErrorMessage(error: unknown): string | null {
  if (!error) return null
  if (isApiError(error)) return error.detail
  if (error instanceof Error) return error.message
  return 'Error inesperado.'
}
