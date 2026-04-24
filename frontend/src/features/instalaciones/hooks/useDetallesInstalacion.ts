import { useQuery } from '@tanstack/react-query'
import { instalacionesService } from '../services/instalacionesService'
import { instalacionesKeys } from '../keys'

export function useDetallesInstalacion(instalacionId: number | undefined) {
  return useQuery({
    queryKey:
      instalacionId != null
        ? instalacionesKeys.detalles(instalacionId)
        : ['instalaciones', 'detalles', 'disabled'],
    queryFn: () => instalacionesService.listDetalles(instalacionId as number),
    enabled: typeof instalacionId === 'number' && instalacionId > 0,
  })
}
