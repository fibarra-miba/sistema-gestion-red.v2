import { useMutation, useQueryClient } from '@tanstack/react-query'
import { promocionesService } from '../services/promocionesService'
import { promocionesKeys } from '../keys'
import type { PromocionCreate, PromocionOut } from '../types'
import type { ApiError } from '@/types/api'

export function useCreatePromocion() {
  const qc = useQueryClient()

  return useMutation<PromocionOut, ApiError, PromocionCreate>({
    mutationFn: (payload) => promocionesService.create(payload),
    onSuccess: (promo) => {
      qc.setQueryData(promocionesKeys.detail(promo.promocion_id), promo)
      qc.invalidateQueries({ queryKey: promocionesKeys.lists() })
    },
  })
}
