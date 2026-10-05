import { useEffect, useState } from 'react'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material'
import { isApiError } from '@/types/api'
import {
  fromDateInputValueLocalNoon,
  toDateInputValue,
  todayDateInputValue,
} from '@/lib/format'
import { contratoDisplayName } from '../utils'
import type { ContractBajaIn, ContractCommercialOut } from '../types'

export type BajaContratoKind = 'cancel' | 'terminate'

interface Props {
  open: boolean
  kind: BajaContratoKind | null
  contrato: ContractCommercialOut | null
  loading?: boolean
  error?: unknown
  onConfirm: (payload: ContractBajaIn) => void | Promise<void>
  onCancel: () => void
}

const COPY: Record<
  BajaContratoKind,
  { title: string; description: string; confirmLabel: string }
> = {
  cancel: {
    title: 'Cancelar contrato',
    description:
      'Se cancelará el contrato. Esta acción deja el contrato en estado CANCELADO — revisar que sea lo correcto.',
    confirmLabel: 'Cancelar contrato',
  },
  terminate: {
    title: 'Dar de baja contrato',
    description:
      'El contrato pasará a estado BAJA y dejará de estar operativo.',
    confirmLabel: 'Dar de baja',
  },
}

// Reemplaza la confirmación genérica para cancel/terminate: ambas
// transiciones ahora aceptan fecha de baja + motivo opcional.
export default function BajaContratoDialog({
  open,
  kind,
  contrato,
  loading,
  error,
  onConfirm,
  onCancel,
}: Props) {
  const [fecha, setFecha] = useState(todayDateInputValue())
  const [motivo, setMotivo] = useState('')

  useEffect(() => {
    if (!open) {
      setFecha(todayDateInputValue())
      setMotivo('')
    }
  }, [open])

  const today = todayDateInputValue()
  const minFecha = contrato ? toDateInputValue(contrato.fecha_inicio_contrato) : undefined
  const isFuture = fecha > today
  const isAnteriorAlInicio = !!minFecha && fecha < minFecha
  const fechaInvalida = isFuture || isAnteriorAlInicio

  const errorMsg = resolveErrorMessage(error)
  const nombre = contrato ? contratoDisplayName(contrato) : null
  const copy = kind ? COPY[kind] : null

  const handleConfirm = () => {
    if (fechaInvalida) return
    const payload: ContractBajaIn = {
      fecha_fin_contrato: fromDateInputValueLocalNoon(fecha),
    }
    if (motivo.trim()) payload.motivo = motivo.trim()
    onConfirm(payload)
  }

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onCancel}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        {copy?.title}
        {contrato ? ` — "${nombre}" (#${contrato.contrato_id})` : ''}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          {copy && <DialogContentText>{copy.description}</DialogContentText>}

          {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

          <TextField
            label="Fecha de baja"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
            fullWidth
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: { max: today, min: minFecha },
            }}
            error={fechaInvalida}
            helperText={
              isFuture
                ? 'No puede ser una fecha futura.'
                : isAnteriorAlInicio
                  ? 'No puede ser anterior al inicio del contrato.'
                  : undefined
            }
          />

          <TextField
            label="Motivo (opcional)"
            multiline
            minRows={2}
            fullWidth
            value={motivo}
            onChange={(e) => setMotivo(e.target.value.slice(0, 200))}
            helperText={`${motivo.length}/200`}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleConfirm}
          color="error"
          variant="contained"
          disabled={loading || fechaInvalida}
        >
          {copy?.confirmLabel ?? 'Confirmar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function resolveErrorMessage(error: unknown): string | null {
  if (!error) return null
  if (isApiError(error)) return error.detail
  if (error instanceof Error) return error.message
  return 'Error inesperado.'
}
