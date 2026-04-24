import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Stack,
  Typography,
} from '@mui/material'
import { isApiError } from '@/types/api'
import { PlanSelect } from '@/features/planes'
import type { ClienteOut, DomicilioOut } from '@/features/clientes'
import type { PlanOut } from '@/features/planes'
import ClienteSelect from './ClienteSelect'
import DomicilioSelect from './DomicilioSelect'
import type { ContractCreate } from '../types'

interface Props {
  onSubmit: (payload: ContractCreate) => void | Promise<void>
  onCancel: () => void
  loading?: boolean
  error?: unknown
  submitLabel?: string
}

// El precio NO se ingresa: el backend lo congela desde el precio vigente
// del plan en el momento de la creación (CLAUDE.md §7 / prompt).
export default function ContratoForm({
  onSubmit,
  onCancel,
  loading,
  error,
  submitLabel = 'Crear contrato',
}: Props) {
  const [clienteId, setClienteId] = useState<number | null>(null)
  const [domicilioId, setDomicilioId] = useState<number | null>(null)
  const [planId, setPlanId] = useState<number | null>(null)

  // Guardamos los objetos seleccionados para poder mostrar un resumen
  // y para que los selects no pierdan la etiqueta al cambiar el search.
  const [selectedCliente, setSelectedCliente] = useState<ClienteOut | null>(null)
  const [, setSelectedDomicilio] = useState<DomicilioOut | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<PlanOut | null>(null)

  const [touched, setTouched] = useState(false)

  const canSubmit =
    clienteId != null && domicilioId != null && planId != null && !loading

  const errorMsg = resolveErrorMessage(error)

  const handleClienteChange = (id: number | null, cliente: ClienteOut | null) => {
    setClienteId(id)
    setSelectedCliente(cliente)
    // Resetear domicilio al cambiar de cliente — los ids no son compartidos.
    setDomicilioId(null)
    setSelectedDomicilio(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (!canSubmit) return
    onSubmit({
      cliente_id: clienteId!,
      domicilio_id: domicilioId!,
      plan_id: planId!,
    })
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack spacing={2}>
        {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

        <ClienteSelect
          value={clienteId}
          onChange={handleClienteChange}
          preselected={selectedCliente}
          required
          error={touched && clienteId == null}
          helperText={
            touched && clienteId == null ? 'Seleccioná un cliente.' : undefined
          }
        />

        <DomicilioSelect
          clienteId={clienteId}
          value={domicilioId}
          onChange={(id, d) => {
            setDomicilioId(id)
            setSelectedDomicilio(d)
          }}
          required
          error={touched && domicilioId == null && clienteId != null}
          helperText={
            touched && domicilioId == null && clienteId != null
              ? 'Seleccioná un domicilio vigente.'
              : undefined
          }
        />

        <PlanSelect
          value={planId}
          onChange={(id, p) => {
            setPlanId(id)
            setSelectedPlan(p)
          }}
          required
          error={touched && planId == null}
          helperText={
            touched && planId == null ? 'Seleccioná un plan.' : undefined
          }
        />

        {selectedPlan && (
          <Alert severity="info" variant="outlined">
            El precio del contrato se congelará al precio vigente del plan
            seleccionado. El backend calcula el monto — no se ingresa manualmente.
          </Alert>
        )}

        <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
          <Button onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!canSubmit}
          >
            {submitLabel}
          </Button>
        </Stack>

        <Typography variant="caption" color="text.secondary">
          Regla de negocio: sólo puede existir un contrato activo vigente por
          domicilio. Si ya hay uno, el backend rechazará la creación.
        </Typography>
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
