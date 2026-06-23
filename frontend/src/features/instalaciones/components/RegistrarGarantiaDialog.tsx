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
import { ProductoSelect } from '@/features/productos'
import { useCreateGarantia } from '../hooks/useCreateGarantia'
import { fromDateTimeInputValue } from '../utils'
import type { GarantiaCreate } from '../types'

interface FormValues {
  producto_id: string
  fecha_inicio_garantia: string
}

interface Props {
  open: boolean
  instalacionId: number
  // Productos instalados elegibles (EQUIPO y sin garantía activa).
  allowedProductoIds: number[]
  onClose: () => void
}

// Alta de garantía. El producto se limita a equipos instalados sin garantía
// activa (regla del negocio, reforzada en backend). Fecha inicio opcional:
// vacía = el backend usa now(); editable para carga histórica.
export default function RegistrarGarantiaDialog({
  open,
  instalacionId,
  allowedProductoIds,
  onClose,
}: Props) {
  const { showSuccess } = useSnackbar()
  const createGarantia = useCreateGarantia()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { producto_id: '', fecha_inicio_garantia: '' },
  })

  const close = () => {
    if (createGarantia.isPending) return
    reset({ producto_id: '', fecha_inicio_garantia: '' })
    createGarantia.reset()
    onClose()
  }

  const onSubmit = async (values: FormValues) => {
    const payload: GarantiaCreate = {
      instalacion_id: instalacionId,
      producto_id: Number(values.producto_id),
      fecha_inicio_garantia: values.fecha_inicio_garantia
        ? fromDateTimeInputValue(values.fecha_inicio_garantia)
        : null,
    }
    await createGarantia.mutateAsync(payload)
    reset({ producto_id: '', fecha_inicio_garantia: '' })
    createGarantia.reset()
    showSuccess('Garantía registrada.')
    onClose()
  }

  const errorMsg = resolveErrorMessage(createGarantia.error)
  const sinElegibles = allowedProductoIds.length === 0

  return (
    <Dialog open={open} onClose={close} maxWidth="sm" fullWidth>
      <DialogTitle>Registrar garantía</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent dividers>
          <Stack spacing={2}>
            {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
            {sinElegibles && (
              <Alert severity="info">
                No hay equipos instalados sin garantía activa para esta instalación.
                Agregá el equipo en los detalles o anulá la garantía vigente.
              </Alert>
            )}

            <Controller
              name="producto_id"
              control={control}
              rules={{
                required: 'Elegí un equipo.',
                validate: (v) =>
                  Number.isFinite(Number(v)) && Number(v) > 0 ? true : 'Elegí un equipo.',
              }}
              render={({ field }) => (
                <ProductoSelect
                  label="Equipo a garantizar"
                  value={field.value ? Number(field.value) : null}
                  onChange={(id) => field.onChange(id != null ? String(id) : '')}
                  tipoCodigo="EQUIPO"
                  allowedIds={allowedProductoIds}
                  noOptionsText="Sin equipos elegibles."
                  disabled={sinElegibles}
                  error={!!errors.producto_id}
                  helperText={errors.producto_id?.message}
                  required
                />
              )}
            />

            <Controller
              name="fecha_inicio_garantia"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="datetime-local"
                  label="Inicio de garantía"
                  slotProps={{ inputLabel: { shrink: true } }}
                  helperText="Opcional. Vacío = fecha y hora actual."
                />
              )}
            />

            <Typography variant="caption" color="text.secondary">
              La garantía nace ACTIVA. El contrato se toma de la instalación.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={close} disabled={createGarantia.isPending}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={createGarantia.isPending || sinElegibles}
          >
            Registrar
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
