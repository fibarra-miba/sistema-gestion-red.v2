import { useQuery } from '@tanstack/react-query'
import { catalogosService } from '../services/catalogosService'
import { catalogosKeys } from '../keys'

const STALE = 10 * 60 * 1000
const GC = 60 * 60 * 1000

export function useTiposPago() {
  return useQuery({
    queryKey: catalogosKeys.tiposPago(),
    queryFn: () => catalogosService.tiposPago(),
    staleTime: STALE,
    gcTime: GC,
  })
}
