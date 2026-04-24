import { useQuery } from '@tanstack/react-query'
import { domiciliosService } from '../services/domiciliosService'
import { clientesKeys } from '../keys'

// Retorna el domicilio vigente del cliente, o null si todavía no tiene uno.
// El service ya absorbe el 404 "DOMICILIO_VIGENTE_NOT_FOUND".
export function useDomicilioVigente(clienteId: number | undefined) {
  return useQuery({
    queryKey: clienteId
      ? clientesKeys.domicilioVigente(clienteId)
      : ['clientes', 'domicilio-vigente', 'disabled'],
    queryFn: () => domiciliosService.getVigente(clienteId as number),
    enabled: typeof clienteId === 'number' && clienteId > 0,
  })
}
