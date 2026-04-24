import { useMemo, useState } from 'react'
import { Badge, Button, IconButton, Stack, Tooltip } from '@mui/material'
import EventIcon from '@mui/icons-material/Event'
import RefreshIcon from '@mui/icons-material/Refresh'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import PageHeader from '@/components/ui/PageHeader'
import { useSnackbar } from '@/components/ui/SnackbarProvider'
import {
  ESTADO_PROGRAMACION,
  InstalacionDetailDialog,
  instalacionContratoLabel,
  useEjecutarProgramacion,
  useInstalacionActions,
  useInstalaciones,
  useProgramaciones,
  useReintentarInstalacion,
  useReprogramar,
  type EjecutarProgramacionIn,
  type InstalacionOut,
  type ListInstalacionesParams,
  type ProgramacionInstalacionOut,
  type ReintentarInstalacionIn,
  type ReprogramarInstalacionIn,
} from '@/features/instalaciones'
import InstalacionesFilterBar from '@/features/instalaciones/components/InstalacionesFilterBar'
import InstalacionesTable, {
  type InstalacionActionKind,
} from '@/features/instalaciones/components/InstalacionesTable'
import ProgramacionesDrawer, {
  type ProgramacionActionKind,
} from '@/features/instalaciones/components/ProgramacionesDrawer'
import ReprogramarDialog from '@/features/instalaciones/components/ReprogramarDialog'
import CrearInstalacionDialog from '@/features/instalaciones/components/CrearInstalacionDialog'
import ReintentarDialog from '@/features/instalaciones/components/ReintentarDialog'

type ConfirmKind = 'completar' | 'cancelar' | 'fallar' | 'darBaja'

export default function InstalacionesPage() {
  const { showSuccess } = useSnackbar()

  // ---- Filtros ----
  const [filters, setFilters] = useState<ListInstalacionesParams>({})
  const params = useMemo(() => filters, [filters])
  const { data, isLoading, isFetching, error, refetch } =
    useInstalaciones(params)

  // Conteo discreto de programaciones pendientes para el CTA del header.
  const { data: pendientes } = useProgramaciones({
    estado_programacion_id: ESTADO_PROGRAMACION.PROGRAMADA,
  })
  const pendientesCount = pendientes?.length ?? 0

  // ---- Mutations ----
  const actions = useInstalacionActions()
  const reintentarMutation = useReintentarInstalacion()
  const reprogramarMutation = useReprogramar()
  const ejecutarMutation = useEjecutarProgramacion()

  // ---- Dialog state ----
  const [detailId, setDetailId] = useState<number | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const [confirmTarget, setConfirmTarget] = useState<{
    kind: ConfirmKind
    instalacion: InstalacionOut
  } | null>(null)

  const [reintentarTarget, setReintentarTarget] =
    useState<InstalacionOut | null>(null)

  const [reprogramarTarget, setReprogramarTarget] =
    useState<ProgramacionInstalacionOut | null>(null)

  const [ejecutarTarget, setEjecutarTarget] =
    useState<ProgramacionInstalacionOut | null>(null)

  // ---- Handlers: tabla de instalaciones ----
  const handleAction = (
    action: InstalacionActionKind,
    instalacion: InstalacionOut,
  ) => {
    switch (action) {
      case 'view':
        setDetailId(instalacion.instalacion_id)
        return
      case 'reintentar':
        setReintentarTarget(instalacion)
        return
      case 'completar':
      case 'cancelar':
      case 'fallar':
      case 'darBaja':
        setConfirmTarget({ kind: action, instalacion })
        return
    }
  }

  const runConfirmed = async () => {
    if (!confirmTarget) return
    const { kind, instalacion } = confirmTarget
    const mutation = actions[kind]
    try {
      await mutation.mutateAsync(instalacion.instalacion_id)
      setConfirmTarget(null)
      mutation.reset()
      showSuccess(successMessageFor(kind))
    } catch {
      // error queda en mutation.error y se muestra en el dialog.
    }
  }

  const closeConfirm = () => {
    if (confirmTarget) {
      const m = actions[confirmTarget.kind]
      if (m.isPending) return
      m.reset()
    }
    setConfirmTarget(null)
  }

  // ---- Handlers: reintentar ----
  const handleReintentar = async (payload: ReintentarInstalacionIn) => {
    if (!reintentarTarget) return
    await reintentarMutation.mutateAsync({
      instalacionId: reintentarTarget.instalacion_id,
      payload,
    })
    setReintentarTarget(null)
    reintentarMutation.reset()
    showSuccess('Nueva programación creada.')
    // Abrimos el drawer para que el usuario vea la nueva programación.
    setDrawerOpen(true)
  }

  const closeReintentar = () => {
    if (reintentarMutation.isPending) return
    setReintentarTarget(null)
    reintentarMutation.reset()
  }

  // ---- Handlers: drawer de programaciones ----
  const handleProgramacionAction = (
    action: ProgramacionActionKind,
    programacion: ProgramacionInstalacionOut,
  ) => {
    if (action === 'reprogramar') setReprogramarTarget(programacion)
    if (action === 'ejecutar') setEjecutarTarget(programacion)
  }

  const handleReprogramar = async (payload: ReprogramarInstalacionIn) => {
    if (!reprogramarTarget) return
    await reprogramarMutation.mutateAsync({
      programacionId: reprogramarTarget.programacion_id,
      payload,
    })
    setReprogramarTarget(null)
    reprogramarMutation.reset()
    showSuccess('Programación reprogramada.')
  }

  const closeReprogramar = () => {
    if (reprogramarMutation.isPending) return
    setReprogramarTarget(null)
    reprogramarMutation.reset()
  }

  const handleEjecutar = async (payload: EjecutarProgramacionIn) => {
    if (!ejecutarTarget) return
    await ejecutarMutation.mutateAsync({
      programacionId: ejecutarTarget.programacion_id,
      payload,
    })
    setEjecutarTarget(null)
    ejecutarMutation.reset()
    showSuccess('Instalación creada — programación completada.')
  }

  const closeEjecutar = () => {
    if (ejecutarMutation.isPending) return
    setEjecutarTarget(null)
    ejecutarMutation.reset()
  }

  // ---- Confirm dialog props ----
  const confirmProps = confirmTarget
    ? confirmDialogProps(confirmTarget.kind, confirmTarget.instalacion)
    : null
  const confirmMutation = confirmTarget ? actions[confirmTarget.kind] : null

  return (
    <Stack spacing={{ xs: 2, md: 2.5 }} sx={{ minWidth: 0 }}>
      <PageHeader
        title="Instalaciones"
        actions={
          <>
            <Tooltip title="Refrescar lista">
              <span>
                <IconButton
                  onClick={() => refetch()}
                  disabled={isFetching}
                  aria-label="refrescar instalaciones"
                >
                  <RefreshIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Button
              variant="outlined"
              startIcon={
                <Badge
                  color="warning"
                  badgeContent={pendientesCount}
                  max={99}
                  showZero={false}
                >
                  <EventIcon />
                </Badge>
              }
              onClick={() => setDrawerOpen(true)}
            >
              Programaciones
            </Button>
          </>
        }
      />

      <InstalacionesFilterBar value={filters} onChange={setFilters} />

      <InstalacionesTable
        rows={data}
        loading={isLoading}
        error={error}
        onAction={handleAction}
      />

      {/* Detalle + materiales */}
      <InstalacionDetailDialog
        open={detailId != null}
        instalacionId={detailId ?? undefined}
        onClose={() => setDetailId(null)}
      />

      {/* Drawer: programaciones (pendientes) */}
      <ProgramacionesDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onAction={handleProgramacionAction}
      />

      {/* Reintentar: abre desde tabla de instalaciones */}
      <ReintentarDialog
        open={reintentarTarget != null}
        instalacion={reintentarTarget}
        loading={reintentarMutation.isPending}
        error={reintentarMutation.error}
        onConfirm={handleReintentar}
        onCancel={closeReintentar}
      />

      {/* Reprogramar: abre desde drawer */}
      <ReprogramarDialog
        open={reprogramarTarget != null}
        programacion={reprogramarTarget}
        loading={reprogramarMutation.isPending}
        error={reprogramarMutation.error}
        onConfirm={handleReprogramar}
        onCancel={closeReprogramar}
      />

      {/* Ejecutar programación → crea instalación */}
      <CrearInstalacionDialog
        open={ejecutarTarget != null}
        programacion={ejecutarTarget}
        loading={ejecutarMutation.isPending}
        error={ejecutarMutation.error}
        onConfirm={handleEjecutar}
        onCancel={closeEjecutar}
      />

      {/* Confirmación: completar / cancelar / fallar / dar de baja */}
      <ConfirmDialog
        open={confirmTarget != null}
        title={confirmProps?.title ?? ''}
        description={confirmProps?.description}
        confirmLabel={confirmProps?.confirmLabel}
        confirmColor={confirmProps?.confirmColor}
        loading={confirmMutation?.isPending}
        error={confirmMutation?.error}
        onConfirm={runConfirmed}
        onCancel={closeConfirm}
      />
    </Stack>
  )
}

