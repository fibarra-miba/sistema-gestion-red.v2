import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import { isApiError } from '@/types/api'
import type { DomicilioOut } from '../../types'
import { formatDomicilioLine, formatFechaCorta } from './domicilioDisplay'

interface DomicilioVigenteCardProps {
  domicilio: DomicilioOut | null | undefined
  loading?: boolean
  error?: unknown
  onCreate: () => void
  onChange: () => void
}

export default function DomicilioVigenteCard({
  domicilio,
  loading,
  error,
  onCreate,
  onChange,
}: DomicilioVigenteCardProps) {
  if (loading) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Skeleton width="40%" height={24} />
          <Skeleton width="80%" height={20} />
          <Skeleton width="50%" height={20} />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    const detail = isApiError(error) ? error.detail : 'Error al cargar el domicilio vigente.'
    return <Alert severity="error">{detail}</Alert>
  }

  if (!domicilio) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Sin domicilio vigente
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Este cliente todavía no tiene un domicilio registrado.
          </Typography>
        </CardContent>
        <CardActions>
          <Button variant="contained" onClick={onCreate}>
            Crear primer domicilio
          </Button>
        </CardActions>
      </Card>
    )
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Domicilio vigente
          </Typography>
          <Chip label="Vigente" color="success" size="small" />
        </Stack>
        <Typography variant="body1">{formatDomicilioLine(domicilio)}</Typography>
        {domicilio.referencias && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {domicilio.referencias}
          </Typography>
        )}
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Vigente desde {formatFechaCorta(domicilio.fecha_desde_dom)}
          </Typography>
        </Box>
      </CardContent>
      <CardActions>
        <Button onClick={onChange}>Cambiar domicilio</Button>
      </CardActions>
    </Card>
  )
}
