import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { useSnackbar } from '@/components/ui/SnackbarProvider'

interface PasswordTemporalDialogProps {
  open: boolean
  username: string
  password: string
  onClose: () => void
}

export default function PasswordTemporalDialog({
  open,
  username,
  password,
  onClose,
}: PasswordTemporalDialogProps) {
  const snackbar = useSnackbar()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password)
      snackbar.showSuccess('Contraseña copiada.')
    } catch {
      snackbar.showError('No se pudo copiar. Seleccioná el texto y copialo a mano.')
    }
  }

  // Sin onClose en Dialog: ni backdrop ni Escape cierran; solo "Listo".
  return (
    <Dialog open={open} maxWidth="xs" fullWidth>
      <DialogTitle>Contraseña temporal</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Contraseña temporal de &quot;{username}&quot;:
        </DialogContentText>
        <Box
          sx={{
            my: 2,
            p: 2,
            textAlign: 'center',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            bgcolor: 'action.hover',
            fontFamily: 'monospace',
            fontSize: { xs: '1.4rem', sm: '1.75rem' },
            fontWeight: 600,
            letterSpacing: 1,
            wordBreak: 'break-all',
            userSelect: 'all',
          }}
        >
          {password}
        </Box>
        <Alert severity="warning">
          Esta contraseña no se vuelve a mostrar. Entregásela al usuario por un canal
          seguro; deberá cambiarla al ingresar.
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button startIcon={<ContentCopyIcon />} onClick={handleCopy}>
          Copiar
        </Button>
        <Button variant="contained" onClick={onClose}>
          Listo
        </Button>
      </DialogActions>
    </Dialog>
  )
}