// ----------------------------------------------------------

function successMessageFor(kind: ConfirmKind): string {
  switch (kind) {
    case 'completar':
      return 'Instalación completada — contrato activado.'
    case 'cancelar':
      return 'Instalación cancelada.'
    case 'fallar':
      return 'Instalación marcada como fallida.'
    case 'darBaja':
      return 'Instalación dada de baja — contrato en pendiente de instalación.'
  }
}

function confirmDialogProps(
  kind: ConfirmKind,
  i: InstalacionOut,
): {
  title: string
  description: string
  confirmLabel: string
  confirmColor: 'primary' | 'error' | 'warning'
} {
  const contrato = instalacionContratoLabel(i)
  switch (kind) {
    case 'completar':
      return {
        title: `Completar instalación #${i.instalacion_id}`,
        description: `La instalación de ${contrato} pasará a COMPLETADA y el contrato quedará ACTIVO. Asegurate de que la instalación fue realizada correctamente antes de confirmar.`,
        confirmLabel: 'Completar',
        confirmColor: 'primary',
      }
    case 'cancelar':
      return {
        title: `Cancelar instalación #${i.instalacion_id}`,
        description: `Se cancelará la instalación de ${contrato}. Vas a poder reintentar más adelante creando una nueva programación.`,
        confirmLabel: 'Cancelar instalación',
        confirmColor: 'error',
      }
    case 'fallar':
      return {
        title: `Marcar como fallida la instalación #${i.instalacion_id}`,
        description: `La instalación de ${contrato} pasará a FALLIDA. Vas a poder reintentar más adelante creando una nueva programación.`,
        confirmLabel: 'Marcar como fallida',
        confirmColor: 'warning',
      }
    case 'darBaja':
      return {
        title: `Dar de baja la instalación #${i.instalacion_id}`,
        description: `La instalación de ${contrato} se dará de baja y el contrato volverá al estado PENDIENTE DE INSTALACIÓN para que puedas programar una nueva. Sólo usar si hay que rehacer la instalación completa.`,
        confirmLabel: 'Dar de baja',
        confirmColor: 'error',
      }
  }
}
