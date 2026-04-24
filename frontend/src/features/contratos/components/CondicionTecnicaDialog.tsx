import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
} from '@mui/material'
import { isApiError } from '@/types/api'
import type {
  ContractCommercialOut,
  ContractConfirmTechnicalCondition,
} from '../types'

interface FormValues {
  apto: boolean
  fecha_programacion_pinstalacion: string // datetime-local (sin zona)
  tecnico_pinstalacion: string
  notas_pinstalacion: string
}

const DEFAULT_VALUES: FormValues = {
  apto: true,
  fecha_programacion_pinstalacion: '',
  tecnico_pinstalacion: '',
  notas_pinstalacion: '',
}

interface Props {
  open: boolean
  contrato: ContractCommercialOut | null
  loading?: boolean
  error?: unknown
  onConfirm: (payload: ContractConfirmTechnicalCondition) => void
  onCancel: () => void
}

export default function CondicionTecnicaDialog({
  open,
  contrato,
  loading,
  error,
  onConfirm,
  onCancel,
}: Props) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: DEFAULT_VALUES })

  useEffect(() => {
    if (!open) reset(DEFAULT_VALUES)
  }, [open, reset])

  const apto = watch('apto')

  const submit = (values: FormValues) => {
    const payload: ContractConfirmTechnicalCondition = {
      apto: values.apto,
      fecha_programacion_pinstalacion: values.fecha_programacion_pinstalacion
        ? new Date(values.fecha_programacion_pinstalacion).toISOString()
        : null,
      tecnico_pinstalacion: values.tecnico_pinstalacion.trim() || null,
      notas_pinstalacion: values.notas_pinstalacion.trim() || null,
    }
    onConfirm(payload)
  }

  const errorMsg = resolveErrorMessage(error)

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onCancel}
      maxWidth="sm"
      fullWidth
    >
      <form onSubmit={handleSubmit(submit)} noValidate>
        <DialogTitle>Confirmar condición técnica</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            {contrato && (
              <DialogContentText>
                Contrato #{contrato.contrato_id} — {contrato.cliente_apellido},{' '}
                {contrato.cliente_nombre}
              </DialogContentText>
            )}

            <Controller
              control={control}
              name="apto"
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={field.value}
                      onChange={(_, v) => field.onChange(v)}
                    />
                  }
                  label={
                    field.value
                      ? 'Apto técnicamente'
                      : 'No apto técnicamente'
                  }
                />
              )}
            />

            <TextField
              label="Fecha de instalación programada"
              type="datetime-local"
              slotProps={{ inputLabel: { shrink: true } }}
              error={!!errors.fecha_programacion_pinstalacion}
              helperText={errors.fecha_programacion_pinstalacion?.message}
              {...register('fecha_programacion_pinstalacion', {
                validate: (v) => {
                  // Si apto=true, la fecha debería venir — pero el backend lo
                  // valida finalmente. Acá sólo validamos formato.
                  if (!v) return true
                  const d = new Date(v)
                  if (Number.isNaN(d.getTime())) return 'Fecha inválida'
                  return true
                },
              })}
            />

            <TextField
              label="Técnico asignado"
              error={!!errors.tecnico_pinstalacion}
              helperText={errors.tecnico_pinstalacion?.message}
              {...register('tecnico_pinstalacion', {
                maxLength: { value: 50, message: 'Máximo 50 caracteres' },
              })}
            />

            <TextField
              label={apto ? 'Notas' : 'Motivo / notas'}
              multiline
              rows={3}
              error={!!errors.notas_pinstalacion}
              helperText={errors.notas_pinstalacion?.message}
              {...register('notas_pinstalacion', {
                maxLength: { value: 500, message: 'Máximo 500 caracteres' },
              })}
            />

            {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            Confirmar
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
