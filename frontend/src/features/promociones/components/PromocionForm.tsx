import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  InputAdornment,
  MenuItem,
  Stack,
  Switch,
  TextField,
} from '@mui/material'
import { isApiError } from '@/types/api'
import { useTiposPromo } from '@/features/catalogos'
import { TIPO_PROMO_PORCENTAJE, TIPO_PROMO_DESCUENTO_FIJO } from '../types'

export interface PromocionFormValues {
  nombre_promo: string
  descripcion_promo: string
  tipo_promo_id: string
  porcentaje_descuento: string
  monto_descuento: string
  fecha_vigencia_desde_promo: string
  fecha_vigencia_hasta_promo: string
  activo_promo: boolean
}

const DEFAULT_VALUES: PromocionFormValues = {
  nombre_promo: '',
  descripcion_promo: '',
  tipo_promo_id: '',
  porcentaje_descuento: '',
  monto_descuento: '',
  fecha_vigencia_desde_promo: '',
  fecha_vigencia_hasta_promo: '',
  activo_promo: true,
}

interface PromocionFormProps {
  initialValues?: Partial<PromocionFormValues>
  // El toggle de activo solo tiene sentido al editar (al crear nace activa).
  showActivo?: boolean
  onSubmit: (values: PromocionFormValues) => void | Promise<void>
  onCancel: () => void
  submitLabel?: string
  loading?: boolean
  error?: unknown
}

export default function PromocionForm({
  initialValues,
  showActivo = false,
  onSubmit,
  onCancel,
  submitLabel = 'Guardar',
  loading,
  error,
}: PromocionFormProps) {
  const { data: tipos, isLoading: loadingTipos } = useTiposPromo()

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PromocionFormValues>({
    defaultValues: { ...DEFAULT_VALUES, ...initialValues },
  })

  useEffect(() => {
    reset({ ...DEFAULT_VALUES, ...initialValues })
  }, [initialValues, reset])

  const tipo = watch('tipo_promo_id')
  const esPorcentaje = Number(tipo) === TIPO_PROMO_PORCENTAJE
  const esFijo = Number(tipo) === TIPO_PROMO_DESCUENTO_FIJO

  const errorMsg = resolveErrorMessage(error)

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={2}>
        {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

        <TextField
          label="Nombre"
          autoFocus
          required
          error={!!errors.nombre_promo}
          helperText={errors.nombre_promo?.message}
          {...register('nombre_promo', {
            required: 'Nombre requerido',
            maxLength: { value: 100, message: 'Máximo 100 caracteres' },
          })}
        />

        <Controller
          control={control}
          name="tipo_promo_id"
          rules={{ required: 'Tipo requerido' }}
          render={({ field }) => (
            <TextField
              {...field}
              select
              label="Tipo de promoción"
              required
              disabled={loadingTipos}
              error={!!errors.tipo_promo_id}
              helperText={errors.tipo_promo_id?.message}
            >
              {(tipos ?? []).map((t) => (
                <MenuItem key={t.id} value={String(t.id)}>
                  {t.descripcion}
                </MenuItem>
              ))}
            </TextField>
          )}
        />

        {esPorcentaje && (
          <TextField
            label="Porcentaje de descuento"
            type="number"
            required
            slotProps={{
              input: {
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              },
            }}
            error={!!errors.porcentaje_descuento}
            helperText={errors.porcentaje_descuento?.message}
            {...register('porcentaje_descuento', {
              required: 'Porcentaje requerido',
              min: { value: 0.01, message: 'Debe ser mayor a 0' },
              max: { value: 100, message: 'No puede superar 100' },
            })}
          />
        )}

        {esFijo && (
          <TextField
            label="Monto de descuento"
            type="number"
            required
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              },
            }}
            error={!!errors.monto_descuento}
            helperText={errors.monto_descuento?.message}
            {...register('monto_descuento', {
              required: 'Monto requerido',
              min: { value: 0.01, message: 'Debe ser mayor a 0' },
            })}
          />
        )}

        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
          }}
        >
          <TextField
            label="Vigente desde"
            type="date"
            required
            slotProps={{ inputLabel: { shrink: true } }}
            error={!!errors.fecha_vigencia_desde_promo}
            helperText={errors.fecha_vigencia_desde_promo?.message}
            {...register('fecha_vigencia_desde_promo', {
              required: 'Fecha de inicio requerida',
            })}
          />
          <TextField
            label="Vigente hasta (opcional)"
            type="date"
            slotProps={{ inputLabel: { shrink: true } }}
            error={!!errors.fecha_vigencia_hasta_promo}
            helperText={errors.fecha_vigencia_hasta_promo?.message}
            {...register('fecha_vigencia_hasta_promo')}
          />
        </Box>

        <TextField
          label="Descripción"
          multiline
          rows={2}
          error={!!errors.descripcion_promo}
          helperText={errors.descripcion_promo?.message}
          {...register('descripcion_promo', {
            maxLength: { value: 150, message: 'Máximo 150 caracteres' },
          })}
        />

        {showActivo && (
          <Controller
            control={control}
            name="activo_promo"
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Switch
                    checked={field.value}
                    onChange={(_, checked) => field.onChange(checked)}
                  />
                }
                label={field.value ? 'Activa' : 'Inactiva'}
              />
            )}
          />
        )}

        <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
          <Button onClick={onCancel} disabled={loading || isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={loading || isSubmitting}>
            {submitLabel}
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}

function resolveErrorMessage(error: unknown): string | null {
  if (!error) return null
  if (isApiError(error)) return error.detail
  if (error instanceof Error) return error.message
  return 'Error inesperado.'
}
