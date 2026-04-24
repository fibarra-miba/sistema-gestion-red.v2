import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import {
  Alert,
  Box,
  Button,
  InputAdornment,
  Stack,
  TextField,
} from '@mui/material'
import { isApiError } from '@/types/api'
import { fromDateInputValue, toDateInputValue } from '@/lib/format'
import type { PrecioPlanCreate, PrecioPlanOut, PrecioPlanUpdate } from '../types'

export interface PriceFormValues {
  precio_mensual_pplanes: string
  fecha_desde_pplanes: string // YYYY-MM-DD
  fecha_hasta_pplanes: string // YYYY-MM-DD o ''
}

type Mode = 'create' | 'edit'

interface PriceFormProps {
  mode?: Mode
  initialPrice?: PrecioPlanOut
  onSubmitCreate?: (payload: PrecioPlanCreate) => void | Promise<void>
  onSubmitUpdate?: (payload: PrecioPlanUpdate) => void | Promise<void>
  onCancel: () => void
  loading?: boolean
  error?: unknown
}

const todayIso = () => toDateInputValue(new Date().toISOString())

export default function PriceForm({
  mode = 'create',
  initialPrice,
  onSubmitCreate,
  onSubmitUpdate,
  onCancel,
  loading,
  error,
}: PriceFormProps) {
  const defaultValues: PriceFormValues =
    mode === 'edit' && initialPrice
      ? {
          precio_mensual_pplanes: String(initialPrice.precio_mensual_pplanes),
          fecha_desde_pplanes: toDateInputValue(initialPrice.fecha_desde_pplanes),
          fecha_hasta_pplanes: toDateInputValue(initialPrice.fecha_hasta_pplanes),
        }
      : {
          precio_mensual_pplanes: '',
          fecha_desde_pplanes: todayIso(),
          fecha_hasta_pplanes: '',
        }

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PriceFormValues>({ defaultValues })

  useEffect(() => {
    reset(defaultValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrice?.precios_planes_id, mode])

  const errorMsg = resolveErrorMessage(error)
  const fechaDesde = watch('fecha_desde_pplanes')

  const submit = handleSubmit(async (values) => {
    if (mode === 'edit') {
      if (!onSubmitUpdate) return
      const payload: PrecioPlanUpdate = {
        precio_mensual_pplanes: Number(values.precio_mensual_pplanes),
        fecha_desde_pplanes: fromDateInputValue(values.fecha_desde_pplanes),
        fecha_hasta_pplanes: values.fecha_hasta_pplanes
          ? fromDateInputValue(values.fecha_hasta_pplanes)
          : null,
      }
      await onSubmitUpdate(payload)
      return
    }
    if (!onSubmitCreate) return
    const payload: PrecioPlanCreate = {
      precio_mensual_pplanes: Number(values.precio_mensual_pplanes),
      fecha_desde_pplanes: fromDateInputValue(values.fecha_desde_pplanes),
      fecha_hasta_pplanes: values.fecha_hasta_pplanes
        ? fromDateInputValue(values.fecha_hasta_pplanes)
        : null,
    }
    await onSubmitCreate(payload)
  })

  return (
    <Box component="form" onSubmit={submit} noValidate>
      <Stack spacing={2}>
        <Alert severity="info">
          {mode === 'edit'
            ? 'Solo se pueden editar precios cuya fecha desde aún no llegó. Vigentes e históricos son inmutables.'
            : 'El precio vigente anterior puede quedar cerrado automáticamente según las fechas. El backend valida que no haya solapamientos.'}
        </Alert>

        {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

        <TextField
          label="Precio mensual"
          type="number"
          required
          autoFocus
          slotProps={{
            htmlInput: { min: 0, step: '0.01' },
            input: {
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            },
          }}
          error={!!errors.precio_mensual_pplanes}
          helperText={errors.precio_mensual_pplanes?.message}
          {...register('precio_mensual_pplanes', {
            required: 'Precio requerido',
            validate: (v) => {
              const n = Number(v)
              if (!Number.isFinite(n) || n <= 0) return 'Debe ser mayor a 0'
              return true
            },
          })}
        />

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label="Vigente desde"
            type="date"
            required
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
            error={!!errors.fecha_desde_pplanes}
            helperText={errors.fecha_desde_pplanes?.message}
            {...register('fecha_desde_pplanes', {
              required: 'Fecha desde requerida',
            })}
          />
          <TextField
            label="Vigente hasta (opcional)"
            type="date"
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
            error={!!errors.fecha_hasta_pplanes}
            helperText={
              errors.fecha_hasta_pplanes?.message ??
              'Vacío = sin fecha de cierre.'
            }
            {...register('fecha_hasta_pplanes', {
              validate: (v) => {
                if (!v) return true
                if (fechaDesde && v < fechaDesde) {
                  return 'Debe ser posterior o igual a "desde".'
                }
                return true
              },
            })}
          />
        </Stack>

        <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
          <Button onClick={onCancel} disabled={loading || isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || isSubmitting}
          >
            {mode === 'edit' ? 'Guardar cambios' : 'Registrar precio'}
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
