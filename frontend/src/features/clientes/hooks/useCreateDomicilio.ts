import { useMutation, useQueryClient } from '@tanstack/react-query'
import { domiciliosService } from '../services/domiciliosService'
import { clientesKeys } from '../keys'
import type { DomicilioCreate, DomicilioOut } from '../types'
import type { ApiError } from '@/types/api'

interface CreateArgs {
  clienteId: number
  payload: DomicilioCreate
}

// Crear un domicilio en el backend cierra automáticamente el vigente anterior.
// Invalidamos las tres queries afectadas: vigente, historial y detalle.
export function useCreateDomicilio() {
  const qc = useQueryClient()

  return useMutation<DomicilioOut, ApiError, CreateArgs>({
    mutationFn: ({ clienteId, payload }) => domiciliosService.create(clienteId, payload),
    onSuccess: (_domicilio, { clienteId }) => {
      qc.invalidateQueries({ queryKey: clientesKeys.domicilioVigente(clienteId) })
      qc.invalidateQueries({ queryKey: clientesKeys.domicilios(clienteId) })
      qc.invalidateQueries({ queryKey: clientesKeys.detail(clienteId) })
    },
  })
}
