import { useState } from 'react'
import {
  Alert,
  Box,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { Link as RouterLink } from 'react-router-dom'
import { isApiError } from '@/types/api'
import { formatCurrencyARS, formatDate } from '@/lib/format'
import { useGarantiasCliente } from '../hooks/useGarantiasCliente'
import { cobroGarantiaLabel } from '../utils'
import GarantiaEstadoChip, { ESTADO_GARANTIA } from './GarantiaEstadoChip'
import GarantiaCobrosDialog from './GarantiaCobrosDialog'
import RegistrarCobroGarantiaDialog from './RegistrarCobroGarantiaDialog'
import ReciboGarantiaDialog from './ReciboGarantiaDialog'
import type { ReciboGarantiaOut } from '../types'

interface Props {
  clienteId: number
  canCobrar: boolean
}

// Sección "Garantías" de la ficha del cliente: deuda de depósitos y cobro por garantía.
export default function GarantiasClienteSection({ clienteId, canCobrar }: Props) {
  const { data: garantias, isLoading, error } = useGarantiasCliente(clienteId)
  const [cobrosId, setCobrosId] = useState<number | null>(null)
  const [cobrarId, setCobrarId] = useState<number | null>(null)
  const [recibo, setRecibo] = useState<ReciboGarantiaOut | null>(null)

  const cobrosGarantia = garantias?.find((g) => g.garantia_id === cobrosId) ?? null
  const cobrarGarantia = garantias?.find((g) => g.garantia_id === cobrarId) ?? null

  const deuda = (garantias ?? [])
    .filter((g) => g.estado_garantia_id !== ESTADO_GARANTIA.ANULADA)
    .reduce((acc, g) => acc + (g.saldo_pendiente_cobro ?? 0), 0)

  return (
    <Box>
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap' }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Garantías
        </Typography>
        {!isLoading && !error && (garantias?.length ?? 0) > 0 && (
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, color: deuda > 0 ? 'warning.main' : 'text.secondary' }}
          >
            {deuda > 0
              ? `Deuda de garantías: ${formatCurrencyARS(deuda)}`
              : 'Sin deuda de garantías'}
          </Typography>
        )}
      </Stack>

      {error && (
        <Alert severity="error">
          {isApiError(error) ? error.detail : 'Error al cargar las garantías.'}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
        {isLoading && (
          <Box sx={{ p: 2 }}>
            <Skeleton height={28} />
            <Skeleton height={28} />
          </Box>
        )}
        {!isLoading && !error && (garantias?.length ?? 0) === 0 && (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Este cliente no tiene garantías registradas.
            </Typography>
          </Box>
        )}
        {(garantias?.length ?? 0) > 0 && (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Equipo</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Monto</TableCell>
                  <TableCell sx={{ fontWeight: 600, display: { xs: 'none', md: 'table-cell' } }}>
                    Cobrado
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Cobro</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 600, display: { xs: 'none', md: 'table-cell' } }}>
                    Inicio
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {garantias?.map((g) => {
                  const puedeCobrar =
                    canCobrar &&
                    g.estado_garantia_id !== ESTADO_GARANTIA.ANULADA &&
                    (g.saldo_pendiente_cobro ?? 0) > 0
                  return (
                    <TableRow key={g.garantia_id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {g.nombre_producto ?? `#${g.producto_id}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {g.marca_producto} {g.modelo_producto}
                        </Typography>
                      </TableCell>
                      <TableCell>{formatCurrencyARS(g.monto_garantia)}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        {formatCurrencyARS(g.total_cobrado)}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">{cobroGarantiaLabel(g).text}</Typography>
                      </TableCell>
                      <TableCell>
                        <GarantiaEstadoChip
                          estadoId={g.estado_garantia_id}
                          descripcion={g.descripcion_egarantia}
                        />
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        {formatDate(g.fecha_inicio_garantia)}
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        {puedeCobrar && (
                          <Tooltip title="Registrar cobro">
                            <IconButton size="small" onClick={() => setCobrarId(g.garantia_id)}>
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Cobros y recibos">
                          <IconButton size="small" onClick={() => setCobrosId(g.garantia_id)}>
                            <PaymentsOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Ver detalle">
                          <IconButton
                            size="small"
                            component={RouterLink}
                            to={`/garantias/${g.garantia_id}`}
                          >
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>

      <GarantiaCobrosDialog
        garantia={cobrosGarantia}
        canCobrar={canCobrar}
        onClose={() => setCobrosId(null)}
      />
      <RegistrarCobroGarantiaDialog
        garantia={cobrarGarantia}
        onEmitido={setRecibo}
        onClose={() => setCobrarId(null)}
      />
      <ReciboGarantiaDialog recibo={recibo} onClose={() => setRecibo(null)} />
    </Box>
  )
}

