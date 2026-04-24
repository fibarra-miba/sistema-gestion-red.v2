import { Alert, Box, Button, Stack, TextField } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { Controller, useForm } from 'react-hook-form'
import { isApiError } from '@/types/api'
import { useSnackbar } from '@/components/ui/SnackbarProvider'
import { useCreateDetalleInstalacion } from '../hooks/useCreateDetalleInstalacion'
import type { DetalleInstalacionCreate } from '../types'

interface FormValues {
  producto_id: string
  cantidad_dinstalacion: string
  unidad_dinstalacion: string
  descripcion_dinstalacion: string
  observacion_dinstalacion: string
}

const DEFAULTS: FormValues = {
  producto_id: '',
  cantidad_dinstalacion: '',
  unidad_dinstalacion: '',
  descripcion_dinstalacion: '',
  observacion_dinstalacion: '',
}

interface Props {
  instalacionId: number
}

// Formulario inline para agregar un material a la instalación.
// Mantiene layout compacto para convivir con el listado en el mismo
// dialog. Validaciones mínimas alineadas al schema pydantic.
export default function AddDetalleForm({ instalacionId }: Props) {
  const { showSuccess } = useSnackbar()
  const createDetalle = useCreateDetalleInstalacion()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: DEFAULTS })

  const onSubmit = async (values: FormValues) => {
    const payload: DetalleInstalacionCreate = {
      producto_id: Number(values.producto_id),
      cantidad_dinstalacion: Number(values.cantidad_dinstalacion),
      unidad_dinstalacion: values.unidad_dinstalacion.trim(),
      descripcion_dinstalacion:
        values.descripcion_dinstalacion.trim() || null,
      observacion_dinstalacion:
        values.observacion_dinstalacion.trim() || null,
    }
    await createDetalle.mutateAsync({ instalacionId, payload })
    reset(DEFAULTS)
    createDetalle.reset()
    showSuccess('Material agregado.')
  }

  const errorMsg = resolveErrorMessage(createDetalle.error)

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={1.5}>
        {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              md: 'repeat(4, minmax(0, 1fr))',
            },
          }}
        >
          <Controller
            name="producto_id"
            control={control}
            rules={{
              required: 'Requerido.',
              validate: (v) =>
                Number.isFinite(Number(v)) && Number(v) > 0
                  ? true
                  : 'ID inválido.',
            }}
            render={({ field }) => (
              <TextField
                {...field}
                size="small"
                label="Producto ID"
                type="number"
                slotProps={{ htmlInput: { min: 1 } }}
                error={!!errors.producto_id}
                helperText={errors.producto_id?.message}
                required
              />
            )}
          />
          <Controller
            name="cantidad_dinstalacion"
            control={control}
            rules={{
              required: 'Requerido.',
              validate: (v) =>
                Number.isFinite(Number(v)) && Number(v) > 0
                  ? true
                  : 'Cantidad > 0.',
            }}
            render={({ field }) => (
              <TextField
                {...field}
                size="small"
                label="Cantidad"
                type="number"
                slotProps={{ htmlInput: { min: 0.01, step: 0.01 } }}
                error={!!errors.cantidad_dinstalacion}
                helperText={errors.cantidad_dinstalacion?.message}
                required
              />
            )}
          />
          <Controller
            name="unidad_dinstalacion"
            control={control}
            rules={{
              required: 'Requerido.',
              maxLength: { value: 10, message: 'Máx 10 caracteres.' },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                size="small"
                label="Unidad"
                placeholder="ej. m, und"
                error={!!errors.unidad_dinstalacion}
                helperText={errors.unidad_dinstalacion?.message}
                required
              />
            )}
          />
          <Controller
            name="descripcion_dinstalacion"
            control={control}
            rules={{
              maxLength: { value: 150, message: 'Máx 150 caracteres.' },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                size="small"
                label="Descripción"
                error={!!errors.descripcion_dinstalacion}
                helperText={errors.descripcion_dinstalacion?.message}
              />
            )}
          />
          <Controller
            name="observacion_dinstalacion"
            control={control}
            rules={{
              maxLength: { value: 200, message: 'Máx 200 caracteres.' },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                size="small"
                label="Observación"
                sx={{ gridColumn: { sm: '1 / -1' } }}
                error={!!errors.observacion_dinstalacion}
                helperText={errors.observacion_dinstalacion?.message}
              />
            )}
          />
        </Box>

        <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            disabled={createDetalle.isPending}
          >
            Agregar material
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
