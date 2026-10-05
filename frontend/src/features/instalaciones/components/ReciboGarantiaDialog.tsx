import { Button, Dialog, DialogActions, DialogContent } from '@mui/material'
import PrintIcon from '@mui/icons-material/Print'
import ReciboGarantiaDocument from './ReciboGarantiaDocument'
import type { ReciboGarantiaOut } from '../types'

interface Props {
  recibo: ReciboGarantiaOut | null
  onClose: () => void
}

export default function ReciboGarantiaDialog({ recibo, onClose }: Props) {
  return (
    <Dialog open={recibo != null} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogContent>{recibo && <ReciboGarantiaDocument recibo={recibo} />}</DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
        <Button onClick={() => window.print()} startIcon={<PrintIcon />} variant="contained">
          Imprimir
        </Button>
      </DialogActions>
    </Dialog>
  )
}
