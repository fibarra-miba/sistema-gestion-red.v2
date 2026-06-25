import { useMutation, useQueryClient } from '@tanstack/react-query'
import { stockService } from '../services/stockService'
import { stockKeys } from '../keys'
import type {
  AjusteStockCreate,
  DevolucionStockCreate,
  MovimientoStockOut,
} from '../types'
import type { ApiError } from '@/types/api'

function invalidate(qc: ReturnType<typeof useQueryClient>, productoId: number) {
  qc.invalidateQueries({ queryKey: stockKeys.existencias() })
  qc.invalidateQueries({ queryKey: stockKeys.saldo(productoId) })
  qc.invalidateQueries({ queryKey: stockKeys.kardex(productoId) })
}

export function useAjusteStock() {
  const qc = useQueryClient()
  return useMutation<MovimientoStockOut, ApiError, AjusteStockCreate>({
    mutationFn: (payload) => stockService.ajuste(payload),
    onSuccess: (_mov, vars) => invalidate(qc, vars.producto_id),
  })
}

export function useDevolucionStock() {
  const qc = useQueryClient()
  return useMutation<MovimientoStockOut, ApiError, DevolucionStockCreate>({
    mutationFn: (payload) => stockService.devolucion(payload),
    onSuccess: (_mov, vars) => invalidate(qc, vars.producto_id),
  })
}
