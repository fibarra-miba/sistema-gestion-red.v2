import { useMutation, useQueryClient } from '@tanstack/react-query'
import { contratosService } from '../services/contratosService'
import { contratosKeys } from '../keys'
import type { ContractChangePlan, ContractOut } from '../types'
import type { ApiError } from '@/types/api'

interface Variables {
  contratoId: number
  payload: ContractChangePlan
}

// change-plan cierra el contrato original y crea uno nuevo.
// Invalidamos lists + detail del original porque ambos cambiaron
// (el original ahora tiene fecha_fin / estado terminal).
export function useChangePlan() {
  const qc = useQueryClient()

  return useMutation<ContractOut, ApiError, Variables>({
    mutationFn: ({ contratoId, payload }) =>
      contratosService.changePlan(contratoId, payload),
    onSuccess: (_data, { contratoId }) => {
      qc.invalidateQueries({ queryKey: contratosKeys.lists() })
      qc.invalidateQueries({ queryKey: contratosKeys.detail(contratoId) })
    },
  })
}
