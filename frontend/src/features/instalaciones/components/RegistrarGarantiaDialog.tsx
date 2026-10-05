import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { isApiError } from '@/types/api'
import { useSnackbar } from '@/components/ui/SnackbarProvider'
import { ProductoSelect } from '@/features/productos'
import { useMediosPagos } from '@/features/catalogos'
import { instalacionesService } from '../services/instalacionesService'
import ReciboGarantiaDialog from './ReciboGarantiaDialog'
import { useCreateGarantia } from '../hooks/useCreateGarantia'
import { defaultMedioPagoId, fromDateTimeInputValue } from '../utils'
import type { GarantiaCreate, ReciboGarantiaOut } from '../types'

interface FormValues {
  producto_id: string
  monto_garantia: string
  fecha_inicio_garantia: string
  registrar_cobro: boolean
  medio_pago_id: string
  comprobante: string
}

const emptyValues: FormValues = {
  producto_id: '',
  monto_garantia: '',
  fecha_inicio_garantia: '',
  registrar_cobro: true,
  medio_pago_id: '',
  comprobante: '',
}

interface Props {
  open: boolean
  instalacionId: number
  // Productos instalados elegibles (EQUIPO y sin garantía activa).
  allowedProductoIds: number[]
  onClose: () => void
}

// Alta de garantía. El producto se limita a equipos instalados sin garantía
// activa (regla del negocio, reforzada en backend). Fecha inicio opcional:
// vacía = el backend usa now(); editable para carga histórica.
export default function RegistrarGarantiaDialog({
  open,
  instalacionId,
  allowedProductoIds,
  onClose,
}: Props) {
  const { showSuccess } = useSnackbar()
  const createGarantia = useCreateGarantia()

  const { data: medios } = useMediosPagos()
  const [recibo, setRecibo] = useState<ReciboGarantiaOut | null>(null)

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: emptyValues,
  })
  const registrarCobro = watch('registrar_cobro')

  // TRANSFERENCIA por defecto apenas carga el catálogo (sin pisar una elección).
  useEffect(() => {
    if (!getValues('medio_pago_id')) setValue('medio_pago_id', defaultMedioPagoId(medios))
  }, [medios, open, getValues, setValue])

  const close = () => {
    if (createGarantia.isPending) return
    reset(emptyValues)
    createGarantia.reset()
    onClose()
  }

  const onSubmit = async (values: FormValues) => {
    const payload: GarantiaCreate = {
      instalacion_id: instalacionId,
      producto_id: Number(values.producto_id),
      monto_garantia: Number(values.monto_garantia),
      fecha_inicio_garantia: values.fecha_inicio_garantia
        ? fromDateTimeInputValue(values.fecha_inicio_garantia)
        : null,
    }
    if (values.registrar_cobro) {
      const comprobante = values.comprobante.trim()
      payload.cobro = {
        medio_pago_id: Number(values.medio_pago_id),
        ...(comprobante ? { comprobante_cobro_garantia: comprobante } : {}),
      }
    }
    const garantia = await createGarantia.mutateAsync(payload)
    reset(emptyValues)
    createGarantia.reset()
    showSuccess('Garantía registrada.')
    onClose()
    if (payload.cobro) {
      // El alta devuelve la garantía sin el recibo: se toma el emitido para el cobro inicial.
      try {
        const cobros = await instalacionesService.listCobrosGarantia(garantia.garantia_id)
        if (cobros.length > 0) {
          const ultimo = cobros.reduce((a, b) =>
            b.cobro_garantia_id > a.cobro_garantia_id ? b : a,
          )
          setRecibo(ultimo.recibo)
        }
      } catch {
        // El cobro ya quedó registrado; el recibo sigue disponible desde la lista de cobros.
      }
    }
  }

  const errorMsg = resolveErrorMessage(createGarantia.error)
  const sinElegibles = allowedProductoIds.length === 0

  return (
    <>
    <Dialog open={open} onClose={close} maxWidth="sm" fullWidth>
      <DialogTitle>Registrar garantía</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent dividers>
          <Stack spacing={2}>
            {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
            {sinElegibles && (
              <Alert severity="info">
                No hay equipos instalados sin garantía activa para esta instalación.
                Agregá el equipo en los detalles o anulá la garantía vigente.
              </Alert>
            )}

            <Controller
              name="producto_id"
              control={control}
              rules={{
                required: 'Elegí un equipo.',
                validate: (v) =>
                  Number.isFinite(Number(v)) && Number(v) > 0 ? true : 'Elegí un equipo.',
              }}
              render={({ field }) => (
                <ProductoSelect
                  label="Equipo a garantizar"
                  value={field.value ? Number(field.value) : null}
                  onChange={(id) => field.onChange(id != null ? String(id) : '')}
                  tipoCodigo="EQUIPO"
                  allowedIds={allowedProductoIds}
                  noOptionsText="Sin equipos elegibles."
                  disabled={sinElegibles}
                  error={!!errors.producto_id}
                  helperText={errors.producto_id?.message}
                  required
                />
              )}
            />

            <Controller
              name="monto_garantia"
              control={control}
              rules={{
                required: 'Indicá el monto del depósito.',
                validate: (v) => {
                  const n = Number(v)
                  if (Number.isNaN(n)) return 'Debe ser un número.'
                  if (n < 0) return 'No puede ser negativo.'
                  return true
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="number"
                  label="Monto del depósito"
                  required
                  slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
                  error={!!errors.monto_garantia}
                  helperText={errors.monto_garantia?.message}
                />
              )}
            />

            <Controller
              name="fecha_inicio_garantia"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="datetime-local"
                  label="Inicio de garantía"
                  slotProps={{ inputLabel: { shrink: true } }}
                  helperText="Opcional. Vacío = fecha y hora actual."
                />
              )}
            />

            <Controller
              name="registrar_cobro"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  }
                  label="Registrar cobro ahora"
                />
              )}
            />

            {registrarCobro && (
              <>
                <Controller
                  name="medio_pago_id"
                  control={control}
                  rules={{ required: 'Elegí el medio de pago.' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label="Medio de pago"
                      required
                      error={!!errors.medio_pago_id}
                      helperText={
                        errors.medio_pago_id?.message ??
                        'Se cobra el monto total con fecha de inicio de la garantía.'
                      }
                    >
                      {(medios ?? []).map((m) => (
                        <MenuItem key={m.id} value={String(m.id)}>
                          {m.descripcion}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
                <Controller
                  name="comprobante"
                  control={control}
                  rules={{ maxLength: { value: 200, message: 'Máximo 200 caracteres.' } }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Comprobante (opcional)"
                      error={!!errors.comprobante}
                      helperText={errors.comprobante?.message}
                    />
                  )}
                />
              </>
            )}

            <Typography variant="caption" color="text.secondary">
              La garantía nace ACTIVA. El contrato se toma de la instalación.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={close} disabled={createGarantia.isPending}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={createGarantia.isPending || sinElegibles}
          >
            Registrar
          </Button>
        </DialogActions>
      </form>
    </Dialog>
    <ReciboGarantiaDialog recibo={recibo} onClose={() => setRecibo(null)} />
    </>
  )
}

function resolveErrorMessage(error: unknown): string | null {
  if (!error) return null
  if (isApiError(error)) return error.detail
  if (error instanceof Error) return error.message
  return 'Error inesperado.'
}
