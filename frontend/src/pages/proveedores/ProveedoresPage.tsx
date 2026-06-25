import { useState } from 'react'
import { Button, Dialog, DialogContent, DialogTitle, Stack } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import PageHeader from '@/components/ui/PageHeader'
import { useSnackbar } from '@/components/ui/SnackbarProvider'
import { useAuth } from '@/features/auth'
import {
  useProveedores,
  useCreateProveedor,
  useUpdateProveedor,
  ProveedorTable,
  ProveedoresFilterBar,
  ProveedorForm,
  type ProveedorOut,
  type ProveedorCreate,
  type ProveedorUpdate,
  type ListProveedoresParams,
  type ProveedorFormValues,
} from '@/features/proveedores'

const PAGE_SIZE = 50

function buildPayload(values: ProveedorFormValues): ProveedorCreate {
  const trim = (v: string) => v.trim() || null
  return {
    nombre_prov: values.nombre_prov.trim(),
    estado_proveedor_id: Number(values.estado_proveedor_id),
    telefono_prov: trim(values.telefono_prov),
    email_prov: trim(values.email_prov),
    direccion_prov: trim(values.direccion_prov),
    web_prov: trim(values.web_prov),
    descripcion_prov: trim(values.descripcion_prov),
    observacion_prov: trim(values.observacion_prov),
  }
}

export default function ProveedoresPage() {
  const { hasCapability } = useAuth()
  const canManage = hasCapability('can_manage_proveedores')

  const [params, setParams] = useState<ListProveedoresParams>({})
  const { data, isLoading, error } = useProveedores({ ...params, limit: PAGE_SIZE })

  const createMutation = useCreateProveedor()
  const updateMutation = useUpdateProveedor()
  const { showSuccess } = useSnackbar()

  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<ProveedorOut | null>(null)

  const offset = params.offset ?? 0

  const handleCreate = async (values: ProveedorFormValues) => {
    await createMutation.mutateAsync(buildPayload(values))
    setCreateOpen(false)
    createMutation.reset()
    showSuccess('Proveedor creado.')
  }

  const handleCloseCreate = () => {
    if (createMutation.isPending) return
    setCreateOpen(false)
    createMutation.reset()
  }

  const handleUpdate = async (values: ProveedorFormValues) => {
    if (!editing) return
    const payload: ProveedorUpdate = buildPayload(values)
    await updateMutation.mutateAsync({ proveedorId: editing.proveedor_id, payload })
    setEditing(null)
    updateMutation.reset()
    showSuccess('Proveedor actualizado.')
  }

  const handleCloseEdit = () => {
    if (updateMutation.isPending) return
    setEditing(null)
    updateMutation.reset()
  }

  return (
    <Stack spacing={{ xs: 2, md: 2.5 }} sx={{ minWidth: 0 }}>
      <PageHeader
        title="Proveedores"
        subtitle="Proveedores de equipos y materiales para compras y stock."
        actions={
          canManage ? (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateOpen(true)}
            >
              Nuevo proveedor
            </Button>
          ) : undefined
        }
      />

      <ProveedoresFilterBar value={params} onChange={setParams} />

      <ProveedorTable
        proveedores={data}
        loading={isLoading}
        error={error}
        canManage={canManage}
        onEdit={(p) => canManage && setEditing(p)}
        pagination={{
          limit: PAGE_SIZE,
          offset,
          onChange: ({ offset: nextOffset }) =>
            setParams((prev) => ({ ...prev, offset: nextOffset })),
        }}
      />

      <Dialog open={createOpen} onClose={handleCloseCreate} maxWidth="sm" fullWidth>
        <DialogTitle>Nuevo proveedor</DialogTitle>
        <DialogContent>
          <ProveedorForm
            onSubmit={handleCreate}
            onCancel={handleCloseCreate}
            loading={createMutation.isPending}
            error={createMutation.error}
            submitLabel="Crear proveedor"
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onClose={handleCloseEdit} maxWidth="sm" fullWidth>
        <DialogTitle>Editar proveedor</DialogTitle>
        <DialogContent>
          {editing && (
            <ProveedorForm
              initialValues={{
                nombre_prov: editing.nombre_prov ?? '',
                estado_proveedor_id: String(editing.estado_proveedor_id),
                telefono_prov: editing.telefono_prov ?? '',
                email_prov: editing.email_prov ?? '',
                direccion_prov: editing.direccion_prov ?? '',
                web_prov: editing.web_prov ?? '',
                descripcion_prov: editing.descripcion_prov ?? '',
                observacion_prov: editing.observacion_prov ?? '',
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
