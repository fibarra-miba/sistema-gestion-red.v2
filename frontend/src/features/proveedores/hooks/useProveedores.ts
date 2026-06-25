import { useQuery } from '@tanstack/react-query'
import { proveedoresService } from '../services/proveedoresService'
import { proveedoresKeys } from '../keys'
import type { ListProveedoresParams } from '../types'

export function useProveedores(params: ListProveedoresParams = {}) {
  return useQuery({
    queryKey: proveedoresKeys.list(params),
    queryFn: () => proveedoresService.list(params),
    staleTime: 60_000,
  })
}
