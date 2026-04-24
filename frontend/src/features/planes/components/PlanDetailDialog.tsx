import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { isApiError } from '@/types/api'
import { formatCurrencyARS, formatDate } from '@/lib/format'
import { useSnackbar } from '@/components/ui/SnackbarProvider'
import { usePlan } from '../hooks/usePlan'
import { usePlanPrices } from '../hooks/usePlanPrices'
import { useCreatePrice } from '../hooks/useCreatePrice'
import { useUpdatePrice } from '../hooks/useUpdatePrice'
import { isPlanActivo } from '../utils'
import PriceTable from './PriceTable'
import PriceForm from './PriceForm'
import type { PrecioPlanCreate, PrecioPlanOut, PrecioPlanUpdate } from '../types'

interface PlanDetailDialogProps {
  open: boolean
  planId: number | undefined
  onClose: () => void
}

export default function PlanDetailDialog({
  open,
  planId,
  onClose,
}: PlanDetailDialogProps) {
  const active = open && planId != null
  const { data: plan, isLoading, error } = usePlan(active ? planId : undefined)
  const {
    data: precios,
    isLoading: loadingPrecios,
    error: errorPrecios,
  } = usePlanPrices(active ? planId : undefined)

  const createPrice = useCreatePrice()
  const updatePrice = useUpdatePrice()
  const { showSuccess } = useSnackbar()
  const [priceFormOpen, setPriceFormOpen] = useState(false)
  const [editingPrice, setEditingPrice] = useState<PrecioPlanOut | null>(null)

  const handleCreatePrice = async (payload: PrecioPlanCreate) => {
    if (planId == null) return
    await createPrice.mutateAsync({ planId, payload })
    setPriceFormOpen(false)
    createPrice.reset()
    showSuccess('Precio registrado.')
  }

  const handleClosePriceForm = () => {
    if (createPrice.isPending) return
    setPriceFormOpen(false)
    createPrice.reset()
  }

  const handleUpdatePrice = async (payload: PrecioPlanUpdate) => {
    if (planId == null || !editingPrice) return
    await updatePrice.mutateAsync({
      planId,
      precioId: editingPrice.precios_planes_id,
      payload,
    })
    setEditingPrice(null)
    updatePrice.reset()
    showSuccess('Precio actualizado.')
  }

  const handleCloseEditPrice = () => {
    if (updatePrice.isPending) return
    setEditingPrice(null)
    updatePrice.reset()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Detalle del plan</DialogTitle>
      <DialogContent>
        {isLoading && (
          <Stack spacing={1}>
            <Skeleton width="70%" height={32} />
            <Skeleton width="40%" />
            <Skeleton width="90%" />
          </Stack>
        )}

        {error && (
          <Alert severity="error">
            {isApiError(error) ? error.detail : 'Error al cargar el plan.'}
          </Alert>
        )}

        {!isLoading && !error && plan && (
          <Stack spacing={3}>
            <Box>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {plan.nombre_plan}
                </Typography>
                <Chip
                  label={isPlanActivo(plan.estado_plan_id) ? 'Activo' : 'Inactivo'}
                  color={isPlanActivo(plan.estado_plan_id) ? 'success' : 'default'}
                  size="small"
                  variant={isPlanActivo(plan.estado_plan_id) ? 'filled' : 'outlined'}
                />
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                ID #{plan.plan_id} · {plan.velocidad_mbps_plan} Mbps
              </Typography>
              {plan.descripcion_plan && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {plan.descripcion_plan}
                </Typography>
              )}
            </Box>

            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block' }}
              >
                Precio vigente
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {formatCurrencyARS(plan.precio_vigente)}
              </Typography>
              {plan.fecha_desde_precio_vigente && (
                <Typography variant="caption" color="text.secondary">
                  Desde {formatDate(plan.fecha_desde_precio_vigente)}
                  {plan.fecha_hasta_precio_vigente
                    ? ` · hasta ${formatDate(plan.fecha_hasta_precio_vigente)}`
                    : ''}
                </Typography>
              )}
              {plan.precio_vigente == null && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Sin precio vigente cargado.
                </Typography>
              )}
            </Paper>

            <Divider />

            <Box>
              <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: 'center', mb: 1 }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600, flexGrow: 1 }}>
                  Historial de precios
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setPriceFormOpen(true)}
                >
                  Nuevo precio
                </Button>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Los precios vigentes e históricos son inmutables. Solo se pueden editar los futuros.
              </Typography>
              <PriceTable
                items={precios}
                loading={loadingPrecios}
                error={errorPrecios}
                onEdit={(p) => setEditingPrice(p)}
              />
            </Box>
          </Stack>
        )}
      </DialogContent>

      <Dialog
        open={priceFormOpen}
        onClose={handleClosePriceForm}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Registrar precio</DialogTitle>
        <DialogContent>
          <PriceForm
            mode="create"
            onSubmitCreate={handleCreatePrice}
            onCancel={handleClosePriceForm}
            loading={createPrice.isPending}
            error={createPrice.error}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={editingPrice != null}
        onClose={handleCloseEditPrice}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Editar precio futuro</DialogTitle>
        <DialogContent>
          {editingPrice && (
            <PriceForm
              mode="edit"
              initialPrice={editingPrice}
              onSubmitUpdate={handleUpdatePrice}
              onCancel={handleCloseEditPrice}
              loading={updatePrice.isPending}
              error={updatePrice.error}
            />
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
