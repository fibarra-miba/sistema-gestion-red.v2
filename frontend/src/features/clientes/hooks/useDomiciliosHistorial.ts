import { useQuery } from '@tanstack/react-query'
import { domiciliosService } from '../services/domiciliosService'
import { clientesKeys } from '../keys'

export function useDomiciliosHistorial(clienteId: number | undefined) {
  return useQuery({
    queryKey: clienteId
      ? clientesKeys.domicilios(clienteId)
      : ['clientes', 'domicilios', 'disabled'],
    queryFn: () => domiciliosService.listHistorial(clienteId as number),
    enabled: typeof clienteId === 'number' && clienteId > 0,
  })
}
