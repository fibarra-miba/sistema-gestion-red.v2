import { Box, Chip, Stack, Typography } from '@mui/material'
import { useAuth } from '@/features/auth'
import {
  CobranzasSection,
  ContratosSection,
  InstalacionesSection,
} from '@/features/dashboard'

export default function HomePage() {
  const { user, hasCapability } = useAuth()

  // Cada sección se monta sólo si el rol tiene la capability — así no se dispara
  // el fetch del /resumen correspondiente (y no hay 403). El mapa capability→rol
  // coincide con los require_roles de cada endpoint.
  const showComercial = hasCapability('can_manage_clientes')
  const showInstalaciones = hasCapability('can_manage_instalaciones')
  const showCobranzas = hasCapability('can_manage_pagos')

  return (
    <Stack spacing={3}>
      <Box>
        <Typography component="h1" variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
          {user ? `Hola, ${user.nombre_usuario}` : 'Sistema RED'}
        </Typography>
        {user && (
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Chip label={user.rol.nombre_rol} size="small" color="primary" variant="outlined" />
            <Typography variant="caption" color="text.secondary">
              {user.username_usuario} · {user.email_usuario}
            </Typography>
          </Stack>
        )}
      </Box>

      {showComercial && <ContratosSection />}
      {showInstalaciones && <InstalacionesSection />}
      {showCobranzas && <CobranzasSection />}
    </Stack>
  )
}
