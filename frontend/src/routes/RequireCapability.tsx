import { Alert, Box, Button, Stack, Typography } from '@mui/material'
import { Link as RouterLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import type { CapabilityKey } from '@/features/auth'

interface Props {
  // Requiere al menos UNA de las capabilities listadas.
  anyOf: CapabilityKey[]
}

// Guard por capabilities. Las capabilities llegan desde el backend en /auth/me —
// el frontend las usa para UX (mostrar/ocultar), pero la seguridad real vive en el API.
export default function RequireCapability({ anyOf }: Props) {
  const { user } = useAuth()

  const allowed = !!user && anyOf.some((cap) => user.capabilities[cap])

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
