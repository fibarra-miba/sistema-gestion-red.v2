import { useMutation, useQueryClient } from '@tanstack/react-query'
import { contratosService } from '../services/contratosService'
import { contratosKeys } from '../keys'
import type {
  ContractProgramarInstalacion,
  ContractProgramarInstalacionResponse,
} from '../types'
import type { ApiError } from '@/types/api'

interface Variables {
  contratoId: number
  payload: ContractProgramarInstalacion
}

// Programa la instalación de un contrato BORRADOR: crea la programación y deja
// el contrato en PENDIENTE_INSTALACION. Invalidamos también el detail porque
// cambia el estado_contrato_id.
export function useProgramarInstalacion() {
  const qc = useQueryClient()

  return useMutation<
    ContractProgramarInstalacionResponse,
    ApiError,
    Variables
  >({
    mutationFn: ({ contratoId, payload }) =>
      contratosService.programarInstalacion(contratoId, payload),
    onSuccess: (_data, { contratoId }) => {
      qc.invalidateQueries({ queryKey: contratosKeys.lists() })
      qc.invalidateQueries({ queryKey: contratosKeys.detail(contratoId) })
    },
  })
}
