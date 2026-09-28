import { useQuery } from '@tanstack/react-query'
import { instalacionesService } from '../services/instalacionesService'
import { instalacionesKeys } from '../keys'
import type { ListGarantiasParams } from '../types'

// Listado global de garantías (depósitos), sin scope a una instalación
// puntual. Lo consume la pantalla propia /garantias. Para el listado
// scopeado a una instalación, ver useGarantias.
export function useGarantiasList(params: ListGarantiasParams = {}) {
  return useQuery({
    queryKey: instalacionesKeys.garantiasList(params),
    queryFn: () => instalacionesService.listGarantias(params),
  })
}
