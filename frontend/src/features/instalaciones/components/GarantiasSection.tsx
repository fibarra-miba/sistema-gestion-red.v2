import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
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
import BlockIcon from '@mui/icons-material/Block'
import EditIcon from '@mui/icons-material/Edit'
import { isApiError } from '@/types/api'
import { formatCurrencyARS } from '@/lib/format'
import { useGarantias } from '../hooks/useGarantias'
import { formatDateTime } from '../utils'
import GarantiaEstadoChip, { ESTADO_GARANTIA } from './GarantiaEstadoChip'
import RegistrarGarantiaDialog from './RegistrarGarantiaDialog'
import AnularGarantiaDialog from './AnularGarantiaDialog'
import EditarGarantiaDialog from './EditarGarantiaDialog'
import type { DetalleInstalacionOut, GarantiaOut } from '../types'

interface Props {
  instalacionId: number
  detalles: DetalleInstalacionOut[] | undefined
  // Solo ADMIN/OPERADOR pueden registrar/anular (el TÉCNICO solo ve).
  canManage: boolean
}

export default function GarantiasSection({ instalacionId, detalles, canManage }: Props) {
  const { data: garantias, isLoading, error } = useGarantias(instalacionId)

  const [registrarOpen, setRegistrarOpen] = useState(false)
  const [anulando, setAnulando] = useState<GarantiaOut | null>(null)
  const [editando, setEditando] = useState<GarantiaOut | null>(null)

  // Equipos elegibles: productos instalados que NO tienen garantía activa.
  // El select además filtra por tipo EQUIPO. El backend revalida todo.
  const allowedProductoIds = useMemo(() => {
    const conActiva = new Set(
      (garantias ?? [])
        .filter((g) => g.estado_garantia_id === ESTADO_GARANTIA.ACTIVA)
        .map((g) => g.producto_id),
    )
    const ids = (detalles ?? [])
      .map((d) => d.producto_id)
      .filter((id) => !conActiva.has(id))
    return Array.from(new Set(ids))
  }, [garantias, detalles])

  return (
    <Box>
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          Garantías
        </Typography>
        {canManage && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setRegistrarOpen(true)}
          >
            Registrar garantía
          </Button>
        )}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {isApiError(error) ? error.detail : 'Error al cargar las garantías.'}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Equipo</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 110 }}>Estado</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 120 }}>Monto</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 150 }}>Inicio / Fin</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Motivo / Resolución</TableCell>
              {canManage && <TableCell sx={{ width: 88 }} />}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={canManage ? 6 : 5}>
                  <Skeleton height={24} />
                </TableCell>
              </TableRow>
            )}

            {!isLoading && (!garantias || garantias.length === 0) && (
              <TableRow>
                <TableCell colSpan={canManage ? 6 : 5}>
                  <Box sx={{ py: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Esta instalación no tiene garantías registradas.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}

            {garantias?.map((g) => {
              const esActiva = g.estado_garantia_id === ESTADO_GARANTIA.ACTIVA
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
                  <TableCell>
                    <GarantiaEstadoChip
                      estadoId={g.estado_garantia_id}
                      descripcion={g.descripcion_egarantia}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatCurrencyARS(g.monto_garantia)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ display: 'block' }}>
                      {formatDateTime(g.fecha_inicio_garantia)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {g.fecha_fin_garantia ? formatDateTime(g.fecha_fin_garantia) : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" title={g.motivo_garantia ?? undefined}>
                      {g.motivo_garantia ?? '—'}
                    </Typography>
                    {g.resolucion_garantia && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block' }}
                      >
                        {g.resolucion_garantia}
                      </Typography>
                    )}
                  </TableCell>
                  {canManage && (
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="Editar garantía">
                        <IconButton size="small" onClick={() => setEditando(g)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={esActiva ? 'Anular garantía' : 'Sólo ACTIVA se puede anular'}>
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            disabled={!esActiva}
                            onClick={() => setAnulando(g)}
                          >
                            <BlockIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  )}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Paper>

      {canManage && (
        <>
          <RegistrarGarantiaDialog
            open={registrarOpen}
            instalacionId={instalacionId}
            allowedProductoIds={allowedProductoIds}
            onClose={() => setRegistrarOpen(false)}
          />
          <AnularGarantiaDialog garantia={anulando} onClose={() => setAnulando(null)} />
          <EditarGarantiaDialog garantia={editando} onClose={() => setEditando(null)} />
        </>
      )}
    </Box>
  )
}
