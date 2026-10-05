import { useQuery } from '@tanstack/react-query'
import { catalogosService } from '../services/catalogosService'
import { catalogosKeys } from '../keys'

const STALE = 10 * 60 * 1000
const GC = 60 * 60 * 1000

export function useEstadosCliente() {
  return useQuery({
    queryKey: catalogosKeys.estadosCliente(),
    queryFn: () => catalogosService.estadosCliente(),
    staleTime: STALE,
    gcTime: GC,
  })
}
