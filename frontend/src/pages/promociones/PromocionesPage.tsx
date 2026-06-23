import { useState } from 'react'
import { Button, Dialog, DialogContent, DialogTitle, Stack } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import PageHeader from '@/components/ui/PageHeader'
import { useSnackbar } from '@/components/ui/SnackbarProvider'
import { useAuth } from '@/features/auth'
import { fromDateInputValue, toDateInputValue } from '@/lib/format'
import {
  usePromociones,
  useCreatePromocion,
  useUpdatePromocion,
  PromocionTable,
  PromocionesFilterBar,
  PromocionForm,
  TIPO_PROMO_PORCENTAJE,
  type PromocionOut,
  type PromocionCreate,
  type PromocionUpdate,
  type ListPromocionesParams,
  type PromocionFormValues,
} from '@/features/promociones'

const PAGE_SIZE = 50

export default function PromocionesPage() {
  const { hasCapability } = useAuth()
  const canManage = hasCapability('can_manage_promociones')

  const [params, setParams] = useState<ListPromocionesParams>({})
  const { data, isLoading, error } = usePromociones({ ...params, limit: PAGE_SIZE })

  const createMutation = useCreatePromocion()
  const updateMutation = useUpdatePromocion()
  const { showSuccess } = useSnackbar()

  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<PromocionOut | null>(null)

  const offset = params.offset ?? 0

  const buildPayload = (values: PromocionFormValues): PromocionCreate => {
    const tipo = Number(values.tipo_promo_id)
    const esPorcentaje = tipo === TIPO_PROMO_PORCENTAJE
    return {
      nombre_promo: values.nombre_promo.trim(),
      descripcion_promo: values.descripcion_promo.trim() || null,
      tipo_promo_id: tipo,
      porcentaje_descuento: esPorcentaje ? Number(values.porcentaje_descuento) : null,
      monto_descuento: esPorcentaje ? null : Number(values.monto_descuento),
      fecha_vigencia_desde_promo: fromDateInputValue(values.fecha_vigencia_desde_promo),
      fecha_vigencia_hasta_promo: values.fecha_vigencia_hasta_promo
        ? fromDateInputValue(values.fecha_vigencia_hasta_promo)
        : null,
    }
  }

  const handleCreate = async (values: PromocionFormValues) => {
    await createMutation.mutateAsync(buildPayload(values))
    setCreateOpen(false)
    createMutation.reset()
    showSuccess('Promoción creada.')
  }

  const handleCloseCreate = () => {
    if (createMutation.isPending) return
    setCreateOpen(false)
    createMutation.reset()
  }

  const handleUpdate = async (values: PromocionFormValues) => {
    if (!editing) return
    const payload: PromocionUpdate = {
      ...buildPayload(values),
      activo_promo: values.activo_promo,
    }
    await updateMutation.mutateAsync({ promocionId: editing.promocion_id, payload })
    setEditing(null)
    updateMutation.reset()
    showSuccess('Promoción actualizada.')
  }

  const handleCloseEdit = () => {
    if (updateMutation.isPending) return
    setEditing(null)
    updateMutation.reset()
  }

  // Activar/desactivar reusa el PATCH (soft-disable, sin borrado físico).
  const handleToggleActivo = async (promo: PromocionOut) => {
    await updateMutation.mutateAsync({
      promocionId: promo.promocion_id,
      payload: { activo_promo: !promo.activo_promo },
    })
    updateMutation.reset()
    showSuccess(promo.activo_promo ? 'Promoción desactivada.' : 'Promoción activada.')
  }

  return (
    <Stack spacing={{ xs: 2, md: 2.5 }} sx={{ minWidth: 0 }}>
      <PageHeader
        title="Promociones"
        subtitle="Descuentos comerciales aplicables a los contratos."
        actions={
          canManage ? (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateOpen(true)}
            >
              Nueva promoción
            </Button>
          ) : undefined
        }
      />

      <PromocionesFilterBar value={params} onChange={setParams} />

      <PromocionTable
        promociones={data}
        loading={isLoading}
        error={error}
        canManage={canManage}
        onEdit={(p) => canManage && setEditing(p)}
        onToggleActivo={handleToggleActivo}
        pagination={{
          limit: PAGE_SIZE,
          offset,
          onChange: ({ offset: nextOffset }) =>
            setParams((prev) => ({ ...prev, offset: nextOffset })),
        }}
      />

      <Dialog open={createOpen} onClose={handleCloseCreate} maxWidth="sm" fullWidth>
        <DialogTitle>Nueva promoción</DialogTitle>
        <DialogContent>
          <PromocionForm
            onSubmit={handleCreate}
            onCancel={handleCloseCreate}
            loading={createMutation.isPending}
            error={createMutation.error}
            submitLabel="Crear promoción"
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onClose={handleCloseEdit} maxWidth="sm" fullWidth>
        <DialogTitle>Editar promoción</DialogTitle>
        <DialogContent>
          {editing && (
            <PromocionForm
              showActivo
              initialValues={{
                nombre_promo: editing.nombre_promo,
                descripcion_promo: editing.descripcion_promo ?? '',
                tipo_promo_id: String(editing.tipo_promo_id),
                porcentaje_descuento:
                  editing.porcentaje_descuento != null ? String(editing.porcentaje_descuento) : '',
                monto_descuento:
                  editing.monto_descuento != null ? String(editing.monto_descuento) : '',
                fecha_vigencia_desde_promo: toDateInputValue(editing.fecha_vigencia_desde_promo),
                fecha_vigencia_hasta_promo: toDateInputValue(editing.fecha_vigencia_hasta_promo),
                activo_promo: editing.activo_promo,
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
    </Stack>
  )
}
