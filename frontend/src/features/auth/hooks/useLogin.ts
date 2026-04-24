import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authService } from '../services/authService'
import { authKeys } from '../keys'
import type { AuthMe, LoginRequest } from '../types'

export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: LoginRequest) => authService.login(payload),
    onSuccess: (data: AuthMe) => {
      // Hidratamos la cache para que el AuthProvider no tenga que volver a consultar /auth/me.
      queryClient.setQueryData(authKeys.me(), data)
    },
  })
}
