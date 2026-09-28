import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  IconButton,
  MenuItem,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import ClearIcon from '@mui/icons-material/Clear'
import EditIcon from '@mui/icons-material/Edit'
import BlockIcon from '@mui/icons-material/Block'
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined'
import AssignmentReturnedOutlinedIcon from '@mui/icons-material/AssignmentReturnedOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import PageHeader from '@/components/ui/PageHeader'
import FilterBar from '@/components/ui/FilterBar'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import ClienteSelect from '@/components/ui/ClienteSelect'
import KpiCard from '@/components/ui/KpiCard'
import { formatCurrencyARS } from '@/lib/format'
import { useAuth } from '@/features/auth'
import { useEstadosGarantia } from '@/features/catalogos'
import {
  ESTADO_GARANTIA,
  GarantiaEstadoChip,
  InstalacionDetailDialog,
  depositosActivosLabel,
  formatDateTime,
  useGarantiasList,
  useResumenGarantias,
  type GarantiaOut,
  type ListGarantiasParams,
} from '@/features/instalaciones'
import AnularGarantiaDialog from '@/features/instalaciones/components/AnularGarantiaDialog'
import EditarGarantiaDialog from '@/features/instalaciones/components/EditarGarantiaDialog'

function garantiaClienteLabel(g: GarantiaOut): string {
  const nombre = [g.cliente_apellido, g.cliente_nombre].filter(Boolean).join(', ')
  return nombre || `Contrato #${g.contrato_id}`
}

export default function GarantiasPage() {
  const { hasRole } = useAuth()
  const canManage = hasRole('ADMIN', 'OPERADOR')

  const [filters, setFilters] = useState<ListGarantiasParams>({})
  const params = useMemo(() => filters, [filters])

  const { data: garantias, isLoading, error } = useGarantiasList(params)
  const { data: resumen, isLoading: loadingResumen, isError: errorResumen } =
    useResumenGarantias()
  const { data: estados } = useEstadosGarantia()

  const [detailInstalacionId, setDetailInstalacionId] = useState<number | null>(null)
  const [anulando, setAnulando] = useState<GarantiaOut | null>(null)
  const [editando, setEditando] = useState<GarantiaOut | null>(null)

  const hasFilters = filters.cliente_id != null || filters.estado_garantia_id != null

  const columns: DataTableColumn<GarantiaOut>[] = [
    {
      key: 'cliente',
      label: 'Cliente',
      render: (g) => (
        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap title={garantiaClienteLabel(g)}>
          {garantiaClienteLabel(g)}
        </Typography>
      ),
    },
    {
      key: 'equipo',
      label: 'Equipo',
      showFrom: 'md',
      render: (g) => (
        <Stack sx={{ minWidth: 0 }}>
          <Typography variant="body2" noWrap>
            {g.nombre_producto ?? `#${g.producto_id}`}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {g.marca_producto} {g.modelo_producto}
          </Typography>
        </Stack>
      ),
    },
    {
      key: 'monto',
      label: 'Monto',
      width: 130,
      render: (g) => (
        <Typography variant="body2">{formatCurrencyARS(g.monto_garantia)}</Typography>
      ),
    },
    {
      key: 'estado',
      label: 'Estado',
      width: 120,
      render: (g) => (
        <GarantiaEstadoChip estadoId={g.estado_garantia_id} descripcion={g.descripcion_egarantia} />
      ),
    },
    {
      key: 'fechas',
      label: 'Inicio / Fin',
      width: 170,
      showFrom: 'lg',
      render: (g) => (
        <Stack>
          <Typography variant="caption" sx={{ display: 'block' }}>
            {formatDateTime(g.fecha_inicio_garantia)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {g.fecha_fin_garantia ? formatDateTime(g.fecha_fin_garantia) : '—'}
          </Typography>
        </Stack>
      ),
    },
    ...(canManage
      ? [
          {
            key: 'acciones',
            label: '',
            width: 88,
            align: 'right' as const,
            render: (g: GarantiaOut) => {
              const esActiva = g.estado_garantia_id === ESTADO_GARANTIA.ACTIVA
              return (
                <Stack
                  direction="row"
                  spacing={0.25}
                  sx={{ justifyContent: 'flex-end' }}
                  onClick={(e) => e.stopPropagation()}
                >
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
                </Stack>
              )
            },
          },
        ]
      : []),
  ]

  return (
    <Stack spacing={{ xs: 2, md: 2.5 }} sx={{ minWidth: 0 }}>
      <PageHeader
        title="Garantías"
        subtitle="Depósitos reembolsables entregados a cambio del equipo instalado."
      />

      {errorResumen ? (
        <Alert severity="error">No se pudo cargar el resumen de depósitos.</Alert>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
          }}
        >
          {loadingResumen ? (
            <>
              <Skeleton variant="rounded" height={96} />
              <Skeleton variant="rounded" height={96} />
              <Skeleton variant="rounded" height={96} />
            </>
          ) : (
            <>
              <KpiCard
                label="Comprometido"
                value={formatCurrencyARS(resumen?.comprometido ?? 0)}
                hint={depositosActivosLabel(resumen?.cantidad_activas ?? 0)}
                color="info"
                icon={<SavingsOutlinedIcon fontSize="small" />}
              />
              <KpiCard
                label="Devuelto"
                value={formatCurrencyARS(resumen?.devuelto ?? 0)}
                color="success"
                icon={<AssignmentReturnedOutlinedIcon fontSize="small" />}
              />
              <KpiCard
                label="Retenido"
                value={formatCurrencyARS(resumen?.retenido ?? 0)}
                color="warning"
                icon={<LockOutlinedIcon fontSize="small" />}
              />
            </>
          )}
        </Box>
      )}

      <FilterBar
        actions={
          <Button
            variant="text"
            size="small"
            startIcon={<ClearIcon />}
            onClick={() => setFilters({})}
            disabled={!hasFilters}
          >
            Limpiar filtros
          </Button>
        }
      >
        <Box
          sx={{
            display: 'grid',
            gap: { xs: 1.5, sm: 2 },
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
            alignItems: 'start',
          }}
        >
          <ClienteSelect
            size="small"
            value={filters.cliente_id ?? null}
            onChange={(clienteId) =>
              setFilters((prev) => ({ ...prev, cliente_id: clienteId ?? undefined }))
            }
          />
          <TextField
            select
            size="small"
            label="Estado"
            value={filters.estado_garantia_id ?? ''}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                estado_garantia_id: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
          >
            <MenuItem value="">Todos</MenuItem>
            {(estados ?? []).map((estado) => (
              <MenuItem key={estado.id} value={estado.id}>
                {estado.descripcion}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </FilterBar>

      <DataTable<GarantiaOut>
        columns={columns}
        rows={garantias}
        loading={isLoading}
        error={error}
        getRowKey={(g) => g.garantia_id}
        onRowClick={(g) => setDetailInstalacionId(g.instalacion_id)}
        emptyMessage="No hay depósitos de garantía registrados."
      />

      <InstalacionDetailDialog
        open={detailInstalacionId != null}
        instalacionId={detailInstalacionId ?? undefined}
        onClose={() => setDetailInstalacionId(null)}
      />

      {canManage && (
        <>
          <AnularGarantiaDialog garantia={anulando} onClose={() => setAnulando(null)} />
          <EditarGarantiaDialog garantia={editando} onClose={() => setEditando(null)} />
        </>
      )}
    </Stack>
  )
}
