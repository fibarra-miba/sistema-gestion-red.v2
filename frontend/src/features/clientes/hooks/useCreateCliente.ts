import { useMutation, useQueryClient } from '@tanstack/react-query'
import { clientesService } from '../services/clientesService'
import { clientesKeys } from '../keys'
import type { ClienteCreate, ClienteOut } from '../types'
import type { ApiError } from '@/types/api'

export function useCreateCliente() {
  const qc = useQueryClient()

  return useMutation<ClienteOut, ApiError, ClienteCreate>({
    mutationFn: (payload) => clientesService.create(payload),
    onSuccess: (cliente) => {
      qc.invalidateQueries({ queryKey: clientesKeys.lists() })
      qc.setQueryData(clientesKeys.detail(cliente.cliente_id), cliente)
    },
  })
}
