import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authService } from '../services/authService'
import { authKeys } from '../keys'
import type { ChangePasswordRequest } from '../types'

export function useChangePassword() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ChangePasswordRequest) => authService.changePassword(payload),
    onSuccess: () => {
      // El backend invalida la cookie tras cambiar la contraseña — forzamos relogin.
      queryClient.setQueryData(authKeys.me(), null)
      queryClient.clear()
    },
  })
}
