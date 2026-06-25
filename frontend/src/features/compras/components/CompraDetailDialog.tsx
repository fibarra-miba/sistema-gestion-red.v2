import { useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material'
import BlockIcon from '@mui/icons-material/Block'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useSnackbar } from '@/components/ui/SnackbarProvider'
import { formatCurrencyARS, formatDate } from '@/lib/format'
import { useCompra } from '../hooks/useCompra'
import { useAnularCompra } from '../hooks/useCompraMutations'
import type { CompraDetalleOut } from '../types'

interface Props {
  facturaCompraId: number | null
  open: boolean
  canManage?: boolean
  onClose: () => void
}

export default function CompraDetailDialog({
  facturaCompraId,
  open,
  canManage,
  onClose,
}: Props) {
  const { data, isLoading, error } = useCompra(open ? facturaCompraId : null)
  const anular = useAnularCompra()
  const { showSuccess } = useSnackbar()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const esEmitida = data?.descripcion_efcompra === 'EMITIDA'

  const columns: DataTableColumn<CompraDetalleOut>[] = [
    { key: 'nombre_producto', label: 'Producto', render: (d) => d.nombre_producto ?? '—' },
    {
      key: 'presentacion',
      label: 'Presentación',
      showFrom: 'sm',
      render: (d) =>
        d.nombre_presentacion ? `${d.nombre_presentacion} (x${d.factor_aplicado})` : 'Unidad base',
    },
    {
      key: 'cantidad_base',
      label: 'Cant. base',
      align: 'right',
      render: (d) => d.cantidad_base,
    },
    {
      key: 'costo_unitario_base',
      label: 'Costo unit.',
      align: 'right',
      showFrom: 'sm',
      render: (d) => formatCurrencyARS(d.costo_unitario_base),
    },
    {
      key: 'subtotal',
      label: 'Subtotal',
      align: 'right',
      render: (d) => formatCurrencyARS(d.subtotal),
    },
  ]

  const handleAnular = async () => {
    if (!facturaCompraId) return
    await anular.mutateAsync(facturaCompraId)
    setConfirmOpen(false)
    anular.reset()
    showSuccess('Compra anulada. Stock revertido.')
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          Compra #{facturaCompraId}
          {data && (
            <Chip
              size="small"
              label={data.descripcion_efcompra ?? '—'}
              color={esEmitida ? 'success' : 'default'}
              variant={esEmitida ? 'filled' : 'outlined'}
              sx={{ ml: 1 }}
            />
          )}
        </DialogTitle>
        <DialogContent>
          {data && (
            <Stack spacing={2} sx={{ mt: 0.5 }}>
              <Box
                sx={{
                  display: 'grid',
                  gap: 1,
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                }}
              >
                <Field label="Proveedor" value={data.nombre_prov ?? '—'} />
                <Field label="Fecha" value={formatDate(data.fecha_fcompras)} />
                <Field label="Código" value={data.codigo_fcompras ?? '—'} />
                <Field label="Descripción" value={data.descripcion_fcompras ?? '—'} />
              </Box>

              <DataTable
                columns={columns}
                rows={data.detalles}
                loading={isLoading}
                error={error}
                getRowKey={(d) => d.det_factura_compra_id}
                emptyMessage="Sin líneas."
              />

              <Typography variant="subtitle1" sx={{ fontWeight: 700, textAlign: 'right' }}>
                Total: {formatCurrencyARS(data.importe_total_fcompras)}
              </Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          {canManage && esEmitida && (
            <Button
              color="error"
              startIcon={<BlockIcon />}
              onClick={() => setConfirmOpen(true)}
            >
              Anular compra
            </Button>
          )}
          <Button onClick={onClose} variant="contained">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        title="Anular compra"
        description="Se revertirá el stock generado por esta compra. Si el material ya se consumió, la anulación será rechazada."
        confirmLabel="Anular"
        confirmColor="error"
        loading={anular.isPending}
        error={anular.error}
        onConfirm={handleAnular}
        onCancel={() => {
          if (anular.isPending) return
          setConfirmOpen(false)
          anular.reset()
        }}
      />
    </>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Box>
  )
}
