import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
} from '@mui/material'
import { isApiError } from '@/types/api'
import { useTiposProducto } from '@/features/catalogos'

export interface ProductoFormValues {
  nombre_producto: string
  marca_producto: string
  modelo_producto: string
  descripcion_producto: string
  tipo_producto_id: string
  unidad_stock_producto: string
  activo_producto: boolean
}

const DEFAULT_VALUES: ProductoFormValues = {
  nombre_producto: '',
  marca_producto: '',
  modelo_producto: '',
  descripcion_producto: '',
  tipo_producto_id: '',
  unidad_stock_producto: '',
  activo_producto: true,
}

interface ProductoFormProps {
  initialValues?: Partial<ProductoFormValues>
  // El toggle de activo solo tiene sentido al editar (al crear nace activo).
  showActivo?: boolean
  onSubmit: (values: ProductoFormValues) => void | Promise<void>
  onCancel: () => void
  submitLabel?: string
  loading?: boolean
  error?: unknown
}

export default function ProductoForm({
  initialValues,
  showActivo = false,
  onSubmit,
  onCancel,
  submitLabel = 'Guardar',
  loading,
  error,
}: ProductoFormProps) {
  const { data: tipos, isLoading: loadingTipos } = useTiposProducto()

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ProductoFormValues>({
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
          label="Nombre"
          autoFocus
          required
          error={!!errors.nombre_producto}
          helperText={errors.nombre_producto?.message}
          {...register('nombre_producto', {
            required: 'Nombre requerido',
            maxLength: { value: 150, message: 'Máximo 150 caracteres' },
          })}
        />

        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
          }}
        >
          <TextField
            label="Marca"
            required
            error={!!errors.marca_producto}
            helperText={errors.marca_producto?.message}
            {...register('marca_producto', {
              required: 'Marca requerida',
              maxLength: { value: 50, message: 'Máximo 50 caracteres' },
            })}
          />
          <TextField
            label="Modelo"
            required
            error={!!errors.modelo_producto}
            helperText={errors.modelo_producto?.message}
            {...register('modelo_producto', {
              required: 'Modelo requerido',
              maxLength: { value: 50, message: 'Máximo 50 caracteres' },
            })}
          />
        </Box>

        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
          }}
        >
          <Controller
            control={control}
            name="tipo_producto_id"
            rules={{ required: 'Tipo requerido' }}
            render={({ field }) => (
              <TextField
                {...field}
                select
                label="Tipo de producto"
                required
                disabled={loadingTipos}
                error={!!errors.tipo_producto_id}
                helperText={errors.tipo_producto_id?.message}
              >
                {(tipos ?? []).map((t) => (
                  <MenuItem key={t.id} value={String(t.id)}>
                    {t.descripcion}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
          <TextField
            label="Unidad de stock"
            placeholder="unidad, metro, ..."
            required
            error={!!errors.unidad_stock_producto}
            helperText={
              errors.unidad_stock_producto?.message ??
              'Unidad base de consumo. Se usa al cargar materiales.'
            }
            {...register('unidad_stock_producto', {
              // Obligatoria: es la que después se autocompleta al cargar
              // materiales en una instalación. Sin ella hay que tipearla a mano
              // cada vez, que es justo lo que se quiere evitar.
              required: 'Indicá la unidad de stock.',
              maxLength: { value: 20, message: 'Máximo 20 caracteres' },
            })}
          />
        </Box>

        <TextField
          label="Descripción"
          multiline
          rows={2}
          error={!!errors.descripcion_producto}
          helperText={errors.descripcion_producto?.message}
          {...register('descripcion_producto', {
            maxLength: { value: 200, message: 'Máximo 200 caracteres' },
          })}
        />

        {showActivo && (
          <Controller
            control={control}
            name="activo_producto"
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
