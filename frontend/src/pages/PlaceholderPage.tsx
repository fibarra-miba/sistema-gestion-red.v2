import { Box, Typography } from '@mui/material'

interface PlaceholderPageProps {
  title: string
}

export default function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <Box>
      <Typography component="h1" variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
        {title}
      </Typography>
      <Typography component="p" variant="body2" sx={{ color: 'text.secondary' }}>
        Módulo en construcción.
      </Typography>
    </Box>
  )
}
