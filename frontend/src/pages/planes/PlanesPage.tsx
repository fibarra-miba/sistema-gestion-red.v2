import { useState } from 'react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Stack,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import PageHeader from '@/components/ui/PageHeader'
import { useSnackbar } from '@/components/ui/SnackbarProvider'
import {
  usePlanes,
  useCreatePlan,
  useUpdatePlan,
  useDeactivatePlan,
  PlanDetailDialog,
  isPlanActivo,
  type PlanOut,
  type PlanCreate,
  type PlanUpdate,
} from '@/features/planes'
import PlanTable from '@/features/planes/components/PlanTable'
import PlanForm, {
  estadoPlanIdFromActivo,
  type PlanFormValues,
} from '@/features/planes/components/PlanForm'

export default function PlanesPage() {
  const { data, isLoading, error } = usePlanes()
  const createMutation = useCreatePlan()
  const updateMutation = useUpdatePlan()
  const deactivateMutation = useDeactivatePlan()
  const { showSuccess } = useSnackbar()

  const [createOpen, setCreateOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<PlanOut | null>(null)
  const [detailPlanId, setDetailPlanId] = useState<number | null>(null)
  const [deactivating, setDeactivating] = useState<PlanOut | null>(null)

  const handleCreate = async (values: PlanFormValues) => {
    const payload: PlanCreate = {
      nombre_plan: values.nombre_plan.trim(),
      velocidad_mbps_plan: Number(values.velocidad_mbps_plan),
      descripcion_plan: values.descripcion_plan.trim() || null,
      estado_plan_id: estadoPlanIdFromActivo(values.activo),
    }
    await createMutation.mutateAsync(payload)
    setCreateOpen(false)
    createMutation.reset()
    showSuccess('Plan creado.')
  }

  const handleCloseCreate = () => {
    if (createMutation.isPending) return
    setCreateOpen(false)
    createMutation.reset()
  }

  const handleUpdate = async (values: PlanFormValues) => {
    if (!editingPlan) return
    const payload: PlanUpdate = {
      nombre_plan: values.nombre_plan.trim(),
      velocidad_mbps_plan: Number(values.velocidad_mbps_plan),
      descripcion_plan: values.descripcion_plan.trim() || null,
      estado_plan_id: estadoPlanIdFromActivo(values.activo),
    }
    await updateMutation.mutateAsync({ planId: editingPlan.plan_id, payload })
    setEditingPlan(null)
    updateMutation.reset()
    showSuccess('Plan actualizado.')
  }

  const handleCloseEdit = () => {
    if (updateMutation.isPending) return
    setEditingPlan(null)
    updateMutation.reset()
  }

  const handleDeactivate = async () => {
    if (!deactivating) return
    await deactivateMutation.mutateAsync(deactivating.plan_id)
    setDeactivating(null)
    deactivateMutation.reset()
    showSuccess('Plan dado de baja.')
  }

  const handleCloseDeactivate = () => {
    if (deactivateMutation.isPending) return
    setDeactivating(null)
    deactivateMutation.reset()
  }

  return (
    <Stack spacing={{ xs: 2, md: 2.5 }} sx={{ minWidth: 0 }}>
      <PageHeader
        title="Planes"
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
          >
            Nuevo plan
          </Button>
        }
      />

      <PlanTable
        plans={data}
        loading={isLoading}
        error={error}
        onView={(p) => setDetailPlanId(p.plan_id)}
        onEdit={(p) => setEditingPlan(p)}
        onDeactivate={(p) => setDeactivating(p)}
      />

      <Dialog open={createOpen} onClose={handleCloseCreate} maxWidth="sm" fullWidth>
        <DialogTitle>Nuevo plan</DialogTitle>
        <DialogContent>
          <PlanForm
            onSubmit={handleCreate}
            onCancel={handleCloseCreate}
            loading={createMutation.isPending}
            error={createMutation.error}
            submitLabel="Crear plan"
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingPlan} onClose={handleCloseEdit} maxWidth="sm" fullWidth>
        <DialogTitle>Editar plan</DialogTitle>
        <DialogContent>
          {editingPlan && (
            <PlanForm
              initialValues={{
                nombre_plan: editingPlan.nombre_plan,
                velocidad_mbps_plan: String(editingPlan.velocidad_mbps_plan),
                descripcion_plan: editingPlan.descripcion_plan ?? '',
                activo: isPlanActivo(editingPlan.estado_plan_id),
              }}
              onSubmit={handleUpdate}
              onCancel={handleCloseEdit}
              loading={updateMutation.isPending}
              error={updateMutation.error}
              submitLabel="Guardar cambios"
            />
          )}
        </DialogContent>
      </Dialog>

      <PlanDetailDialog
        open={detailPlanId != null}
        planId={detailPlanId ?? undefined}
        onClose={() => setDetailPlanId(null)}
      />

      <ConfirmDialog
        open={!!deactivating}
        title={`Dar de baja "${deactivating?.nombre_plan}"`}
        description="El plan no podrá asignarse a nuevos contratos. Los contratos existentes no se ven afectados."
        confirmLabel="Dar de baja"
        confirmColor="error"
        loading={deactivateMutation.isPending}
        error={deactivateMutation.error}
        onConfirm={handleDeactivate}
        onCancel={handleCloseDeactivate}
      />
    </Stack>
  )
}
