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
import type { InstalacionOut, ReintentarInstalacionIn } from '../types'
import { fromDateTimeInputValue } from '../utils'

interface FormValues {
  fecha: string
  tecnico: string
  notas: string
}

interface Props {
  open: boolean
  instalacion: InstalacionOut | null
  loading?: boolean
  error?: unknown
  onConfirm: (payload: ReintentarInstalacionIn) => void | Promise<void>
  onCancel: () => void
}

// Reintentar: crea una NUEVA programación para un contrato cuya
// instalación original quedó CANCELADA o FALLIDA.
export default function ReintentarDialog({
  open,
  instalacion,
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
    defaultValues: { fecha: '', tecnico: '', notas: '' },
  })

  useEffect(() => {
    if (open) {
      reset({ fecha: '', tecnico: '', notas: '' })
    }
  }, [open, reset])

  const errorMsg = resolveErrorMessage(error)

  const onSubmit = (v: FormValues) => {
    const payload: ReintentarInstalacionIn = {
      fecha_programacion_pinstalacion: fromDateTimeInputValue(v.fecha),
      tecnico_pinstalacion: v.tecnico.trim() || null,
      notas_pinstalacion: v.notas.trim() || null,
    }
    onConfirm(payload)
  }

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onCancel}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Reintentar instalación{' '}
        {instalacion ? `#${instalacion.instalacion_id}` : ''}
      </DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent dividers>
          <Stack spacing={2}>
            {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

            <Alert severity="info" variant="outlined">
              Se creará una NUEVA programación para el contrato #
              {instalacion?.contrato_id}. La instalación actual queda en su
              estado terminal.
            </Alert>

            <Controller
              name="fecha"
              control={control}
              rules={{ required: 'Seleccioná una fecha.' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Fecha y hora programada"
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
              name="tecnico"
              control={control}
              rules={{
                maxLength: { value: 50, message: 'Máx 50 caracteres.' },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Técnico"
                  size="small"
                  error={!!errors.tecnico}
                  helperText={errors.tecnico?.message}
                  fullWidth
                />
              )}
            />

            <Controller
              name="notas"
              control={control}
              rules={{
                maxLength: { value: 500, message: 'Máx 500 caracteres.' },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Notas"
                  size="small"
                  multiline
                  minRows={2}
                  error={!!errors.notas}
                  helperText={errors.notas?.message}
                  fullWidth
                />
              )}
            />

            <Typography variant="caption" color="text.secondary">
              La nueva programación nace en estado PROGRAMADA y aparecerá
              en la lista de programaciones.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            Crear nueva programación
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
