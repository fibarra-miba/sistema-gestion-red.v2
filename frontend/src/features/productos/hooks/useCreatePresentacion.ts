import { useMutation, useQueryClient } from '@tanstack/react-query'
import { productosService } from '../services/productosService'
import { productosKeys } from '../keys'
import type { PresentacionCreate, PresentacionOut } from '../types'
import type { ApiError } from '@/types/api'

interface Args {
  productoId: number
  payload: PresentacionCreate
}

export function useCreatePresentacion() {
  const qc = useQueryClient()

  return useMutation<PresentacionOut, ApiError, Args>({
    mutationFn: ({ productoId, payload }) =>
      productosService.createPresentacion(productoId, payload),
    onSuccess: (pres) => {
      qc.invalidateQueries({ queryKey: productosKeys.presentaciones(pres.producto_id) })
    },
  })
}
