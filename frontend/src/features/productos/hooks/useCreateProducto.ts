import { useMutation, useQueryClient } from '@tanstack/react-query'
import { productosService } from '../services/productosService'
import { productosKeys } from '../keys'
import type { ProductoCreate, ProductoOut } from '../types'
import type { ApiError } from '@/types/api'

export function useCreateProducto() {
  const qc = useQueryClient()

  return useMutation<ProductoOut, ApiError, ProductoCreate>({
    mutationFn: (payload) => productosService.create(payload),
    onSuccess: (producto) => {
      qc.setQueryData(productosKeys.detail(producto.producto_id), producto)
      qc.invalidateQueries({ queryKey: productosKeys.lists() })
    },
  })
}
