import { useEffect } from 'react'
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
  Typography,
} from '@mui/material'
import { Controller, useForm } from 'react-hook-form'
import { isApiError } from '@/types/api'
import { useSnackbar } from '@/components/ui/SnackbarProvider'
import { useEstadosGarantia } from '@/features/catalogos'
import { useUpdateGarantia } from '../hooks/useUpdateGarantia'
import { ESTADO_GARANTIA } from './GarantiaEstadoChip'
import { fromDateTimeInputValue, toDateTimeInputValue } from '../utils'
import type { GarantiaOut, GarantiaUpdate } from '../types'

interface FormValues {
  estado_garantia_id: string
  monto_garantia: string
  fecha_inicio: string
  fecha_fin: string
  motivo_garantia: string
  resolucion_garantia: string
}

const emptyValues: FormValues = {
  estado_garantia_id: '',
  monto_garantia: '',
  fecha_inicio: '',
  fecha_fin: '',
  motivo_garantia: '',
  resolucion_garantia: '',
}

interface Props {
  garantia: GarantiaOut | null
  onClose: () => void
}

// Corrección integral de una garantía ya cargada: monto, fechas, motivo,
// resolución y estado. A diferencia de anular (que sólo cierra el ciclo),
// esto sirve para arreglar errores de carga en cualquier estado — incluida
// una garantía ANULADA, que ahora es editable. Si el estado elegido es
// RETENIDA la resolución pasa a ser obligatoria (el backend devuelve 422
// si falta; lo anticipamos acá para no depender del roundtrip).
export default function EditarGarantiaDialog({ garantia, onClose }: Props) {
  const { showSuccess } = useSnackbar()
  const updateGarantia = useUpdateGarantia()
  const { data: estados } = useEstadosGarantia()

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: emptyValues })

  const estadoSeleccionado = Number(watch('estado_garantia_id'))
  const requiereResolucion = estadoSeleccionado === ESTADO_GARANTIA.RETENIDA

  useEffect(() => {
    if (garantia) {
      reset({
        estado_garantia_id: String(garantia.estado_garantia_id),
        monto_garantia:
          garantia.monto_garantia != null ? String(garantia.monto_garantia) : '',
        fecha_inicio: toDateTimeInputValue(garantia.fecha_inicio_garantia),
        fecha_fin: toDateTimeInputValue(garantia.fecha_fin_garantia),
        motivo_garantia: garantia.motivo_garantia ?? '',
        resolucion_garantia: garantia.resolucion_garantia ?? '',
      })
      updateGarantia.reset()
    }
    // updateGarantia cambia en cada render: sólo nos interesa reaccionar
    // a que cambie la garantía objetivo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [garantia, reset])

  const close = () => {
    if (updateGarantia.isPending) return
    reset(emptyValues)
    updateGarantia.reset()
    onClose()
  }

  const onSubmit = async (values: FormValues) => {
    if (!garantia) return
    const payload: GarantiaUpdate = {
      estado_garantia_id: Number(values.estado_garantia_id),
      monto_garantia: values.monto_garantia ? Number(values.monto_garantia) : null,
      fecha_inicio_garantia: values.fecha_inicio
        ? fromDateTimeInputValue(values.fecha_inicio)
        : null,
      fecha_fin_garantia: values.fecha_fin
        ? fromDateTimeInputValue(values.fecha_fin)
        : null,
      motivo_garantia: values.motivo_garantia.trim() || null,
      resolucion_garantia: values.resolucion_garantia.trim() || null,
    }
    await updateGarantia.mutateAsync({ garantiaId: garantia.garantia_id, payload })
    showSuccess('Garantía actualizada.')
    onClose()
  }

  const errorMsg = resolveErrorMessage(updateGarantia.error)

  return (
    <Dialog open={!!garantia} onClose={close} maxWidth="sm" fullWidth>
      <DialogTitle>
        Editar garantía {garantia ? `#${garantia.garantia_id}` : ''}
      </DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
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
              name="estado_garantia_id"
              control={control}
              rules={{ required: 'Elegí un estado.' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Estado"
                  required
                  error={!!errors.estado_garantia_id}
                  helperText={errors.estado_garantia_id?.message}
                >
                  {(estados ?? []).map((e) => (
                    <MenuItem key={e.id} value={String(e.id)}>
                      {e.descripcion}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            <Controller
              name="monto_garantia"
              control={control}
              rules={{
                required: 'Indicá el monto del depósito.',
                validate: (v) => {
                  const n = Number(v)
                  if (Number.isNaN(n)) return 'Debe ser un número.'
                  if (n < 0) return 'No puede ser negativo.'
                  return true
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="number"
                  label="Monto del depósito"
                  required
                  slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
                  error={!!errors.monto_garantia}
                  helperText={errors.monto_garantia?.message}
                />
              )}
            />

            <Controller
              name="fecha_inicio"
              control={control}
              rules={{ required: 'Indicá la fecha de inicio.' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="datetime-local"
                  label="Inicio de garantía"
                  slotProps={{ inputLabel: { shrink: true } }}
                  error={!!errors.fecha_inicio}
                  helperText={errors.fecha_inicio?.message}
                  required
                />
              )}
            />

            <Controller
              name="fecha_fin"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="datetime-local"
                  label="Fin de garantía"
                  slotProps={{ inputLabel: { shrink: true } }}
                  helperText="Opcional."
                />
              )}
            />

            <Controller
              name="motivo_garantia"
              control={control}
              rules={{ maxLength: { value: 200, message: 'Máximo 200 caracteres' } }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Motivo"
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
              rules={{
                required: requiereResolucion
                  ? 'La resolución es obligatoria al retener el depósito.'
                  : false,
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Resolución (cómo se cerró)"
                  multiline
                  rows={2}
                  required={requiereResolucion}
                  error={!!errors.resolucion_garantia}
                  helperText={errors.resolucion_garantia?.message}
                />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={close} disabled={updateGarantia.isPending}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={updateGarantia.isPending}>
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
