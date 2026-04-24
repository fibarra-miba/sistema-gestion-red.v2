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
} from '@mui/material'
import { isApiError } from '@/types/api'
import { PlanSelect } from '@/features/planes'
import type { ContractCommercialOut } from '../types'

interface Props {
  open: boolean
  contrato: ContractCommercialOut | null
  loading?: boolean
  error?: unknown
  onConfirm: (newPlanId: number) => void
  onCancel: () => void
}

// El change-plan del backend cierra el contrato actual y crea uno nuevo.
// Dejarlo explícito en la copy — el usuario debe entender qué va a pasar.
export default function ChangePlanDialog({
  open,
  contrato,
  loading,
  error,
  onConfirm,
  onCancel,
}: Props) {
  const [newPlanId, setNewPlanId] = useState<number | null>(null)
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (!open) {
      setNewPlanId(null)
      setTouched(false)
    }
  }, [open])

  const handleConfirm = () => {
    setTouched(true)
    if (newPlanId == null) return
    onConfirm(newPlanId)
  }

  const errorMsg = resolveErrorMessage(error)
  const sameAsCurrent =
    newPlanId != null && contrato != null && newPlanId === contrato.plan_id

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onCancel}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Cambiar plan del contrato</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <DialogContentText>
            Esta acción <strong>cierra el contrato actual</strong> y crea un
            contrato nuevo con el plan seleccionado. El precio del nuevo
            contrato se congela al precio vigente del plan.
          </DialogContentText>

          {contrato && (
            <Alert severity="info" variant="outlined">
              Plan actual: <strong>{contrato.plan_nombre}</strong>
            </Alert>
          )}

          <PlanSelect
            value={newPlanId}
            onChange={(id) => setNewPlanId(id)}
            label="Nuevo plan"
            required
            error={(touched && newPlanId == null) || sameAsCurrent}
            helperText={
              sameAsCurrent
                ? 'Elegí un plan distinto al actual.'
                : touched && newPlanId == null
                  ? 'Seleccioná un plan.'
                  : undefined
            }
          />

          {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={loading || newPlanId == null || sameAsCurrent}
        >
          Cambiar plan
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
