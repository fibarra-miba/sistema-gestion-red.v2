import { useQuery } from '@tanstack/react-query'
import { pagosService } from '../services/pagosService'
import { cuentaKeys } from '../keys'
import type { ListCuentaMovimientosParams } from '../types'

export function useCuentaMovimientos(
  clienteId: number | undefined,
  params: ListCuentaMovimientosParams = {},
) {
  return useQuery({
    queryKey:
      clienteId != null
        ? cuentaKeys.movimientos(clienteId, params)
        : [...cuentaKeys.all, 'movimientos', 'disabled'],
    queryFn: () => pagosService.listCuentaMovimientos(clienteId as number, params),
    enabled: clienteId != null,
  })
}
