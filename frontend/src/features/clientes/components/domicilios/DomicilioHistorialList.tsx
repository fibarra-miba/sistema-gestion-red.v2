import {
  Alert,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import { isApiError } from '@/types/api'
import type { DomicilioOut } from '../../types'
import { formatDomicilioLine, formatFechaCorta, isVigente } from './domicilioDisplay'

interface DomicilioHistorialListProps {
  items: DomicilioOut[] | undefined
  loading?: boolean
  error?: unknown
}

export default function DomicilioHistorialList({
  items,
  loading,
  error,
}: DomicilioHistorialListProps) {
  if (loading) {
    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Skeleton width="60%" height={24} />
        <Skeleton width="90%" height={20} />
        <Skeleton width="70%" height={20} />
      </Paper>
    )
  }

  if (error) {
    const detail = isApiError(error) ? error.detail : 'Error al cargar el historial.'
    return <Alert severity="error">{detail}</Alert>
  }

  if (!items || items.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Este cliente no tiene historial de domicilios.
        </Typography>
      </Paper>
    )
  }

  const ordered = [...items].sort((a, b) => {
    return new Date(b.fecha_desde_dom).getTime() - new Date(a.fecha_desde_dom).getTime()
  })

  return (
    <Paper variant="outlined">
      <List dense disablePadding>
        {ordered.map((d, idx) => (
          <ListItem
            key={d.domicilio_id}
            divider={idx < ordered.length - 1}
            sx={{ py: 1.25 }}
          >
            <ListItemText
              primary={
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Typography variant="body2">{formatDomicilioLine(d)}</Typography>
                  {isVigente(d) && <Chip label="Vigente" color="success" size="small" />}
                </Stack>
              }
              secondary={
                <Box component="span">
                  <Typography component="span" variant="caption" color="text.secondary">
                    {formatFechaCorta(d.fecha_desde_dom)} →{' '}
                    {formatFechaCorta(d.fecha_hasta_dom)}
                  </Typography>
                  {d.referencias && (
                    <Typography
                      component="span"
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block' }}
                    >
                      {d.referencias}
                    </Typography>
                  )}
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  )
}
