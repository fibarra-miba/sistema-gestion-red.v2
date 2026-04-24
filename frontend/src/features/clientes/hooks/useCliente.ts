import { useQuery } from '@tanstack/react-query'
import { clientesService } from '../services/clientesService'
import { clientesKeys } from '../keys'

export function useCliente(clienteId: number | undefined) {
  return useQuery({
    queryKey: clienteId ? clientesKeys.detail(clienteId) : ['clientes', 'detail', 'disabled'],
    queryFn: () => clientesService.get(clienteId as number),
    enabled: typeof clienteId === 'number' && clienteId > 0,
  })
}
