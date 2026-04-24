import { useMutation, useQueryClient } from '@tanstack/react-query'
import { clientesService } from '../services/clientesService'
import { clientesKeys } from '../keys'
import type { ClienteOut, ClienteUpdate } from '../types'
import type { ApiError } from '@/types/api'

interface UpdateArgs {
  clienteId: number
  payload: ClienteUpdate
}

export function useUpdateCliente() {
  const qc = useQueryClient()

  return useMutation<ClienteOut, ApiError, UpdateArgs>({
    mutationFn: ({ clienteId, payload }) => clientesService.update(clienteId, payload),
    onSuccess: (cliente) => {
      qc.setQueryData(clientesKeys.detail(cliente.cliente_id), cliente)
      qc.invalidateQueries({ queryKey: clientesKeys.lists() })
    },
  })
}
