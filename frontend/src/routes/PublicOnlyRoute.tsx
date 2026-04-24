import { Box, CircularProgress } from '@mui/material'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth'

// Para rutas públicas (login). Si ya hay sesión, redirige al inicio.
export default function PublicOnlyRoute() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  if (user) {
    const to = user.requiere_cambio_password_usuario ? '/change-password' : '/'
    return <Navigate to={to} replace />
  }

  return <Outlet />
}
