import { useQuery } from '@tanstack/react-query'
import { comprasService } from '../services/comprasService'
import { comprasKeys } from '../keys'
import type { ListComprasParams } from '../types'

export function useCompras(params: ListComprasParams = {}) {
  return useQuery({
    queryKey: comprasKeys.list(params),
    queryFn: () => comprasService.list(params),
    staleTime: 30_000,
  })
}
