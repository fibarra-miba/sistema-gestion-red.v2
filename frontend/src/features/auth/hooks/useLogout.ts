import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authService } from '../services/authService'
import { authKeys } from '../keys'

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      // Aun si el backend falla en cerrar sesión (ej. 401 de sesión ya expirada),
      // limpiamos el estado local para que la UI redirija al login.
      queryClient.setQueryData(authKeys.me(), null)
      queryClient.clear()
    },
  })
}
