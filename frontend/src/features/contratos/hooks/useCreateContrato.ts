import { useMutation, useQueryClient } from '@tanstack/react-query'
import { contratosService } from '../services/contratosService'
import { contratosKeys } from '../keys'
import type { ContractCreate, ContractOut } from '../types'
import type { ApiError } from '@/types/api'

export function useCreateContrato() {
  const qc = useQueryClient()

  return useMutation<ContractOut, ApiError, ContractCreate>({
    mutationFn: (payload) => contratosService.create(payload),
    onSuccess: () => {
      // El POST devuelve el contrato RAW (sin nombres de cliente/plan);
      // no podemos hidratar el detail commercial desde acá. Invalidamos.
      qc.invalidateQueries({ queryKey: contratosKeys.lists() })
    },
  })
}
