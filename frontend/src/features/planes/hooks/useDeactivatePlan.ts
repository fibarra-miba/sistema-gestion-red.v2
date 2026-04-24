import { useMutation, useQueryClient } from '@tanstack/react-query'
import { planesService } from '../services/planesService'
import { planesKeys } from '../keys'
import type { ApiError } from '@/types/api'

// Baja lógica: el backend cambia el estado del plan a inactivo.
// No devuelve el plan actualizado, así que invalidamos detail y lists.
export function useDeactivatePlan() {
  const qc = useQueryClient()

  return useMutation<{ message: string }, ApiError, number>({
    mutationFn: (planId) => planesService.deactivate(planId),
    onSuccess: (_data, planId) => {
      qc.invalidateQueries({ queryKey: planesKeys.detail(planId) })
      qc.invalidateQueries({ queryKey: planesKeys.lists() })
    },
  })
}
