import { useMutation, useQueryClient } from '@tanstack/react-query'
import { pagosService } from '../services/pagosService'
import { cuentaKeys, pagosKeys } from '../keys'
import type { GenerarPeriodoIn, GenerarPeriodoOut } from '../types'
import type { ApiError } from '@/types/api'

interface Vars {
  contratoId: number
  payload: GenerarPeriodoIn
}

export function useGenerarPeriodo() {
  const qc = useQueryClient()

  return useMutation<GenerarPeriodoOut, ApiError, Vars>({
    mutationFn: ({ contratoId, payload }) =>
      pagosService.generarPeriodo(contratoId, payload),
    onSuccess: (data, { contratoId }) => {
      qc.invalidateQueries({ queryKey: pagosKeys.byContratoAll(contratoId) })
      qc.setQueryData(pagosKeys.detail(data.pago.pago_id), undefined)
      qc.invalidateQueries({ queryKey: cuentaKeys.all })
    },
  })
}
