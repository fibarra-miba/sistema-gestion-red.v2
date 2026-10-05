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
import { fromDateInputValueLocalNoon, todayDateInputValue } from '@/lib/format'
import { instalacionContratoLabel } from '../utils'
import type { InstalacionCompletarIn, InstalacionOut } from '../types'

interface Props {
  open: boolean
  instalacion: InstalacionOut | null
  loading?: boolean
  error?: unknown
  onConfirm: (payload: InstalacionCompletarIn) => void | Promise<void>
  onCancel: () => void
}

// completar ahora pide la fecha real en la que se hizo el trabajo — separado
// de la confirmación genérica porque necesita ese dato adicional.
export default function CompletarInstalacionDialog({
  open,
  instalacion,
  loading,
  error,
  onConfirm,
  onCancel,
}: Props) {
  const [fecha, setFecha] = useState(todayDateInputValue())

  useEffect(() => {
    if (!open) {
      setFecha(todayDateInputValue())
    }
  }, [open])

  const today = todayDateInputValue()
  const fechaInvalida = fecha > today
  const errorMsg = resolveErrorMessage(error)
  const contratoLabel = instalacion ? instalacionContratoLabel(instalacion) : null

  const handleConfirm = () => {
    if (fechaInvalida) return
    onConfirm({ fecha_instalacion: fromDateInputValueLocalNoon(fecha) })
  }

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onCancel}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Completar instalación
        {instalacion ? ` #${instalacion.instalacion_id}` : ''}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <DialogContentText>
            La instalación{contratoLabel ? ` de ${contratoLabel}` : ''} pasará
            a COMPLETADA y el contrato quedará ACTIVO. Asegurate de que la
            instalación fue realizada correctamente antes de confirmar.
          </DialogContentText>

          {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

          <TextField
            label="Fecha de instalación"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
            fullWidth
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: { max: today },
            }}
            error={fechaInvalida}
            helperText={
              fechaInvalida
                ? 'No puede ser una fecha futura.'
                : undefined
            }
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={loading || fechaInvalida}
        >
          Completar
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
