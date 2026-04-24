import { useMutation, useQueryClient } from '@tanstack/react-query'
import { usuariosService } from '../services/usuariosService'
import { usuariosKeys } from '../keys'
import type { UsuarioCreate } from '../types'

export function useCreateUsuario() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UsuarioCreate) => usuariosService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usuariosKeys.lists() })
    },
  })
}
