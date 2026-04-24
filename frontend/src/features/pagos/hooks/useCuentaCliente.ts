import { useQuery } from '@tanstack/react-query'
import { pagosService } from '../services/pagosService'
import { cuentaKeys } from '../keys'

export function useCuentaCliente(clienteId: number | undefined) {
  return useQuery({
    queryKey:
      clienteId != null
        ? cuentaKeys.resumen(clienteId)
        : [...cuentaKeys.all, 'resumen', 'disabled'],
    queryFn: () => pagosService.getCuentaCliente(clienteId as number),
    enabled: clienteId != null,
  })
}
