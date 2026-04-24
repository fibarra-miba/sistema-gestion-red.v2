import { useMutation, useQueryClient } from '@tanstack/react-query'
import { contratosService } from '../services/contratosService'
import { contratosKeys } from '../keys'
import type {
  ContractConfirmTechnicalCondition,
  ContractConfirmTechnicalConditionResponse,
} from '../types'
import type { ApiError } from '@/types/api'

interface Variables {
  contratoId: number
  payload: ContractConfirmTechnicalCondition
}

// Confirma (o rechaza) la condición técnica de un contrato.
// Puede disparar la creación de una programación de instalación —
// por eso invalidamos también el detail (el estado_contrato_id cambia).
export function useConfirmarCondicionTecnica() {
  const qc = useQueryClient()

  return useMutation<
    ContractConfirmTechnicalConditionResponse,
    ApiError,
    Variables
  >({
    mutationFn: ({ contratoId, payload }) =>
      contratosService.confirmarCondicionTecnica(contratoId, payload),
    onSuccess: (_data, { contratoId }) => {
      qc.invalidateQueries({ queryKey: contratosKeys.lists() })
      qc.invalidateQueries({ queryKey: contratosKeys.detail(contratoId) })
    },
  })
}
