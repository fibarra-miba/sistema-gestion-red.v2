import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Controller, useForm } from 'react-hook-form'
import { isApiError } from '@/types/api'
import { useSnackbar } from '@/components/ui/SnackbarProvider'
import { useAnularGarantia } from '../hooks/useAnularGarantia'
import { ESTADO_GARANTIA } from './GarantiaEstadoChip'
import { fromDateTimeInputValue } from '../utils'
import type { GarantiaOut } from '../types'

interface FormValues {
  motivo_garantia: string
  resolucion_garantia: string
  fecha_fin_garantia: string
}

interface Props {
  garantia: GarantiaOut | null
  onClose: () => void
}

// Anular = cierre del ciclo de garantía (equipo devuelto/reemplazado).
// Resolución obligatoria; fecha_fin opcional (vacío = ahora, lo pone el backend).
export default function AnularGarantiaDialog({ garantia, onClose }: Props) {
  const { showSuccess } = useSnackbar()
  const anular = useAnularGarantia()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { motivo_garantia: '', resolucion_garantia: '', fecha_fin_garantia: '' },
  })

  const close = () => {
    if (anular.isPending) return
    reset()
    anular.reset()
    onClose()
  }

  const onSubmit = async (values: FormValues) => {
    if (!garantia) return
    await anular.mutateAsync({
      garantiaId: garantia.garantia_id,
      payload: {
        estado_garantia_id: ESTADO_GARANTIA.ANULADA,
        motivo_garantia: values.motivo_garantia.trim() || null,
        resolucion_garantia: values.resolucion_garantia.trim(),
        fecha_fin_garantia: values.fecha_fin_garantia
          ? fromDateTimeInputValue(values.fecha_fin_garantia)
          : null,
      },
    })
    reset()
    anular.reset()
    showSuccess('Garantía anulada.')
    onClose()
  }

  const errorMsg = resolveErrorMessage(anular.error)

  return (
    <Dialog open={!!garantia} onClose={close} maxWidth="sm" fullWidth>
      <DialogTitle>Anular garantía</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent dividers>
          <Stack spacing={2}>
            {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

            {garantia && (
              <Typography variant="body2" color="text.secondary">
                {garantia.nombre_producto} — {garantia.marca_producto}{' '}
                {garantia.modelo_producto}
              </Typography>
            )}

            <Controller
              name="motivo_garantia"
              control={control}
              rules={{ maxLength: { value: 200, message: 'Máximo 200 caracteres' } }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Motivo (falla reportada)"
                  placeholder="Ej. Router no enciende"
                  multiline
                  rows={2}
                  error={!!errors.motivo_garantia}
                  helperText={errors.motivo_garantia?.message}
                />
              )}
            />

            <Controller
              name="resolucion_garantia"
              control={control}
              rules={{ required: 'La resolución es obligatoria al anular.' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Resolución (acción tomada)"
                  placeholder="Ej. Reemplazado por equipo nuevo"
                  multiline
                  rows={2}
                  required
                  error={!!errors.resolucion_garantia}
                  helperText={errors.resolucion_garantia?.message}
                />
              )}
            />

            <Controller
              name="fecha_fin_garantia"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="datetime-local"
                  label="Fin de garantía"
                  slotProps={{ inputLabel: { shrink: true } }}
                  helperText="Opcional. Vacío = fecha y hora actual."
                />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={close} disabled={anular.isPending}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" color="error" disabled={anular.isPending}>
            Anular garantía
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

function resolveErrorMessage(error: unknown): string | null {
  if (!error) return null
  if (isApiError(error)) return error.detail
  if (error instanceof Error) return error.message
  return 'Error inesperado.'
}
