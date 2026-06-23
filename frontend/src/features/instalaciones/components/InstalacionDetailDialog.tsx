import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { isApiError } from '@/types/api'
import { useAuth } from '@/features/auth'
import { useInstalacion } from '../hooks/useInstalacion'
import { useDetallesInstalacion } from '../hooks/useDetallesInstalacion'
import {
  formatDateTime,
  instalacionContratoLabel,
  instalacionDomicilioLabel,
} from '../utils'
import InstalacionEstadoChip from './InstalacionEstadoChip'
import AddDetalleForm from './AddDetalleForm'
import GarantiasSection from './GarantiasSection'
import type { DetalleInstalacionOut } from '../types'

interface Props {
  open: boolean
  instalacionId: number | undefined
  onClose: () => void
}

// Detalle + materiales. Se permite agregar materiales en cualquier
// estado — el backend valida las reglas que correspondan.
export default function InstalacionDetailDialog({
  open,
  instalacionId,
  onClose,
}: Props) {
  const { hasRole } = useAuth()
  // Garantías: solo ADMIN/OPERADOR registran/anulan (el TÉCNICO solo ve).
  const canManageGarantias = hasRole('ADMIN', 'OPERADOR')

  const active = open && instalacionId != null
  const { data: inst, isLoading, error } = useInstalacion(
    active ? instalacionId : undefined,
  )
  const {
    data: detalles,
    isLoading: loadingDetalles,
    error: errorDetalles,
  } = useDetallesInstalacion(active ? instalacionId : undefined)

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Instalación {instalacionId != null ? `#${instalacionId}` : ''}
      </DialogTitle>
      <DialogContent dividers>
        {isLoading && (
          <Stack spacing={1}>
            <Skeleton width="70%" height={32} />
            <Skeleton width="40%" />
            <Skeleton width="90%" />
            <Skeleton width="60%" />
          </Stack>
        )}

        {error && (
          <Alert severity="error">
            {isApiError(error) ? error.detail : 'Error al cargar la instalación.'}
          </Alert>
        )}

        {!isLoading && !error && inst && (
          <Stack spacing={3}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              sx={{ alignItems: { sm: 'flex-start' } }}
            >
              <Stack sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary">
                  Instalación #{inst.instalacion_id}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }} noWrap>
                  {instalacionContratoLabel(inst)}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {instalacionDomicilioLabel(inst)}
                </Typography>
              </Stack>
              <InstalacionEstadoChip estadoId={inst.estado_instalacion_id} />
            </Stack>

            <Paper variant="outlined" sx={{ p: 2 }}>
              <Box
                sx={{
                  display: 'grid',
                  gap: 2,
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, minmax(0, 1fr))',
                    md: 'repeat(3, minmax(0, 1fr))',
                  },
                }}
              >
                <DetailField
                  label="Código"
                  value={inst.codigo_instalacion ?? '—'}
                />
                <DetailField
                  label="Fecha instalación"
                  value={formatDateTime(inst.fecha_instalacion)}
                />
                <DetailField
                  label="Programación origen"
                  value={`#${inst.programacion_id}`}
                />
                <DetailField
                  label="Creación"
                  value={formatDateTime(inst.fecha_creacion_instalacion)}
                />
                <Box sx={{ gridColumn: { md: '1 / -1' } }}>
                  <DetailField
                    label="Observación"
                    value={inst.observacion_instalacion ?? '—'}
                    multiline
                  />
                </Box>
              </Box>
            </Paper>

            <Divider />

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Materiales / detalle de instalación
              </Typography>

              {errorDetalles && (
                <Alert severity="error" sx={{ mb: 1 }}>
                  {isApiError(errorDetalles)
                    ? errorDetalles.detail
                    : 'Error al cargar los materiales.'}
                </Alert>
              )}

              <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, width: 70 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: 90 }}>
                        Prod.
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Descripción</TableCell>
                      <TableCell
                        sx={{ fontWeight: 600, width: 100 }}
                        align="right"
                      >
                        Cant.
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, width: 90 }}>
                        Unidad
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loadingDetalles && (
                      <TableRow>
                        <TableCell colSpan={5}>
                          <Skeleton height={24} />
                        </TableCell>
                      </TableRow>
                    )}
                    {!loadingDetalles &&
                      (!detalles || detalles.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={5}>
                            <Box sx={{ py: 2, textAlign: 'center' }}>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Todavía no se cargaron materiales.
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      )}
                    {detalles?.map((d: DetalleInstalacionOut) => (
                      <TableRow key={d.det_instalacion_id} hover>
                        <TableCell>{d.det_instalacion_id}</TableCell>
                        <TableCell>#{d.producto_id}</TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            title={d.descripcion_dinstalacion ?? undefined}
                          >
                            {d.descripcion_dinstalacion ?? '—'}
                          </Typography>
                          {d.observacion_dinstalacion && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: 'block' }}
                            >
                              {d.observacion_dinstalacion}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {d.cantidad_dinstalacion}
                        </TableCell>
                        <TableCell>{d.unidad_dinstalacion}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </Box>

            <Divider />

            <AddDetalleForm instalacionId={inst.instalacion_id} />

            <Divider />

            <GarantiasSection
              instalacionId={inst.instalacion_id}
              detalles={detalles}
              canManage={canManageGarantias}
            />
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  )
}

function DetailField({
  label,
  value,
  multiline,
}: {
  label: string
  value: string
  multiline?: boolean
}) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block' }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 500,
          wordBreak: multiline ? 'break-word' : undefined,
        }}
        noWrap={!multiline}
        title={value}
      >
        {value}
      </Typography>
    </Box>
  )
}
