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

type DomicilioFormMode = 'create' | 'edit'

interface DomicilioFormProps {
  onSubmit: (values: DomicilioFormValues) => void | Promise<void>
  onCancel: () => void
  reemplazaVigente?: boolean
  // Prellena el form (modo edición: corrección de datos de un domicilio
  // existente, no una mudanza).
  initialValues?: Partial<DomicilioFormValues>
  mode?: DomicilioFormMode
  submitLabel?: string
  loading?: boolean
  error?: unknown
}

export default function DomicilioForm({
  onSubmit,
  onCancel,
  reemplazaVigente = false,
  initialValues,
  mode = 'create',
  submitLabel,
  loading,
  error,
}: DomicilioFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DomicilioFormValues>({
    defaultValues: { ...DEFAULT_VALUES, ...initialValues },
  })

  useEffect(() => {
    reset({ ...DEFAULT_VALUES, ...initialValues })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues])

  const errorMsg = resolveErrorMessage(error)
  const calle = watch('calle')
  const complejo = watch('complejo')
  const necesitaUbicacion = !calle.trim() && !complejo.trim()
  const resolvedSubmitLabel =
    submitLabel ?? (mode === 'edit' ? 'Guardar cambios' : 'Guardar domicilio')

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={2}>
        {mode === 'edit' ? (
          <Alert severity="info">
            Esto corrige los datos ya cargados del domicilio — no es una
            mudanza. Para registrar un cambio de domicilio usá "Nuevo
            domicilio" / "Cambiar domicilio".
          </Alert>
        ) : (
          reemplazaVigente && (
            <Alert severity="warning">
              Al guardar, el domicilio vigente actual se cerrará automáticamente y
              pasará al historial.
            </Alert>
          )
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
            {resolvedSubmitLabel}
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
