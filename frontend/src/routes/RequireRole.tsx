import { Alert, Box, Button, Stack, Typography } from '@mui/material'
import { Link as RouterLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import type { CodigoRol } from '@/features/auth'

interface Props {
  // Requiere que el rol del usuario sea uno de estos.
  anyOf: CodigoRol[]
}

// Guard por rol. Algunas secciones (p. ej. el visor de auditoría) son ADMIN-only
// y no se expresan como capability. La seguridad real vive en el backend
// (require_roles); esto es puramente UX.
export default function RequireRole({ anyOf }: Props) {
  const { user } = useAuth()

  const allowed = !!user && anyOf.includes(user.rol.codigo_rol as CodigoRol)

  if (allowed) return <Outlet />

  return (
    <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
      <Stack spacing={2} sx={{ maxWidth: 480, width: '100%' }}>
        <Alert severity="warning">
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Acceso restringido
          </Typography>
          <Typography variant="body2">
            Tu rol actual no permite acceder a esta sección.
          </Typography>
        </Alert>
        <Button component={RouterLink} to="/" variant="outlined">
          Volver al inicio
        </Button>
      </Stack>
    </Box>
  )
}
