import { Box, Button, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start' }}>
      <Typography component="h1" variant="h5" sx={{ fontWeight: 700 }}>
        404 — Página no encontrada
      </Typography>
      <Typography component="p" variant="body2" sx={{ color: 'text.secondary' }}>
        La ruta que intentaste abrir no existe.
      </Typography>
      <Button component={RouterLink} to="/" variant="contained">
        Volver al inicio
      </Button>
    </Box>
  )
}
