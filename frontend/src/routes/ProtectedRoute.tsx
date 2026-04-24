import { Box, CircularProgress, Alert, Button, Stack } from '@mui/material'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth'

// Guard raíz: requiere sesión válida en /auth/me.
// - Mientras resuelve → loader centered.
// - Sin sesión → redirige a /login conservando la ruta original.
// - Con sesión pero requiere cambio de password → redirige al flujo obligatorio
//   (excepto si ya estamos ahí).
// - Error de red / 5xx → pantalla con retry, NO redirección (no es problema de auth).
export default function ProtectedRoute() {
  const { user, isLoading, isError, refresh } = useAuth()
  const location = useLocation()

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

  if (isError) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
        }}
      >
        <Stack spacing={2} sx={{ maxWidth: 420, width: '100%' }}>
          <Alert severity="error">
            No se pudo validar la sesión. Verificá la conexión con el servidor.
          </Alert>
          <Button variant="contained" onClick={refresh}>
            Reintentar
          </Button>
        </Stack>
      </Box>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  const mustChangePassword = user.requiere_cambio_password_usuario
  const isOnChangePassword = location.pathname === '/change-password'

  if (mustChangePassword && !isOnChangePassword) {
    return <Navigate to="/change-password" replace />
  }

  return <Outlet />
}
