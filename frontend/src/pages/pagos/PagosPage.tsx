import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import PageHeader from '@/components/ui/PageHeader'
import ClienteSelect from '@/components/ui/ClienteSelect'
import { useSnackbar } from '@/components/ui/SnackbarProvider'
import { formatCurrencyARS } from '@/lib/format'
import { contratoDisplayName } from '@/features/contratos'
import type { ClienteOut } from '@/features/clientes'
import {
  ContratoSelect,
  CuentaCorrienteCard,
  CuentaMovimientosFilterBar,
  CuentaMovimientosList,
  GenerarLoteDialog,
  GenerarPeriodoDialog,
  PagoDetalleDialog,
  PagosContratoTable,
  PagosFilterBar,
  RegistrarPagoDialog,
  useCuentaCliente,
  useCuentaMovimientos,
  useGenerarLote,
  useGenerarPeriodo,
  usePagosContrato,
  useRegistrarMovimiento,
  type ContratoPagoListItemOut,
  type GenerarLoteOut,
  type ListCuentaMovimientosParams,
  type ListPagosContratoParams,
} from '@/features/pagos'
import type { ContractCommercialOut } from '@/features/contratos'

type TabKey = 'pagos' | 'cuenta' | 'lote'

export default function PagosPage() {
  const { showSuccess } = useSnackbar()
  const [tab, setTab] = useState<TabKey>('pagos')

  return (
    <Stack spacing={{ xs: 2, md: 2.5 }} sx={{ minWidth: 0 }}>
      <PageHeader
        title="Pagos y facturación"
        subtitle="Generación de facturas, registro de pagos y cuenta corriente."
      />

      <Paper variant="outlined" sx={{ px: { xs: 1, sm: 2 } }}>
        <Tabs
          value={tab}
          onChange={(_, v: TabKey) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab value="pagos" label="Pagos por contrato" />
          <Tab value="cuenta" label="Cuenta corriente" />
          <Tab value="lote" label="Generación masiva" />
        </Tabs>
      </Paper>

      {tab === 'pagos' && <PagosPorContratoSection showSuccess={showSuccess} />}
      {tab === 'cuenta' && <CuentaCorrienteSection />}
      {tab === 'lote' && <GeneracionMasivaSection showSuccess={showSuccess} />}
    </Stack>
  )
}

// ============================================================
// Sección: Pagos por contrato
// ============================================================

interface SectionProps {
  showSuccess: (msg: string) => void
}

function PagosPorContratoSection({ showSuccess }: SectionProps) {
  const [contrato, setContrato] = useState<ContractCommercialOut | null>(null)
  const [filters, setFilters] = useState<ListPagosContratoParams>({})

  const params = useMemo(() => filters, [filters])
  const contratoId = contrato?.contrato_id

  const pagosQuery = usePagosContrato(contratoId, params)

  const generarMutation = useGenerarPeriodo()
  const registrarMutation = useRegistrarMovimiento()

  const [generarOpen, setGenerarOpen] = useState(false)
  const [detalleId, setDetalleId] = useState<number | null>(null)
  const [registrarTarget, setRegistrarTarget] =
    useState<ContratoPagoListItemOut | null>(null)

  const handleGenerar = async (
    payload: Parameters<typeof generarMutation.mutateAsync>[0]['payload'],
  ) => {
    if (contratoId == null) return
    await generarMutation.mutateAsync({ contratoId, payload })
    setGenerarOpen(false)
    generarMutation.reset()
    showSuccess('Período generado.')
  }

  const handleRegistrar = async (
    pagoId: number,
    payload: Parameters<typeof registrarMutation.mutateAsync>[0]['payload'],
  ) => {
    await registrarMutation.mutateAsync({ pagoId, payload })
    setRegistrarTarget(null)
    registrarMutation.reset()
    showSuccess('Pago registrado.')
  }

  const closeGenerar = () => {
    if (generarMutation.isPending) return
    setGenerarOpen(false)
    generarMutation.reset()
  }

  const closeRegistrar = () => {
    if (registrarMutation.isPending) return
    setRegistrarTarget(null)
    registrarMutation.reset()
  }

  const registrarFromDetalle = (pagoId: number) => {
    const row = pagosQuery.data?.find((p) => p.pago_id === pagoId)
    if (row) {
      setDetalleId(null)
      setRegistrarTarget(row)
    }
  }

  return (
    <Stack spacing={{ xs: 2, md: 2.5 }} sx={{ minWidth: 0 }}>
      <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ alignItems: { md: 'center' } }}
        >
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <ContratoSelect
              value={contrato?.contrato_id ?? null}
              onChange={(_id, c) => setContrato(c)}
            />
          </Box>
          <Stack direction="row" spacing={1}>
            <Tooltip title="Refrescar">
              <span>
                <IconButton
                  onClick={() => pagosQuery.refetch()}
                  disabled={!contratoId || pagosQuery.isFetching}
                  aria-label="refrescar pagos"
                >
                  <RefreshIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              disabled={!contratoId}
              onClick={() => setGenerarOpen(true)}
            >
              Generar período
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {!contratoId ? (
        <Alert severity="info">
          Elegí un contrato para ver sus pagos.
        </Alert>
      ) : (
        <>
          <PagosFilterBar value={filters} onChange={setFilters} />

          <PagosContratoTable
            rows={pagosQuery.data}
            loading={pagosQuery.isLoading}
            error={pagosQuery.error}
            onAction={(kind, row) => {
              if (kind === 'view') setDetalleId(row.pago_id)
              else if (kind === 'registrar') setRegistrarTarget(row)
            }}
          />
        </>
      )}

      <GenerarPeriodoDialog
        open={generarOpen}
        contratoLabel={contrato ? contratoDisplayName(contrato) : null}
        loading={generarMutation.isPending}
        error={generarMutation.error}
        onConfirm={handleGenerar}
        onCancel={closeGenerar}
      />

      <PagoDetalleDialog
        open={detalleId != null}
        pagoId={detalleId}
        onClose={() => setDetalleId(null)}
        onRegistrar={registrarFromDetalle}
      />

      <RegistrarPagoDialog
        open={registrarTarget != null}
        pagoId={registrarTarget?.pago_id ?? null}
        saldoPendiente={registrarTarget?.saldo_pendiente ?? null}
        totalFactura={registrarTarget?.total_factura ?? null}
        periodoLabel={
          registrarTarget
            ? `${String(registrarTarget.periodo_mes_pago).padStart(2, '0')}/${registrarTarget.periodo_anio_pago}`
            : null
        }
        loading={registrarMutation.isPending}
        error={registrarMutation.error}
        onConfirm={handleRegistrar}
        onCancel={closeRegistrar}
      />
    </Stack>
  )
}

