import { useState } from 'react'
import { Button, Dialog, DialogContent, DialogTitle, Stack } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import PageHeader from '@/components/ui/PageHeader'
import { useSnackbar } from '@/components/ui/SnackbarProvider'
import { useAuth } from '@/features/auth'
import {
  useCompras,
  useCreateCompra,
  ComprasTable,
  ComprasFilterBar,
  CompraForm,
  CompraDetailDialog,
  type CompraCreate,
  type ListComprasParams,
} from '@/features/compras'

const PAGE_SIZE = 50

export default function ComprasPage() {
  const { hasCapability } = useAuth()
  const canManage = hasCapability('can_manage_compras')

  const [params, setParams] = useState<ListComprasParams>({})
  const { data, isLoading, error } = useCompras({ ...params, limit: PAGE_SIZE })

  const createMutation = useCreateCompra()
  const { showSuccess } = useSnackbar()

  const [createOpen, setCreateOpen] = useState(false)
  const [detailId, setDetailId] = useState<number | null>(null)

  const offset = params.offset ?? 0

  const handleCreate = async (payload: CompraCreate) => {
    await createMutation.mutateAsync(payload)
    setCreateOpen(false)
    createMutation.reset()
    showSuccess('Compra registrada. Stock actualizado.')
  }

  const handleCloseCreate = () => {
    if (createMutation.isPending) return
    setCreateOpen(false)
    createMutation.reset()
  }

  return (
    <Stack spacing={{ xs: 2, md: 2.5 }} sx={{ minWidth: 0 }}>
      <PageHeader
        title="Compras"
        subtitle="Facturas de compra a proveedores. El alta genera entrada de stock."
        actions={
          canManage ? (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateOpen(true)}
            >
              Nueva compra
            </Button>
          ) : undefined
        }
      />

      <ComprasFilterBar value={params} onChange={setParams} />

      <ComprasTable
        compras={data}
        loading={isLoading}
        error={error}
        onRowClick={(c) => setDetailId(c.factura_compra_id)}
        pagination={{
          limit: PAGE_SIZE,
          offset,
          onChange: ({ offset: nextOffset }) =>
            setParams((prev) => ({ ...prev, offset: nextOffset })),
        }}
      />

      <Dialog open={createOpen} onClose={handleCloseCreate} maxWidth="md" fullWidth>
        <DialogTitle>Nueva compra</DialogTitle>
        <DialogContent>
          <CompraForm
            onSubmit={handleCreate}
            onCancel={handleCloseCreate}
            loading={createMutation.isPending}
            error={createMutation.error}
          />
        </DialogContent>
      </Dialog>

      <CompraDetailDialog
        facturaCompraId={detailId}
        open={detailId != null}
        canManage={canManage}
        onClose={() => setDetailId(null)}
      />
    </Stack>
  )
}
