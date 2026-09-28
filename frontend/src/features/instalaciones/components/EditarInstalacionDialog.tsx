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
} from '@mui/material'
import { Controller, useForm } from 'react-hook-form'
import { useEffect } from 'react'
import { isApiError } from '@/types/api'
import { useSnackbar } from '@/components/ui/SnackbarProvider'
import { useUpdateInstalacion } from '../hooks/useUpdateInstalacion'
import { fromDateTimeInputValue, toDateTimeInputValue } from '../utils'
import type { InstalacionOut, InstalacionUpdate } from '../types'

interface FormValues {
  fecha: string
  codigo: string
  observacion: string
}

interface Props {
  open: boolean
  instalacion: InstalacionOut | null
  onClose: () => void
}

// Corrección de datos de carga de una instalación ya ejecutada. El estado y
// la programación de origen no se tocan acá: son otras acciones.
export default function EditarInstalacionDialog({
  open,
  instalacion,
  onClose,
}: Props) {
  const { showSuccess } = useSnackbar()
  const updateInstalacion = useUpdateInstalacion()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { fecha: '', codigo: '', observacion: '' },
  })

  useEffect(() => {
    if (open && instalacion) {
      reset({
        fecha: toDateTimeInputValue(instalacion.fecha_instalacion),
        codigo: instalacion.codigo_instalacion ?? '',
        observacion: instalacion.observacion_instalacion ?? '',
      })
      updateInstalacion.reset()
    }
    // updateInstalacion cambia en cada render: solo nos interesa reaccionar
    // a la apertura del diálogo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, instalacion, reset])

  const onSubmit = async (v: FormValues) => {
    if (!instalacion) return

    const payload: InstalacionUpdate = {
      fecha_instalacion: fromDateTimeInputValue(v.fecha),
      codigo_instalacion: v.codigo.trim() || null,
      observacion_instalacion: v.observacion.trim() || null,
    }

    await updateInstalacion.mutateAsync({
      instalacionId: instalacion.instalacion_id,
      payload,
    })
    showSuccess('Instalación actualizada.')
    onClose()
  }

  const errorMsg = resolveErrorMessage(updateInstalacion.error)

  return (
    <Dialog
      open={open}
      onClose={updateInstalacion.isPending ? undefined : onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Editar instalación{' '}
        {instalacion ? `#${instalacion.instalacion_id}` : ''}
      </DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent dividers>
          <Stack spacing={2}>
            {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

            <Alert severity="info" variant="outlined">
              Corrige los datos de carga de la instalación. No cambia su
              estado ni la programación de origen.
            </Alert>

            <Controller
              name="fecha"
              control={control}
              rules={{
                required: 'Indicá la fecha de instalación.',
                validate: (v) =>
                  new Date(v).getTime() <= Date.now()
                    ? true
                    : 'No puede ser una fecha futura.',
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Fecha y hora de instalación"
                  type="datetime-local"
                  size="small"
                  slotProps={{ inputLabel: { shrink: true } }}
                  error={!!errors.fecha}
                  helperText={errors.fecha?.message}
                  required
                  fullWidth
                />
              )}
            />

            <Controller
              name="codigo"
              control={control}
              rules={{ maxLength: { value: 20, message: 'Máx 20 caracteres.' } }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Código"
                  size="small"
                  error={!!errors.codigo}
                  helperText={errors.codigo?.message}
                  fullWidth
                />
              )}
            />

            <Controller
              name="observacion"
              control={control}
              rules={{
                maxLength: { value: 500, message: 'Máx 500 caracteres.' },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Observación"
                  size="small"
                  multiline
                  minRows={2}
                  error={!!errors.observacion}
                  helperText={errors.observacion?.message}
                  fullWidth
                />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={updateInstalacion.isPending}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={updateInstalacion.isPending}
          >
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
