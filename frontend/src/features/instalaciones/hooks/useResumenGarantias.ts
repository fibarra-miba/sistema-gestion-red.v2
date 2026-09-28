import { useQuery } from '@tanstack/react-query'
import { instalacionesService } from '../services/instalacionesService'
import { instalacionesKeys } from '../keys'

// Resumen agregado de depósitos (comprometido / activas / devuelto / retenido).
// Se consume desde la pantalla de garantías (/garantias).
export function useResumenGarantias() {
  return useQuery({
    queryKey: instalacionesKeys.garantiasResumen(),
    queryFn: instalacionesService.resumenGarantias,
  })
}