// ============================================================
// Sección: Cuenta corriente
// ============================================================

function CuentaCorrienteSection() {
  const [cliente, setCliente] = useState<ClienteOut | null>(null)
  const [filters, setFilters] = useState<ListCuentaMovimientosParams>({})

  const clienteId = cliente?.cliente_id
  const cuentaQuery = useCuentaCliente(clienteId)
  const movimientosQuery = useCuentaMovimientos(clienteId, filters)

  return (
    <Stack spacing={{ xs: 2, md: 2.5 }} sx={{ minWidth: 0 }}>
      <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ alignItems: { md: 'center' } }}
        >
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <ClienteSelect
              value={cliente?.cliente_id ?? null}
              onChange={(_id, c) => setCliente(c)}
            />
          </Box>
          <Tooltip title="Refrescar">
            <span>
              <IconButton
                onClick={() => {
                  cuentaQuery.refetch()
                  movimientosQuery.refetch()
                }}
                disabled={!clienteId || movimientosQuery.isFetching}
                aria-label="refrescar cuenta"
              >
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Paper>

      {!clienteId ? (
        <Alert severity="info">Elegí un cliente para ver su cuenta corriente.</Alert>
      ) : (
        <>
          <CuentaCorrienteCard
            data={cuentaQuery.data}
            loading={cuentaQuery.isLoading}
            error={cuentaQuery.error}
          />

          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              Movimientos
            </Typography>
            <Stack spacing={1.5}>
              <CuentaMovimientosFilterBar value={filters} onChange={setFilters} />
              <CuentaMovimientosList
                rows={movimientosQuery.data?.movimientos}
                loading={movimientosQuery.isLoading}
                error={movimientosQuery.error}
              />
              {movimientosQuery.data?.saldo_cuenta != null && (
                <Typography variant="caption" color="text.secondary">
                  Saldo actual de la cuenta:{' '}
                  <strong>{formatCurrencyARS(movimientosQuery.data.saldo_cuenta)}</strong>
                </Typography>
              )}
            </Stack>
          </Box>
        </>
      )}
    </Stack>
  )
}

// ============================================================
// Sección: Generación masiva
// ============================================================

function GeneracionMasivaSection({ showSuccess }: SectionProps) {
  const loteMutation = useGenerarLote()
  const [open, setOpen] = useState(false)
  const [lastResult, setLastResult] = useState<GenerarLoteOut | null>(null)

  const handleConfirm = async (
    payload: Parameters<typeof loteMutation.mutateAsync>[0],
  ) => {
    const result = await loteMutation.mutateAsync(payload)
    setLastResult(result)
    showSuccess(
      `Lote procesado: ${result.creados} creados, ${result.omitidos_existentes} omitidos, ${result.errores.length} errores.`,
    )
  }

  const handleClose = () => {
    if (loteMutation.isPending) return
    setOpen(false)
    loteMutation.reset()
  }

  return (
    <Stack spacing={{ xs: 2, md: 2.5 }} sx={{ minWidth: 0 }}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Generar facturas del período para todos los contratos cobrables
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Procesa los contratos en estado ACTIVO / SUSPENDIDO que no tengan
              pago para el período. Omitidos: ya facturados. Errores: se
              informan por contrato sin abortar el lote.
            </Typography>
          </Box>
          <Box>
            <Button
              variant="contained"
              startIcon={<PlayArrowIcon />}
              onClick={() => {
                setLastResult(null)
                setOpen(true)
              }}
            >
              Iniciar generación masiva
            </Button>
          </Box>
        </Stack>
      </Paper>

      {lastResult && !open && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            Último resultado
          </Typography>
          <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Creados
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {lastResult.creados}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Omitidos (ya existentes)
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {lastResult.omitidos_existentes}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Errores
              </Typography>
              <Typography
                variant="h5"
                sx={{ fontWeight: 700 }}
                color={lastResult.errores.length > 0 ? 'error.main' : 'text.primary'}
              >
                {lastResult.errores.length}
              </Typography>
            </Box>
          </Stack>
        </Paper>
      )}

      <GenerarLoteDialog
        open={open}
        loading={loteMutation.isPending}
        error={loteMutation.error}
        result={lastResult}
        onConfirm={handleConfirm}
        onClose={handleClose}
      />
    </Stack>
  )
}
