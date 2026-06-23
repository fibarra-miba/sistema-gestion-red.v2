import { useQuery } from '@tanstack/react-query'
import { instalacionesService } from '../services/instalacionesService'
import { instalacionesKeys } from '../keys'

// Garantías de una instalación. Se consume desde el detalle de instalación.
export function useGarantias(instalacionId: number | undefined) {
  return useQuery({
    queryKey:
      instalacionId != null
        ? instalacionesKeys.garantias(instalacionId)
        : ['instalaciones', 'garantias', 'disabled'],
    queryFn: () =>
      instalacionesService.listGarantias({ instalacion_id: instalacionId as number }),
    enabled: typeof instalacionId === 'number' && instalacionId > 0,
  })
}
