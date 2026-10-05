import { useQuery } from '@tanstack/react-query'
import { instalacionesService } from '../services/instalacionesService'
import { instalacionesKeys } from '../keys'

// Garantías de un cliente. Comparte prefijo de key con el listado global,
// así las mutaciones que invalidan garantiasLists() lo refrescan.
export function useGarantiasCliente(clienteId: number | undefined) {
  const params = { cliente_id: clienteId as number }
  return useQuery({
    queryKey: instalacionesKeys.garantiasList(params),
    queryFn: () => instalacionesService.listGarantias(params),
    enabled: typeof clienteId === 'number' && clienteId > 0,
  })
}
