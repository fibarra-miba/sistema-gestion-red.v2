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
import { Controller, useForm } from 'react-hook-form'
import { useEffect } from 'react'
import { isApiError } from '@/types/api'
import type {
  EjecutarProgramacionIn,
  ProgramacionInstalacionOut,
} from '../types'
import {
  fromDateTimeInputValue,
  programacionContratoLabel,
  programacionDomicilioLabel,
  toDateTimeInputValue,
} from '../utils'

interface FormValues {
  codigo: string
  fecha: string
  observacion: string
}

interface Props {
  open: boolean
  programacion: ProgramacionInstalacionOut | null
  loading?: boolean
  error?: unknown
  onConfirm: (payload: EjecutarProgramacionIn) => void | Promise<void>
  onCancel: () => void
}

// Ejecuta la programación creando la instalación. El backend resuelve
// contrato_id / domicilio_id / programacion_id desde la programación —
// acá sólo enviamos datos operativos.
export default function CrearInstalacionDialog({
  open,
  programacion,
  loading,
  error,
  onConfirm,
  onCancel,
}: Props) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { codigo: '', fecha: '', observacion: '' },
  })

  useEffect(() => {
    if (open && programacion) {
      reset({
        codigo: '',
        fecha: toDateTimeInputValue(
          programacion.fecha_programacion_pinstalacion,
        ),
        observacion: '',
      })
    }
  }, [open, programacion, reset])

  const errorMsg = resolveErrorMessage(error)

  const onSubmit = (v: FormValues) => {
    if (!programacion) return
    const payload: EjecutarProgramacionIn = {
      codigo_instalacion: v.codigo.trim() || null,
      observacion_instalacion: v.observacion.trim() || null,
      fecha_instalacion: v.fecha ? fromDateTimeInputValue(v.fecha) : null,
    }
    onConfirm(payload)
  }

  const contratoLabel = programacion
    ? programacionContratoLabel(programacion)
    : null
  const domicilioLabel = programacion
    ? programacionDomicilioLabel(programacion)
    : null

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onCancel}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Ejecutar programación{' '}
        {programacion ? `#${programacion.programacion_id}` : ''}
      </DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent dividers>
          <Stack spacing={2}>
            {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

            {programacion && (
              <Alert severity="info" variant="outlined">
                Se creará una instalación PENDIENTE para{' '}
                <strong>{contratoLabel}</strong> en{' '}
                <strong>{domicilioLabel}</strong>. La programación pasa a
                COMPLETADA. El contrato se activa al completar correctamente
                la instalación.
              </Alert>
            )}

            <Controller
              name="codigo"
              control={control}
              rules={{
                maxLength: { value: 20, message: 'Máx 20 caracteres.' },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Código de instalación"
                  size="small"
                  error={!!errors.codigo}
                  helperText={errors.codigo?.message}
                  fullWidth
                />
              )}
            />

            <Controller
              name="fecha"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Fecha de instalación"
                  type="datetime-local"
                  size="small"
                  slotProps={{ inputLabel: { shrink: true } }}
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

            <Typography variant="caption" color="text.secondary">
              Si no especificás fecha, el backend usa la fecha de la
              programación.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            Crear instalación
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
