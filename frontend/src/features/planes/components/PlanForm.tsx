import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { isApiError } from '@/types/api'
import { ESTADO_PLAN_ACTIVO, ESTADO_PLAN_INACTIVO } from '../utils'

export interface PlanFormValues {
  nombre_plan: string
  velocidad_mbps_plan: string
  descripcion_plan: string
  activo: boolean
}

const DEFAULT_VALUES: PlanFormValues = {
  nombre_plan: '',
  velocidad_mbps_plan: '',
  descripcion_plan: '',
  activo: true,
}

interface PlanFormProps {
  initialValues?: Partial<PlanFormValues>
  onSubmit: (values: PlanFormValues) => void | Promise<void>
  onCancel: () => void
  submitLabel?: string
  loading?: boolean
  error?: unknown
}

export default function PlanForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = 'Guardar',
  loading,
  error,
}: PlanFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<PlanFormValues>({
    defaultValues: { ...DEFAULT_VALUES, ...initialValues },
  })

  useEffect(() => {
    reset({ ...DEFAULT_VALUES, ...initialValues })
  }, [initialValues, reset])

  const errorMsg = resolveErrorMessage(error)

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={2}>
        {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

        <TextField
          label="Nombre del plan"
          autoFocus
          required
          error={!!errors.nombre_plan}
          helperText={errors.nombre_plan?.message}
          {...register('nombre_plan', {
            required: 'Nombre requerido',
            minLength: { value: 3, message: 'Mínimo 3 caracteres' },
            maxLength: { value: 50, message: 'Máximo 50 caracteres' },
          })}
        />

        <TextField
          label="Velocidad (Mbps)"
          type="number"
          required
          slotProps={{ htmlInput: { min: 1 } }}
          error={!!errors.velocidad_mbps_plan}
          helperText={errors.velocidad_mbps_plan?.message}
          {...register('velocidad_mbps_plan', {
            required: 'Velocidad requerida',
            validate: (v) => {
              const n = Number(v)
              if (!Number.isInteger(n) || n <= 0) return 'Debe ser un entero mayor a 0'
              return true
            },
          })}
        />

        <TextField
          label="Descripción"
          multiline
          rows={2}
          error={!!errors.descripcion_plan}
          helperText={errors.descripcion_plan?.message}
          {...register('descripcion_plan', {
            maxLength: { value: 100, message: 'Máximo 100 caracteres' },
          })}
        />

        <Box>
          <Controller
            control={control}
            name="activo"
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Switch
                    checked={field.value}
                    onChange={(_, checked) => field.onChange(checked)}
                  />
                }
                label={field.value ? 'Activo' : 'Inactivo'}
              />
            )}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            Inactivo impide asignar el plan a nuevos contratos.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
          <Button onClick={onCancel} disabled={loading || isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || isSubmitting}
          >
            {submitLabel}
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}

export function estadoPlanIdFromActivo(activo: boolean): number {
  return activo ? ESTADO_PLAN_ACTIVO : ESTADO_PLAN_INACTIVO
}

function resolveErrorMessage(error: unknown): string | null {
  if (!error) return null
  if (isApiError(error)) return error.detail
  if (error instanceof Error) return error.message
  return 'Error inesperado.'
}
