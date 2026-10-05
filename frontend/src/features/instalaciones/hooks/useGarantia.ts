import { useQuery } from '@tanstack/react-query'
import { instalacionesService } from '../services/instalacionesService'
import { instalacionesKeys } from '../keys'

export function useGarantia(garantiaId: number | undefined) {
  return useQuery({
    queryKey: instalacionesKeys.garantiaDetail(garantiaId ?? 0),
    queryFn: () => instalacionesService.getGarantia(garantiaId as number),
    enabled: typeof garantiaId === 'number' && garantiaId > 0,
  })
}
