import { Box, Chip, Stack, Typography } from '@mui/material'
import { useAuth } from '@/features/auth'

export default function HomePage() {
  const { user } = useAuth()

  return (
    <Stack spacing={1}>
      <Box>
        <Typography component="h1" variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
          {user ? `Hola, ${user.nombre_usuario}` : 'Sistema RED'}
        </Typography>
        <Typography component="p" variant="body2" sx={{ color: 'text.secondary' }}>
          Seleccioná un módulo en el panel lateral.
        </Typography>
      </Box>
      {user && (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Chip label={user.rol.nombre_rol} size="small" color="primary" variant="outlined" />
          <Typography variant="caption" color="text.secondary">
            {user.username_usuario} · {user.email_usuario}
          </Typography>
        </Stack>
      )}
    </Stack>
  )
}
