import { useQuery } from '@tanstack/react-query'
import { catalogosService } from '../services/catalogosService'
import { catalogosKeys } from '../keys'

const STALE = 10 * 60 * 1000
const GC = 60 * 60 * 1000

export function useEstadosProveedor() {
  return useQuery({
    queryKey: catalogosKeys.estadosProveedor(),
    queryFn: () => catalogosService.estadosProveedor(),
    staleTime: STALE,
    gcTime: GC,
  })
}
