import { useMutation, useQueryClient } from '@tanstack/react-query'
import { preciosService } from '../services/preciosService'
import { planesKeys } from '../keys'
import type { PrecioPlanOut, PrecioPlanUpdate } from '../types'
import type { ApiError } from '@/types/api'

interface UpdatePriceArgs {
  planId: number
  precioId: number
  payload: PrecioPlanUpdate
}

// Editar un precio FUTURO puede correr la fecha de inicio o modificar el
// monto. No afecta al precio vigente actual, pero sí puede cambiar el
// precio_vigente mostrado en la lista si el nuevo desde quedó en el pasado.
export function useUpdatePrice() {
  const qc = useQueryClient()

  return useMutation<PrecioPlanOut, ApiError, UpdatePriceArgs>({
    mutationFn: ({ planId, precioId, payload }) =>
      preciosService.update(planId, precioId, payload),
    onSuccess: (_precio, { planId }) => {
      qc.invalidateQueries({ queryKey: planesKeys.precios(planId) })
      qc.invalidateQueries({ queryKey: planesKeys.detail(planId) })
      qc.invalidateQueries({ queryKey: planesKeys.lists() })
    },
  })
}
