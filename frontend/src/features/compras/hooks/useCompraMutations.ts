import { useMutation, useQueryClient } from '@tanstack/react-query'
import { comprasService } from '../services/comprasService'
import { comprasKeys } from '../keys'
import { stockKeys } from '@/features/stock'
import type { CompraCreate, CompraOut } from '../types'
import type { ApiError } from '@/types/api'

export function useCreateCompra() {
  const qc = useQueryClient()
  return useMutation<CompraOut, ApiError, CompraCreate>({
    mutationFn: (payload) => comprasService.create(payload),
    onSuccess: (compra) => {
      qc.setQueryData(comprasKeys.detail(compra.factura_compra_id), compra)
      qc.invalidateQueries({ queryKey: comprasKeys.lists() })
      // La compra impacta stock: invalidar existencias.
      qc.invalidateQueries({ queryKey: stockKeys.existencias() })
    },
  })
}

export function useAnularCompra() {
  const qc = useQueryClient()
  return useMutation<CompraOut, ApiError, number>({
    mutationFn: (facturaCompraId) => comprasService.anular(facturaCompraId),
    onSuccess: (compra) => {
      qc.setQueryData(comprasKeys.detail(compra.factura_compra_id), compra)
      qc.invalidateQueries({ queryKey: comprasKeys.lists() })
      qc.invalidateQueries({ queryKey: stockKeys.existencias() })
    },
  })
}
