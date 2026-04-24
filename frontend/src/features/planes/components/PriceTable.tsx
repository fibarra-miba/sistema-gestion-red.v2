import {
  Alert,
  Chip,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import { isApiError } from '@/types/api'
import { formatCurrencyARS, formatDate } from '@/lib/format'
import type { PrecioPlanOut } from '../types'
import { getPrecioEstado, type PrecioEstado } from '../utils'

interface PriceTableProps {
  items: PrecioPlanOut[] | undefined
  loading?: boolean
  error?: unknown
  onEdit?: (precio: PrecioPlanOut) => void
}

export default function PriceTable({
  items,
  loading,
  error,
  onEdit,
}: PriceTableProps) {
  if (loading) {
    return (
      <Stack spacing={1}>
        <Skeleton width="100%" height={32} />
        <Skeleton width="100%" height={28} />
        <Skeleton width="100%" height={28} />
      </Stack>
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
          Este plan no tiene precios cargados.
        </Typography>
      </Paper>
    )
  }

  const ordered = [...items].sort(
    (a, b) =>
      new Date(b.fecha_desde_pplanes).getTime() -
      new Date(a.fecha_desde_pplanes).getTime(),
  )

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>Precio</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Desde</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Hasta</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
            <TableCell sx={{ fontWeight: 600, width: 56 }} align="right" />
          </TableRow>
        </TableHead>
        <TableBody>
          {ordered.map((p) => {
            const estado = getPrecioEstado(p)
            const editable = estado === 'futuro'
            return (
              <TableRow key={p.precios_planes_id}>
                <TableCell>{formatCurrencyARS(p.precio_mensual_pplanes)}</TableCell>
                <TableCell>{formatDate(p.fecha_desde_pplanes)}</TableCell>
                <TableCell>{formatDate(p.fecha_hasta_pplanes)}</TableCell>
                <TableCell>
                  <PrecioEstadoChip estado={estado} />
                </TableCell>
                <TableCell align="right">
                  {onEdit && (
                    <Tooltip
                      title={
                        editable
                          ? 'Editar precio futuro'
                          : 'Solo se pueden editar precios aún no vigentes'
                      }
                    >
                      <span>
                        <IconButton
                          size="small"
                          disabled={!editable}
                          onClick={() => onEdit(p)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

function PrecioEstadoChip({ estado }: { estado: PrecioEstado }) {
  switch (estado) {
    case 'vigente':
      return <Chip label="Vigente" color="success" size="small" />
    case 'futuro':
      return <Chip label="Futuro" color="info" size="small" variant="outlined" />
    case 'historico':
    default:
      return <Chip label="Histórico" size="small" variant="outlined" />
  }
}
