import { useQuery } from '@tanstack/react-query'
import { instalacionesService } from '../services/instalacionesService'
import { instalacionesKeys } from '../keys'

export function useInstalacion(instalacionId: number | undefined) {
  return useQuery({
    queryKey:
      instalacionId != null
        ? instalacionesKeys.detail(instalacionId)
        : ['instalaciones', 'detail', 'disabled'],
    queryFn: () => instalacionesService.get(instalacionId as number),
    enabled: typeof instalacionId === 'number' && instalacionId > 0,
  })
}
