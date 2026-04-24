import { useMutation, useQueryClient } from '@tanstack/react-query'
import { planesService } from '../services/planesService'
import { planesKeys } from '../keys'
import type { PlanCreate, PlanOut } from '../types'
import type { ApiError } from '@/types/api'

export function useCreatePlan() {
  const qc = useQueryClient()

  return useMutation<PlanOut, ApiError, PlanCreate>({
    mutationFn: (payload) => planesService.create(payload),
    onSuccess: (plan) => {
      qc.setQueryData(planesKeys.detail(plan.plan_id), plan)
      qc.invalidateQueries({ queryKey: planesKeys.lists() })
    },
  })
}
