import { useMutation, useQueryClient } from '@tanstack/react-query'
import { clientesService } from '../services/clientesService'
import { clientesKeys } from '../keys'
import type { ClienteOut } from '../types'
import type { ApiError } from '@/types/api'

// Transiciones de estado del cliente (activar/desactivar). Sin payload.
// Mutations separadas para exponer isPending/error independientes.
export function useClienteEstadoActions() {
  const qc = useQueryClient()

  const invalidate = (cliente: ClienteOut) => {
    qc.setQueryData(clientesKeys.detail(cliente.cliente_id), cliente)
    qc.invalidateQueries({ queryKey: clientesKeys.lists() })
  }

  const activar = useMutation<ClienteOut, ApiError, number>({
    mutationFn: (id) => clientesService.activar(id),
    onSuccess: invalidate,
  })

  const desactivar = useMutation<ClienteOut, ApiError, number>({
    mutationFn: (id) => clientesService.desactivar(id),
    onSuccess: invalidate,
  })

  return { activar, desactivar }
}
