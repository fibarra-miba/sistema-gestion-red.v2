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
import type {
  ProgramacionInstalacionOut,
  ReprogramarInstalacionIn,
} from '../types'
import { fromDateTimeInputValue, toDateTimeInputValue } from '../utils'

interface FormValues {
  fecha: string
  tecnico: string
  motivo: string
  notas: string
}

interface Props {
  open: boolean
  programacion: ProgramacionInstalacionOut | null
  loading?: boolean
  error?: unknown
  onConfirm: (payload: ReprogramarInstalacionIn) => void | Promise<void>
  onCancel: () => void
}

export default function ReprogramarDialog({
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
    defaultValues: { fecha: '', tecnico: '', motivo: '', notas: '' },
  })

  useEffect(() => {
    if (open && programacion) {
      reset({
        fecha: toDateTimeInputValue(
          programacion.fecha_programacion_pinstalacion,
        ),
        tecnico: programacion.tecnico_pinstalacion ?? '',
        motivo: '',
        notas: '',
      })
    }
  }, [open, programacion, reset])

  const errorMsg = resolveErrorMessage(error)

  const onSubmit = (v: FormValues) => {
    const payload: ReprogramarInstalacionIn = {
      fecha_programacion_pinstalacion: fromDateTimeInputValue(v.fecha),
      tecnico_pinstalacion: v.tecnico.trim() || null,
      motivo_reprogramacion: v.motivo.trim() || null,
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
        Reprogramar programación{' '}
        {programacion ? `#${programacion.programacion_id}` : ''}
      </DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent dividers>
          <Stack spacing={2}>
            {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

            <Alert severity="info" variant="outlined">
              La reprogramación actúa sobre la <strong>programación</strong>
              {' '}— la instalación todavía no existe. Se registra la nueva
              fecha y queda historial de reprogramaciones.
            </Alert>

            <Controller
              name="fecha"
              control={control}
              rules={{ required: 'Seleccioná una nueva fecha.' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Nueva fecha y hora"
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
              rules={{ maxLength: { value: 50, message: 'Máx 50 caracteres.' } }}
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
              name="motivo"
              control={control}
              rules={{
                maxLength: { value: 500, message: 'Máx 500 caracteres.' },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Motivo de la reprogramación"
                  size="small"
                  multiline
                  minRows={2}
                  error={!!errors.motivo}
                  helperText={errors.motivo?.message}
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
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            Reprogramar
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
