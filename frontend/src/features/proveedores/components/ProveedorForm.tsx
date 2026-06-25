import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Alert, Box, Button, MenuItem, Stack, TextField } from '@mui/material'
import { isApiError } from '@/types/api'
import { useEstadosProveedor } from '@/features/catalogos'

export interface ProveedorFormValues {
  nombre_prov: string
  estado_proveedor_id: string
  telefono_prov: string
  email_prov: string
  direccion_prov: string
  web_prov: string
  descripcion_prov: string
  observacion_prov: string
}

const DEFAULT_VALUES: ProveedorFormValues = {
  nombre_prov: '',
  estado_proveedor_id: '',
  telefono_prov: '',
  email_prov: '',
  direccion_prov: '',
  web_prov: '',
  descripcion_prov: '',
  observacion_prov: '',
}

interface Props {
  initialValues?: Partial<ProveedorFormValues>
  onSubmit: (values: ProveedorFormValues) => void | Promise<void>
  onCancel: () => void
  submitLabel?: string
  loading?: boolean
  error?: unknown
}

export default function ProveedorForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = 'Guardar',
  loading,
  error,
}: Props) {
  const { data: estados, isLoading: loadingEstados } = useEstadosProveedor()

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ProveedorFormValues>({
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
          label="Nombre / Razón social"
          autoFocus
          required
          error={!!errors.nombre_prov}
          helperText={errors.nombre_prov?.message}
          {...register('nombre_prov', {
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
          <Controller
            control={control}
            name="estado_proveedor_id"
            rules={{ required: 'Estado requerido' }}
            render={({ field }) => (
              <TextField
                {...field}
                select
                label="Estado"
                required
                disabled={loadingEstados}
                error={!!errors.estado_proveedor_id}
                helperText={errors.estado_proveedor_id?.message}
              >
                {(estados ?? []).map((e) => (
                  <MenuItem key={e.id} value={String(e.id)}>
                    {e.descripcion}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
          <TextField label="Teléfono" {...register('telefono_prov')} />
          <TextField
            label="Email"
            type="email"
            error={!!errors.email_prov}
            helperText={errors.email_prov?.message}
            {...register('email_prov')}
          />
          <TextField label="Web" {...register('web_prov')} />
        </Box>

        <TextField label="Dirección" {...register('direccion_prov')} />

        <TextField
          label="Descripción"
          multiline
          rows={2}
          {...register('descripcion_prov')}
        />
        <TextField
          label="Observaciones"
          multiline
          rows={2}
          {...register('observacion_prov')}
        />

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
