import { useQuery } from '@tanstack/react-query'
import { clientesService } from '../services/clientesService'
import { clientesKeys } from '../keys'
import type { ListClientesParams } from '../types'

export function useClientes(params: ListClientesParams = {}) {
  return useQuery({
    queryKey: clientesKeys.list(params),
    queryFn: () => clientesService.list(params),
  })
}
