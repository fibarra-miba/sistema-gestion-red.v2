import { useQuery } from '@tanstack/react-query'
import { catalogosService } from '../services/catalogosService'
import { catalogosKeys } from '../keys'

const STALE = 10 * 60 * 1000
const GC = 60 * 60 * 1000

export function useEstadosGarantia() {
  return useQuery({
    queryKey: catalogosKeys.estadosGarantia(),
    queryFn: () => catalogosService.estadosGarantia(),
    staleTime: STALE,
    gcTime: GC,
  })
}
