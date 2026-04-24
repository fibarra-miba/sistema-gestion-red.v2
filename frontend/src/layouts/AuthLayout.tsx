import { Box, Paper, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import ColorModeToggle from '@/theme/ColorModeToggle'

interface Props {
  title: string
  subtitle?: string
  children: ReactNode
}

// Layout minimal para pantallas públicas (login) o de acción obligatoria
// (cambio de contraseña). Sin drawer ni navegación lateral, centrado.
export default function AuthLayout({ title, subtitle, children }: Props) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: { xs: 2, sm: 3 },
      }}
    >
      <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
        <ColorModeToggle />
      </Box>

      <Paper
        variant="outlined"
        sx={{
          width: '100%',
          maxWidth: 420,
          p: { xs: 3, sm: 4 },
          borderRadius: 2,
        }}
      >
        <Stack spacing={3}>
          <Stack spacing={0.5}>
            <Typography
              variant="overline"
              sx={{ color: 'text.secondary', letterSpacing: 1.5 }}
            >
              Sistema RED
            </Typography>
            <Typography component="h1" variant="h5" sx={{ fontWeight: 700 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Stack>

          {children}
        </Stack>
      </Paper>
    </Box>
  )
}
