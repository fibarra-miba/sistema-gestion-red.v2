import { useEffect } from 'react'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Controller, useForm } from 'react-hook-form'
import { isApiError } from '@/types/api'
import { useSnackbar } from '@/components/ui/SnackbarProvider'
import { formatCurrencyARS, fromDateInputValueLocalNoon, todayDateInputValue } from '@/lib/format'
import { useMediosPagos } from '@/features/catalogos'
import { useRegistrarCobroGarantia } from '../hooks/useRegistrarCobroGarantia'
import { defaultMedioPagoId } from '../utils'
import type { CobroGarantiaCreate, GarantiaOut, ReciboGarantiaOut } from '../types'

interface FormValues {
  fecha: string
  monto: string
  medio_pago_id: string
  comprobante: string
}

interface Props {
  garantia: GarantiaOut | null
  // Se invoca con el recibo recién emitido para mostrarlo/imprimirlo.
  onEmitido: (recibo: ReciboGarantiaOut) => void
  onClose: () => void
}

// Registra un cobro del depósito (no es factura). Monto por defecto = saldo
// pendiente; el backend revalida tope, fecha futura y estado.
export default function RegistrarCobroGarantiaDialog({ garantia, onEmitido, onClose }: Props) {
  const { showSuccess } = useSnackbar()
  const registrar = useRegistrarCobroGarantia()
  const { data: medios } = useMediosPagos()
  const saldo = garantia?.saldo_pendiente_cobro ?? 0

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: { fecha: '', monto: '', medio_pago_id: '', comprobante: '' },
  })

  useEffect(() => {
    if (garantia) {
      reset({
        fecha: todayDateInputValue(),
        monto: String(garantia.saldo_pendiente_cobro ?? ''),
        medio_pago_id: defaultMedioPagoId(medios),
        comprobante: '',
      })
    }
  }, [garantia, medios, reset])

  const close = () => {
    if (registrar.isPending) return
    registrar.reset()
    onClose()
  }

  const onSubmit = async (v: FormValues) => {
    if (!garantia) return
    const comprobante = v.comprobante.trim()
    const payload: CobroGarantiaCreate = {
      fecha_cobro_garantia: fromDateInputValueLocalNoon(v.fecha),
      monto_cobro_garantia: Number(v.monto),
      medio_pago_id: Number(v.medio_pago_id),
      comprobante_cobro_garantia: comprobante || null,
    }
    const cobro = await registrar.mutateAsync({
      garantiaId: garantia.garantia_id,
      instalacionId: garantia.instalacion_id,
      payload,
    })
    registrar.reset()
    showSuccess('Cobro registrado. Recibo emitido.')
    onEmitido(cobro.recibo)
    onClose()
  }

  const errorMsg = registrar.error
    ? isApiError(registrar.error)
      ? registrar.error.detail
      : 'Error inesperado.'
    : null

  return (
    <Dialog open={garantia != null} onClose={close} maxWidth="xs" fullWidth>
      <DialogTitle>Registrar cobro de garantía</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent dividers>
          <Stack spacing={2}>
            {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
            <Typography variant="body2" color="text.secondary">
              Saldo pendiente: <strong>{formatCurrencyARS(saldo)}</strong>
            </Typography>

            <Controller
              name="fecha"
              control={control}
              rules={{
                required: 'Indicá la fecha.',
                validate: (v) =>
                  v <= todayDateInputValue() ? true : 'No puede ser una fecha futura.',
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="date"
                  label="Fecha de cobro"
                  required
                  slotProps={{
                    inputLabel: { shrink: true },
                    htmlInput: { max: todayDateInputValue() },
                  }}
                  error={!!errors.fecha}
                  helperText={errors.fecha?.message}
                />
              )}
            />

            <Controller
              name="monto"
              control={control}
              rules={{
                required: 'Indicá el monto.',
                validate: (v) => {
                  const n = Number(v)
                  if (Number.isNaN(n)) return 'Debe ser un número.'
                  if (n <= 0) return 'Debe ser mayor a 0.'
                  if (n > saldo) return 'No puede superar el saldo pendiente.'
                  return true
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="number"
                  label="Monto"
                  required
                  slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
                  error={!!errors.monto}
                  helperText={errors.monto?.message}
                />
              )}
            />

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
                  helperText={errors.medio_pago_id?.message}
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
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={close} disabled={registrar.isPending}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={registrar.isPending}>
            Registrar cobro
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
