import { useMutation, useQueryClient } from '@tanstack/react-query'
import { pagosService } from '../services/pagosService'
import { cuentaKeys, pagosKeys } from '../keys'
import type { GenerarLoteIn, GenerarLoteOut } from '../types'
import type { ApiError } from '@/types/api'

export function useGenerarLote() {
  const qc = useQueryClient()

  return useMutation<GenerarLoteOut, ApiError, GenerarLoteIn>({
    mutationFn: (payload) => pagosService.generarLote(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: pagosKeys.all })
      qc.invalidateQueries({ queryKey: cuentaKeys.all })
    },
  })
}
