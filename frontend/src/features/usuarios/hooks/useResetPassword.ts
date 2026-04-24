import { useMutation, useQueryClient } from '@tanstack/react-query'
import { usuariosService } from '../services/usuariosService'
import { usuariosKeys } from '../keys'

export function useResetPassword() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (usuarioId: number) => usuariosService.resetPassword(usuarioId),
    onSuccess: (_data, usuarioId) => {
      queryClient.invalidateQueries({ queryKey: usuariosKeys.lists() })
      queryClient.invalidateQueries({ queryKey: usuariosKeys.detail(usuarioId) })
    },
  })
}
