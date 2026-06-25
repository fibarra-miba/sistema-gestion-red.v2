import { Box } from '@mui/material'
import type { ReactNode } from 'react'

// Grilla responsiva de KPIs: 1 col en mobile, 2 en sm, 4 en md+.
// CSS grid vía sx (sin <Grid>) para no acoplarnos a la API de Grid de MUI.
export default function KpiGrid({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(4, 1fr)',
        },
      }}
    >
      {children}
    </Box>
  )
}
