import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import {
  Alert,
  Box,
  Button,
  Stack,
  TextField,
} from '@mui/material'
import { isApiError } from '@/types/api'

export interface ClienteFormValues {
  nombre: string
  apellido: string
  dni: string
  telefono: string
  email: string
  observaciones: string
}

const DEFAULT_VALUES: ClienteFormValues = {
  nombre: '',
  apellido: '',
  dni: '',
  telefono: '',
  email: '',
  observaciones: '',
}

interface ClienteFormProps {
  initialValues?: Partial<ClienteFormValues>
  onSubmit: (values: ClienteFormValues) => void | Promise<void>
  onCancel: () => void
  submitLabel?: string
  loading?: boolean
  error?: unknown
}

export default function ClienteForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = 'Guardar',
  loading,
  error,
}: ClienteFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClienteFormValues>({
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

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label="Nombre"
            autoFocus
            required
            error={!!errors.nombre}
            helperText={errors.nombre?.message}
            {...register('nombre', {
              required: 'Nombre requerido',
              maxLength: { value: 50, message: 'Máximo 50 caracteres' },
            })}
          />
          <TextField
            label="Apellido"
            required
            error={!!errors.apellido}
            helperText={errors.apellido?.message}
            {...register('apellido', {
              required: 'Apellido requerido',
              maxLength: { value: 50, message: 'Máximo 50 caracteres' },
            })}
          />
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label="DNI"
            required
            error={!!errors.dni}
            helperText={errors.dni?.message}
            {...register('dni', {
              required: 'DNI requerido',
              minLength: { value: 5, message: 'Mínimo 5 caracteres' },
              maxLength: { value: 20, message: 'Máximo 20 caracteres' },
            })}
          />
          <TextField
            label="Teléfono"
            required
            error={!!errors.telefono}
            helperText={errors.telefono?.message}
            {...register('telefono', {
              required: 'Teléfono requerido',
              minLength: { value: 5, message: 'Mínimo 5 caracteres' },
              maxLength: { value: 20, message: 'Máximo 20 caracteres' },
            })}
          />
        </Stack>

        <TextField
          label="Email"
          type="email"
          error={!!errors.email}
          helperText={errors.email?.message}
          {...register('email', {
            pattern: {
              value: /^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Email inválido',
            },
          })}
        />

        <TextField
          label="Observaciones"
          multiline
          rows={2}
          error={!!errors.observaciones}
          helperText={errors.observaciones?.message}
          {...register('observaciones', {
            maxLength: { value: 100, message: 'Máximo 100 caracteres' },
          })}
        />

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

function resolveErrorMessage(error: unknown): string | null {
  if (!error) return null
  if (isApiError(error)) return error.detail
  if (error instanceof Error) return error.message
  return 'Error inesperado.'
}
