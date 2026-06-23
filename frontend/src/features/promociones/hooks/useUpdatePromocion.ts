import { useMutation, useQueryClient } from '@tanstack/react-query'
import { promocionesService } from '../services/promocionesService'
import { promocionesKeys } from '../keys'
import type { PromocionOut, PromocionUpdate } from '../types'
import type { ApiError } from '@/types/api'

interface UpdateArgs {
  promocionId: number
  payload: PromocionUpdate
}

// Cubre edición y activar/desactivar (toggle de activo_promo).
export function useUpdatePromocion() {
  const qc = useQueryClient()

  return useMutation<PromocionOut, ApiError, UpdateArgs>({
    mutationFn: ({ promocionId, payload }) => promocionesService.update(promocionId, payload),
    onSuccess: (promo) => {
      qc.setQueryData(promocionesKeys.detail(promo.promocion_id), promo)
      qc.invalidateQueries({ queryKey: promocionesKeys.lists() })
    },
  })
}
