import { Button, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import type { ReactNode } from 'react'

interface Props {
  title: string
  // Link al módulo completo (acción secundaria del encabezado).
  to?: string
  toLabel?: string
  children: ReactNode
}

// Encabezado de sección del dashboard: título + acceso al módulo + contenido.
export default function SectionShell({ title, to, toLabel = 'Ver módulo', children }: Props) {
  return (
    <Stack spacing={1.5}>
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        {to && (
          <Button component={RouterLink} to={to} size="small" sx={{ flexShrink: 0 }}>
            {toLabel}
          </Button>
        )}
      </Stack>
      {children}
    </Stack>
  )
}
