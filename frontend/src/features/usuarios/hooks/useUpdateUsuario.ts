import { useMutation, useQueryClient } from '@tanstack/react-query'
import { usuariosService } from '../services/usuariosService'
import { usuariosKeys } from '../keys'
import type { UsuarioUpdate } from '../types'

export function useUpdateUsuario() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ usuarioId, payload }: { usuarioId: number; payload: UsuarioUpdate }) =>
      usuariosService.update(usuarioId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: usuariosKeys.lists() })
      queryClient.invalidateQueries({ queryKey: usuariosKeys.detail(variables.usuarioId) })
    },
  })
}
