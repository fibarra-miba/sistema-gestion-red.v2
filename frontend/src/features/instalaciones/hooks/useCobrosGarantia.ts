import { useQuery } from '@tanstack/react-query'
import { instalacionesService } from '../services/instalacionesService'
import { instalacionesKeys } from '../keys'

export function useCobrosGarantia(garantiaId: number | undefined) {
  return useQuery({
    queryKey: instalacionesKeys.cobros(garantiaId ?? 0),
    queryFn: () => instalacionesService.listCobrosGarantia(garantiaId as number),
    enabled: typeof garantiaId === 'number' && garantiaId > 0,
  })
}
