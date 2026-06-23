import { useMutation, useQueryClient } from '@tanstack/react-query'
import { productosService } from '../services/productosService'
import { productosKeys } from '../keys'
import type { ProductoOut, ProductoUpdate } from '../types'
import type { ApiError } from '@/types/api'

interface UpdateArgs {
  productoId: number
  payload: ProductoUpdate
}

// Cubre edición y activar/desactivar (toggle de activo_producto).
export function useUpdateProducto() {
  const qc = useQueryClient()

  return useMutation<ProductoOut, ApiError, UpdateArgs>({
    mutationFn: ({ productoId, payload }) => productosService.update(productoId, payload),
    onSuccess: (producto) => {
      qc.setQueryData(productosKeys.detail(producto.producto_id), producto)
      qc.invalidateQueries({ queryKey: productosKeys.lists() })
    },
  })
}
