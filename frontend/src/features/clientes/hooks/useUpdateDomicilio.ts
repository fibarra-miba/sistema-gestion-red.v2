import { useMutation, useQueryClient } from '@tanstack/react-query'
import { domiciliosService } from '../services/domiciliosService'
import { clientesKeys } from '../keys'
import type { DomicilioOut, DomicilioUpdate } from '../types'
import type { ApiError } from '@/types/api'

interface UpdateArgs {
  clienteId: number
  domicilioId: number
  payload: DomicilioUpdate
}

// Corrección de datos de carga de un domicilio (no mudanza) — PATCH parcial.
// A diferencia de crear un domicilio, no cierra ni abre vigencias.
export function useUpdateDomicilio() {
  const qc = useQueryClient()

  return useMutation<DomicilioOut, ApiError, UpdateArgs>({
    mutationFn: ({ clienteId, domicilioId, payload }) =>
      domiciliosService.update(clienteId, domicilioId, payload),
    onSuccess: (_domicilio, { clienteId }) => {
      qc.invalidateQueries({ queryKey: clientesKeys.domicilioVigente(clienteId) })
      qc.invalidateQueries({ queryKey: clientesKeys.domicilios(clienteId) })
    },
  })
}
