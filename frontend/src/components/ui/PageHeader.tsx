import { Stack, Typography, type StackProps } from '@mui/material'
import type { ReactNode } from 'react'

interface Props {
  title: string
  subtitle?: string
  actions?: ReactNode
  // Tag semántico del título — el default es h1, pero si la página ya
  // tiene un h1 más alto, se puede bajar a h2.
  titleComponent?: 'h1' | 'h2'
  sx?: StackProps['sx']
}

// Header de página reutilizable: título + acciones alineadas.
// Mobile stackea, desktop alinea en row. Usar en todas las páginas.
export default function PageHeader({
  title,
  subtitle,
  actions,
  titleComponent = 'h1',
  sx,
}: Props) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={{ xs: 1.5, sm: 2 }}
      sx={{
        alignItems: { sm: 'center' },
        justifyContent: 'space-between',
        ...sx,
      }}
    >
      <Stack spacing={0.25} sx={{ minWidth: 0 }}>
        <Typography
          component={titleComponent}
          variant="h5"
          sx={{ fontWeight: 700, lineHeight: 1.2 }}
          noWrap
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Stack>
      {actions && (
        <Stack
          direction="row"
          spacing={1}
          sx={{
            flexShrink: 0,
            width: { xs: '100%', sm: 'auto' },
            // En mobile los botones ocupan el ancho completo.
            '& > *': { width: { xs: '100%', sm: 'auto' } },
          }}
        >
          {actions}
        </Stack>
      )}
    </Stack>
  )
}
