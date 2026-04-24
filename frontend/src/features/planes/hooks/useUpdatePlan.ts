import { useMutation, useQueryClient } from '@tanstack/react-query'
import { planesService } from '../services/planesService'
import { planesKeys } from '../keys'
import type { PlanOut, PlanUpdate } from '../types'
import type { ApiError } from '@/types/api'

interface UpdateArgs {
  planId: number
  payload: PlanUpdate
}

export function useUpdatePlan() {
  const qc = useQueryClient()

  return useMutation<PlanOut, ApiError, UpdateArgs>({
    mutationFn: ({ planId, payload }) => planesService.update(planId, payload),
    onSuccess: (plan) => {
      qc.setQueryData(planesKeys.detail(plan.plan_id), plan)
      qc.invalidateQueries({ queryKey: planesKeys.lists() })
    },
  })
}
