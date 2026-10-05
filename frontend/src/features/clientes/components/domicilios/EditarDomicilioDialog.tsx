import { Dialog, DialogContent, DialogTitle } from '@mui/material'
import { useSnackbar } from '@/components/ui/SnackbarProvider'
import { useUpdateDomicilio } from '../../hooks/useUpdateDomicilio'
import DomicilioForm, { type DomicilioFormValues } from './DomicilioForm'
import type { DomicilioOut, DomicilioUpdate } from '../../types'

interface Props {
  open: boolean
  clienteId: number
  domicilio: DomicilioOut | null
  onClose: () => void
}

// Corrección de datos de carga de un domicilio ya existente (vigente o
// histórico) — no es una mudanza. Manda sólo los campos que cambiaron.
export default function EditarDomicilioDialog({
  open,
  clienteId,
  domicilio,
  onClose,
}: Props) {
  const { showSuccess } = useSnackbar()
  const updateMutation = useUpdateDomicilio()

  const initialValues: Partial<DomicilioFormValues> | undefined = domicilio
    ? {
        calle: domicilio.calle ?? '',
        numero: domicilio.numero != null ? String(domicilio.numero) : '',
        complejo: domicilio.complejo ?? '',
        torre: domicilio.torre ?? '',
        piso: domicilio.piso != null ? String(domicilio.piso) : '',
        depto: domicilio.depto ?? '',
        referencias: domicilio.referencias ?? '',
      }
    : undefined

  const handleClose = () => {
    if (updateMutation.isPending) return
    updateMutation.reset()
    onClose()
  }

  const handleSubmit = async (values: DomicilioFormValues) => {
    if (!domicilio) return
    const payload = diffDomicilio(domicilio, values)
    if (Object.keys(payload).length === 0) {
      handleClose()
      return
    }
    await updateMutation.mutateAsync({
      clienteId,
      domicilioId: domicilio.domicilio_id,
      payload,
    })
    showSuccess('Domicilio actualizado.')
    updateMutation.reset()
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Corregir datos del domicilio</DialogTitle>
      <DialogContent>
        <DomicilioForm
          mode="edit"
          initialValues={initialValues}
          onSubmit={handleSubmit}
          onCancel={handleClose}
          loading={updateMutation.isPending}
          error={updateMutation.error}
        />
      </DialogContent>
    </Dialog>
  )
}

// Diff campo a campo contra el domicilio original — el backend rechaza
// (400) un body vacío, así que sólo mandamos lo que realmente cambió.
function diffDomicilio(
  original: DomicilioOut,
  values: DomicilioFormValues,
): DomicilioUpdate {
  const payload: DomicilioUpdate = {}

  const calle = values.calle.trim() || null
  if (calle !== (original.calle ?? null)) payload.calle = calle

  const numero = values.numero.trim() ? Number(values.numero) : null
  if (numero !== (original.numero ?? null)) payload.numero = numero

  const complejo = values.complejo.trim() || null
  if (complejo !== (original.complejo ?? null)) payload.complejo = complejo

  const torre = values.torre.trim() || null
  if (torre !== (original.torre ?? null)) payload.torre = torre

  const piso = values.piso.trim() ? Number(values.piso) : null
  if (piso !== (original.piso ?? null)) payload.piso = piso

  const depto = values.depto.trim() || null
  if (depto !== (original.depto ?? null)) payload.depto = depto

  const referencias = values.referencias.trim() || null
  if (referencias !== (original.referencias ?? null)) {
    payload.referencias = referencias
  }

  return payload
}
