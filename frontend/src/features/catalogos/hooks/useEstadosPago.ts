import { useQuery } from '@tanstack/react-query'
import { catalogosService } from '../services/catalogosService'
import { catalogosKeys } from '../keys'

const STALE = 10 * 60 * 1000
const GC = 60 * 60 * 1000

export function useEstadosPago() {
  return useQuery({
    queryKey: catalogosKeys.estadosPago(),
    queryFn: () => catalogosService.estadosPago(),
    staleTime: STALE,
    gcTime: GC,
  })
}
