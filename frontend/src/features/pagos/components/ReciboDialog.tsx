import { Button, Dialog, DialogActions, DialogContent } from '@mui/material'
import PrintIcon from '@mui/icons-material/Print'
import ReciboDocument from './ReciboDocument'
import type { PagoDetalleOut, PagoMovimientoOut } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  detalle: PagoDetalleOut
  mov: PagoMovimientoOut
  medioLabel: string
  tipoLabel: string
}

export default function ReciboDialog({
  open,
  onClose,
  detalle,
  mov,
  medioLabel,
  tipoLabel,
}: Props) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogContent>
        <ReciboDocument
          detalle={detalle}
          mov={mov}
          medioLabel={medioLabel}
          tipoLabel={tipoLabel}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
        <Button onClick={() => window.print()} startIcon={<PrintIcon />} variant="contained">
          Imprimir
        </Button>
      </DialogActions>
    </Dialog>
  )
}
