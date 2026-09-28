import { useForm } from 'react-hook-form'
import {
  Alert,
  Box,
  Button,
  Stack,
  TextField,
} from '@mui/material'
import { isApiError } from '@/types/api'

export interface DomicilioFormValues {
  calle: string
  numero: string
  complejo: string
  torre: string
  piso: string
  depto: string
  referencias: string
}

const DEFAULT_VALUES: DomicilioFormValues = {
  calle: '',
  numero: '',
  complejo: '',
  torre: '',
  piso: '',
  depto: '',
  referencias: '',
}

interface DomicilioFormProps {
  onSubmit: (values: DomicilioFormValues) => void | Promise<void>
  onCancel: () => void
  reemplazaVigente: boolean
  loading?: boolean
  error?: unknown
}

export default function DomicilioForm({
  onSubmit,
  onCancel,
  reemplazaVigente,
  loading,
  error,
}: DomicilioFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DomicilioFormValues>({ defaultValues: DEFAULT_VALUES })

  const errorMsg = resolveErrorMessage(error)
  const calle = watch('calle')
  const complejo = watch('complejo')
  const necesitaUbicacion = !calle.trim() && !complejo.trim()

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={2}>
        {reemplazaVigente && (
          <Alert severity="warning">
            Al guardar, el domicilio vigente actual se cerrará automáticamente y
            pasará al historial.
          </Alert>
        )}

        {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label="Calle"
            error={!!errors.calle}
            helperText={errors.calle?.message}
            sx={{ flex: 2 }}
            {...register('calle')}
          />
          <TextField
            label="Número"
            type="number"
            slotProps={{ htmlInput: { min: 0 } }}
            error={!!errors.numero}
            helperText={errors.numero?.message}
            sx={{ flex: 1 }}
            {...register('numero')}
          />
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label="Complejo / Barrio"
            error={!!errors.complejo}
            helperText={errors.complejo?.message}
            sx={{ flex: 1 }}
            {...register('complejo')}
          />
          <TextField
            label="Torre / Edificio"
            error={!!errors.torre}
            helperText={errors.torre?.message}
            sx={{ width: { sm: 140 } }}
            {...register('torre')}
          />
          <TextField
            label="Piso"
            type="number"
            slotProps={{ htmlInput: { min: 0 } }}
            error={!!errors.piso}
            helperText={errors.piso?.message}
            sx={{ width: { sm: 120 } }}
            {...register('piso')}
          />
          <TextField
            label="Dto."
            error={!!errors.depto}
            helperText={errors.depto?.message}
            sx={{ width: { sm: 120 } }}
            {...register('depto')}
          />
        </Stack>

        <TextField
          label="Referencias"
          multiline
          rows={2}
          error={!!errors.referencias}
          helperText={errors.referencias?.message}
          {...register('referencias')}
        />

        {necesitaUbicacion && (
          <Alert severity="info">
            Completá al menos calle o complejo para poder ubicar el domicilio.
          </Alert>
        )}

        <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
          <Button onClick={onCancel} disabled={loading || isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || isSubmitting || necesitaUbicacion}
          >
            Guardar domicilio
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
