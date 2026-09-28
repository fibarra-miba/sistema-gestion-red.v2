import { useState } from 'react'
import { Button, Dialog, DialogContent, DialogTitle, Stack } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import PageHeader from '@/components/ui/PageHeader'
import { useSnackbar } from '@/components/ui/SnackbarProvider'
import { useAuth } from '@/features/auth'
import { MovimientoStockDialog } from '@/features/stock'
import {
  useProductos,
  useCreateProducto,
  useUpdateProducto,
  ProductoTable,
  ProductosFilterBar,
  ProductoForm,
  type ProductoOut,
  type ProductoCreate,
  type ProductoUpdate,
  type ListProductosParams,
  type ProductoFormValues,
} from '@/features/productos'

const PAGE_SIZE = 50

export default function ProductosPage() {
  const { hasCapability } = useAuth()
  const canManage = hasCapability('can_manage_productos')

  const [params, setParams] = useState<ListProductosParams>({})
  const { data, isLoading, error } = useProductos({ ...params, limit: PAGE_SIZE })

  const createMutation = useCreateProducto()
  const updateMutation = useUpdateProducto()
  const { showSuccess } = useSnackbar()

  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<ProductoOut | null>(null)
  // Producto sobre el que se va a cargar/ajustar existencia.
  const [cargandoStock, setCargandoStock] = useState<ProductoOut | null>(null)

  const offset = params.offset ?? 0

  const buildPayload = (values: ProductoFormValues) => ({
    nombre_producto: values.nombre_producto.trim(),
    marca_producto: values.marca_producto.trim(),
    modelo_producto: values.modelo_producto.trim(),
    descripcion_producto: values.descripcion_producto.trim() || null,
    tipo_producto_id: Number(values.tipo_producto_id),
    unidad_stock_producto: values.unidad_stock_producto.trim() || null,
  })

  const handleCreate = async (values: ProductoFormValues) => {
    const payload: ProductoCreate = buildPayload(values)
    await createMutation.mutateAsync(payload)
    setCreateOpen(false)
    createMutation.reset()
    showSuccess('Producto creado.')
  }

  const handleCloseCreate = () => {
    if (createMutation.isPending) return
    setCreateOpen(false)
    createMutation.reset()
  }

  const handleUpdate = async (values: ProductoFormValues) => {
    if (!editing) return
    const payload: ProductoUpdate = {
      ...buildPayload(values),
      activo_producto: values.activo_producto,
    }
    await updateMutation.mutateAsync({ productoId: editing.producto_id, payload })
    setEditing(null)
    updateMutation.reset()
    showSuccess('Producto actualizado.')
  }

  const handleCloseEdit = () => {
    if (updateMutation.isPending) return
    setEditing(null)
    updateMutation.reset()
  }

  // Activar/desactivar reusa el PATCH (soft-delete, sin borrado físico).
  const handleToggleActivo = async (producto: ProductoOut) => {
    await updateMutation.mutateAsync({
      productoId: producto.producto_id,
      payload: { activo_producto: !producto.activo_producto },
    })
    updateMutation.reset()
    showSuccess(producto.activo_producto ? 'Producto desactivado.' : 'Producto activado.')
  }

  return (
    <Stack spacing={{ xs: 2, md: 2.5 }} sx={{ minWidth: 0 }}>
      <PageHeader
        title="Productos"
        subtitle="Catálogo de equipos y materiales para instalaciones y garantías."
        actions={
          canManage ? (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateOpen(true)}
            >
              Nuevo producto
            </Button>
          ) : undefined
        }
      />

      <ProductosFilterBar value={params} onChange={setParams} />

      <ProductoTable
        productos={data}
        loading={isLoading}
        error={error}
        canManage={canManage}
        onEdit={(p) => canManage && setEditing(p)}
        onCargarStock={canManage ? (p) => setCargandoStock(p) : undefined}
        onToggleActivo={handleToggleActivo}
        pagination={{
          limit: PAGE_SIZE,
          offset,
          onChange: ({ offset: nextOffset }) =>
            setParams((prev) => ({ ...prev, offset: nextOffset })),
        }}
      />

      <Dialog open={createOpen} onClose={handleCloseCreate} maxWidth="sm" fullWidth>
        <DialogTitle>Nuevo producto</DialogTitle>
        <DialogContent>
          <ProductoForm
            onSubmit={handleCreate}
            onCancel={handleCloseCreate}
            loading={createMutation.isPending}
            error={createMutation.error}
            submitLabel="Crear producto"
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onClose={handleCloseEdit} maxWidth="sm" fullWidth>
        <DialogTitle>Editar producto</DialogTitle>
        <DialogContent>
          {editing && (
            <ProductoForm
              showActivo
              initialValues={{
                nombre_producto: editing.nombre_producto,
                marca_producto: editing.marca_producto,
                modelo_producto: editing.modelo_producto,
                descripcion_producto: editing.descripcion_producto ?? '',
                tipo_producto_id: String(editing.tipo_producto_id),
                unidad_stock_producto: editing.unidad_stock_producto ?? '',
                activo_producto: editing.activo_producto,
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

      <MovimientoStockDialog
        open={cargandoStock !== null}
        existencia={
          cargandoStock && {
            producto_id: cargandoStock.producto_id,
            nombre_producto: cargandoStock.nombre_producto,
            unidad_stock_producto: cargandoStock.unidad_stock_producto,
          }
        }
        onClose={() => setCargandoStock(null)}
      />
    </Stack>
  )
}
