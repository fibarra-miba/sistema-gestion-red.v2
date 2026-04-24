import { useMutation, useQueryClient } from '@tanstack/react-query'
import { preciosService } from '../services/preciosService'
import { planesKeys } from '../keys'
import type { PrecioPlanCreate, PrecioPlanOut } from '../types'
import type { ApiError } from '@/types/api'

interface CreatePriceArgs {
  planId: number
  payload: PrecioPlanCreate
}

// Un precio nuevo puede cambiar el precio_vigente del plan
// (y la vigencia del anterior). Por eso invalidamos:
//  - historial del plan
//  - detail del plan
//  - lista de planes (muestra precio_vigente en la tabla)
export function useCreatePrice() {
  const qc = useQueryClient()

  return useMutation<PrecioPlanOut, ApiError, CreatePriceArgs>({
    mutationFn: ({ planId, payload }) => preciosService.create(planId, payload),
    onSuccess: (_precio, { planId }) => {
      qc.invalidateQueries({ queryKey: planesKeys.precios(planId) })
      qc.invalidateQueries({ queryKey: planesKeys.detail(planId) })
      qc.invalidateQueries({ queryKey: planesKeys.lists() })
    },
  })
}
