import { useMemo, useState } from 'react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Tooltip,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import PageHeader from '@/components/ui/PageHeader'
import { useSnackbar } from '@/components/ui/SnackbarProvider'
import type { ClienteOut } from '@/features/clientes'
import {
  useContratos,
  useCreateContrato,
  useContratoActions,
  useChangePlan,
  useConfirmarCondicionTecnica,
  ContratoDetailDialog,
  contratoDisplayName,
  type ContractCommercialOut,
  type ContractCreate,
  type ContractConfirmTechnicalCondition,
  type ListContratosParams,
} from '@/features/contratos'
import ContratoForm from '@/features/contratos/components/ContratoForm'
import ContratosTable, {
  type ContratoActionKind,
} from '@/features/contratos/components/ContratosTable'
import ContratoFilterBar from '@/features/contratos/components/ContratoFilterBar'
import ChangePlanDialog from '@/features/contratos/components/ChangePlanDialog'
import CondicionTecnicaDialog from '@/features/contratos/components/CondicionTecnicaDialog'

export default function ContratosPage() {
  const { showSuccess } = useSnackbar()

  // ---- Filtros ----
  const [filters, setFilters] = useState<ListContratosParams>({})
  const [selectedClienteFilter, setSelectedClienteFilter] =
    useState<ClienteOut | null>(null)

  const params = useMemo(() => filters, [filters])
  const { data, isLoading, isFetching, error, refetch } = useContratos(params)

  // ---- Mutations ----
  const createMutation = useCreateContrato()
  const actions = useContratoActions()
  const changePlanMutation = useChangePlan()
  const tecnicaMutation = useConfirmarCondicionTecnica()

  // ---- Dialog state ----
  const [createOpen, setCreateOpen] = useState(false)
  const [detailId, setDetailId] = useState<number | null>(null)
  const [changePlanTarget, setChangePlanTarget] =
    useState<ContractCommercialOut | null>(null)
  const [tecnicaTarget, setTecnicaTarget] =
    useState<ContractCommercialOut | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<{
    kind: 'cancel' | 'terminate' | 'suspend' | 'resume' | 'activate'
    contrato: ContractCommercialOut
  } | null>(null)

  // ---- Handlers ----
  const handleCreate = async (payload: ContractCreate) => {
    await createMutation.mutateAsync(payload)
    setCreateOpen(false)
    createMutation.reset()
    showSuccess('Contrato creado.')
  }

  const handleCloseCreate = () => {
    if (createMutation.isPending) return
    setCreateOpen(false)
    createMutation.reset()
  }

  const handleAction = (
    action: ContratoActionKind,
    contrato: ContractCommercialOut,
  ) => {
    switch (action) {
      case 'view':
        setDetailId(contrato.contrato_id)
        return
      case 'change-plan':
        setChangePlanTarget(contrato)
        return
      case 'confirmar-tecnica':
        setTecnicaTarget(contrato)
        return
      case 'activate':
      case 'suspend':
      case 'resume':
        // Estas no son destructivas, pero igual pedimos confirmación
        // para evitar clics accidentales desde el menú.
        setConfirmTarget({ kind: action, contrato })
        return
      case 'cancel':
      case 'terminate':
        setConfirmTarget({ kind: action, contrato })
        return
    }
  }

  const runConfirmed = async () => {
    if (!confirmTarget) return
    const { kind, contrato } = confirmTarget
    const mutation = actions[
      kind === 'terminate' ? 'terminate' : kind
    ] as typeof actions.activate
    try {
      await mutation.mutateAsync(contrato.contrato_id)
      setConfirmTarget(null)
      mutation.reset()
      showSuccess(successMessageFor(kind))
    } catch {
      // El error ya vive en mutation.error y se muestra en el ConfirmDialog.
    }
  }

  const closeConfirm = () => {
    if (confirmTarget) {
      const m = actions[
        confirmTarget.kind === 'terminate' ? 'terminate' : confirmTarget.kind
      ]
      if (m.isPending) return
      m.reset()
    }
    setConfirmTarget(null)
  }

  const handleChangePlan = async (newPlanId: number) => {
    if (!changePlanTarget) return
    await changePlanMutation.mutateAsync({
      contratoId: changePlanTarget.contrato_id,
      payload: { new_plan_id: newPlanId },
    })
    setChangePlanTarget(null)
    changePlanMutation.reset()
    showSuccess('Plan cambiado. Se creó un contrato nuevo.')
  }

  const closeChangePlan = () => {
    if (changePlanMutation.isPending) return
    setChangePlanTarget(null)
    changePlanMutation.reset()
  }

  const handleTecnica = async (payload: ContractConfirmTechnicalCondition) => {
    if (!tecnicaTarget) return
    await tecnicaMutation.mutateAsync({
      contratoId: tecnicaTarget.contrato_id,
      payload,
    })
    setTecnicaTarget(null)
    tecnicaMutation.reset()
    showSuccess('Condición técnica confirmada.')
  }

  const closeTecnica = () => {
    if (tecnicaMutation.isPending) return
    setTecnicaTarget(null)
    tecnicaMutation.reset()
  }

  // ---- Confirm dialog props derived from confirmTarget ----
  const confirmProps = confirmTarget
    ? confirmDialogProps(confirmTarget.kind, confirmTarget.contrato)
    : null
  const confirmMutation = confirmTarget
    ? actions[
        confirmTarget.kind === 'terminate' ? 'terminate' : confirmTarget.kind
      ]
    : null

  return (
    <Stack spacing={{ xs: 2, md: 2.5 }} sx={{ minWidth: 0 }}>
      <PageHeader
        title="Contratos"
        actions={
          <>
            <Tooltip title="Refrescar lista">
              <span>
                <IconButton
                  onClick={() => refetch()}
                  disabled={isFetching}
                  aria-label="refrescar contratos"
                >
                  <RefreshIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateOpen(true)}
            >
              Nuevo contrato
            </Button>
          </>
        }
      />

      <ContratoFilterBar
        value={filters}
        onChange={setFilters}
        selectedCliente={selectedClienteFilter}
        onSelectedClienteChange={setSelectedClienteFilter}
      />

      <ContratosTable
        rows={data}
        loading={isLoading}
        error={error}
        onAction={handleAction}
      />

      {/* Crear */}
      <Dialog
        open={createOpen}
        onClose={handleCloseCreate}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Nuevo contrato</DialogTitle>
        <DialogContent>
          <ContratoForm
            onSubmit={handleCreate}
            onCancel={handleCloseCreate}
            loading={createMutation.isPending}
            error={createMutation.error}
          />
        </DialogContent>
      </Dialog>

      {/* Detalle */}
      <ContratoDetailDialog
        open={detailId != null}
        contratoId={detailId ?? undefined}
        onClose={() => setDetailId(null)}
      />

      {/* Cambio de plan */}
      <ChangePlanDialog
        open={changePlanTarget != null}
        contrato={changePlanTarget}
        loading={changePlanMutation.isPending}
        error={changePlanMutation.error}
        onConfirm={handleChangePlan}
        onCancel={closeChangePlan}
      />

      {/* Condición técnica */}
      <CondicionTecnicaDialog
        open={tecnicaTarget != null}
        contrato={tecnicaTarget}
        loading={tecnicaMutation.isPending}
        error={tecnicaMutation.error}
        onConfirm={handleTecnica}
        onCancel={closeTecnica}
      />

      {/* Confirmación genérica (activate/suspend/resume/cancel/terminate) */}
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

function successMessageFor(kind: string): string {
  switch (kind) {
    case 'activate':
      return 'Contrato activado.'
    case 'suspend':
      return 'Contrato suspendido.'
    case 'resume':
      return 'Contrato reanudado.'
    case 'cancel':
      return 'Contrato cancelado.'
    case 'terminate':
      return 'Contrato dado de baja.'
    default:
      return 'Acción aplicada.'
  }
}

function confirmDialogProps(
  kind: 'cancel' | 'terminate' | 'suspend' | 'resume' | 'activate',
  c: ContractCommercialOut,
): {
  title: string
  description: string
  confirmLabel: string
  confirmColor: 'primary' | 'error' | 'warning'
} {
  const nombre = contratoDisplayName(c)
  const titlePrefix = `"${nombre}" (#${c.contrato_id})`
  switch (kind) {
    case 'cancel':
      return {
        title: `Cancelar contrato ${titlePrefix}`,
        description: `Se cancelará el contrato ${nombre}. Esta acción deja el contrato en estado CANCELADO — revisar que sea lo correcto.`,
        confirmLabel: 'Cancelar contrato',
        confirmColor: 'error',
      }
    case 'terminate':
      return {
        title: `Dar de baja ${titlePrefix}`,
        description: `El contrato ${nombre} pasará a estado BAJA y dejará de estar operativo.`,
        confirmLabel: 'Dar de baja',
        confirmColor: 'error',
      }
    case 'suspend':
      return {
        title: `Suspender ${titlePrefix}`,
        description: `El contrato ${nombre} pasará a estado SUSPENDIDO. Se puede reanudar más adelante.`,
        confirmLabel: 'Suspender',
        confirmColor: 'warning',
      }
    case 'resume':
      return {
        title: `Reanudar ${titlePrefix}`,
        description: `El contrato ${nombre} volverá a estado ACTIVO.`,
        confirmLabel: 'Reanudar',
        confirmColor: 'primary',
      }
    case 'activate':
      return {
        title: `Activar ${titlePrefix}`,
        description: `El contrato ${nombre} pasará a estado ACTIVO.`,
        confirmLabel: 'Activar',
        confirmColor: 'primary',
      }
  }
}
