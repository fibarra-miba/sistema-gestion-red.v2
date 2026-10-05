import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material'
import { formatCurrencyARS } from '@/lib/format'
import { cobroGarantiaLabel } from '../utils'
import GarantiaCobrosList from './GarantiaCobrosList'
import type { GarantiaOut } from '../types'

interface Props {
  garantia: GarantiaOut | null
  canCobrar: boolean
  onClose: () => void
}

// Cobros de un depósito en diálogo (contenido en GarantiaCobrosList).
export default function GarantiaCobrosDialog({ garantia, canCobrar, onClose }: Props) {
  return (
    <Dialog open={garantia != null} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Cobros del depósito</DialogTitle>
      <DialogContent dividers>
        {garantia && (
          <Stack spacing={2}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {garantia.nombre_producto ?? `#${garantia.producto_id}`} {garantia.marca_producto}{' '}
                {garantia.modelo_producto}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {cobroGarantiaLabel(garantia).text} · Garantía{' '}
                {formatCurrencyARS(garantia.monto_garantia)}
              </Typography>
            </Box>
            <GarantiaCobrosList garantia={garantia} canCobrar={canCobrar} />
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  )
}
