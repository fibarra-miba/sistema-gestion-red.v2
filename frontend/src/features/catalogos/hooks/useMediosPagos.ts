import { useQuery } from '@tanstack/react-query'
import { catalogosService } from '../services/catalogosService'
import { catalogosKeys } from '../keys'

// Catálogos cambian poco. 10 min stale + 1h gc es suficiente.
const STALE = 10 * 60 * 1000
const GC = 60 * 60 * 1000

export function useMediosPagos() {
  return useQuery({
    queryKey: catalogosKeys.mediosPagos(),
    queryFn: () => catalogosService.mediosPagos(),
    staleTime: STALE,
    gcTime: GC,
  })
}
