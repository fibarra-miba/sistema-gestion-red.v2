import { Box, Paper, type PaperProps } from '@mui/material'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  // Slot alineado a la derecha: típicamente "Limpiar filtros" o acciones
  // relacionadas al set de filtros actual.
  actions?: ReactNode
  sx?: PaperProps['sx']
}

// Contenedor responsive para barras de filtros/búsqueda.
// - Paper outlined consistente con el resto de secciones de página.
// - Grid adaptativo se define por el consumidor (children), el wrapper
//   sólo garantiza padding, containment y slot de acciones.
// - Reserva espacio para el slot de acciones incluso cuando está vacío,
//   para evitar saltos de layout al aparecer/desaparecer botones.
export default function FilterBar({ children, actions, sx }: Props) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 1.5, sm: 2 },
        minWidth: 0,
        width: '100%',
        ...sx,
      }}
    >
      <Box sx={{ minWidth: 0 }}>{children}</Box>
      {actions && (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            justifyContent: 'flex-end',
            mt: 1.5,
          }}
        >
          {actions}
        </Box>
      )}
    </Paper>
  )
}
