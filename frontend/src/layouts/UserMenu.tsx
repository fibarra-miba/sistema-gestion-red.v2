import { useRef, useState } from 'react'
import {
  Avatar,
  Box,
  Chip,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import LogoutIcon from '@mui/icons-material/Logout'
import KeyIcon from '@mui/icons-material/Key'
import { useNavigate } from 'react-router-dom'
import { useAuth, useLogout } from '@/features/auth'
import { useSnackbar } from '@/components/ui/SnackbarProvider'

function initialsOf(nombre: string, apellido: string): string {
  const n = nombre.trim().charAt(0)
  const a = apellido.trim().charAt(0)
  return (n + a).toUpperCase() || '?'
}

export default function UserMenu() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const snackbar = useSnackbar()
  const logout = useLogout()
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLButtonElement | null>(null)

  if (!user) return null

  const handleLogout = async () => {
    setOpen(false)
    try {
      await logout.mutateAsync()
    } catch {
      // La mutación limpia cache igualmente en onSettled — ignorar errores.
    }
    snackbar.showInfo('Sesión cerrada.')
    navigate('/login', { replace: true })
  }

  const handleChangePassword = () => {
    setOpen(false)
    navigate('/change-password')
  }

  const fullName = `${user.nombre_usuario} ${user.apellido_usuario}`.trim()

  return (
    <>
      <Tooltip title={fullName || user.username_usuario}>
        <IconButton
          ref={anchorRef}
          size="small"
          onClick={() => setOpen(true)}
          sx={{ ml: 1 }}
          aria-label="menú de usuario"
        >
          <Avatar
            sx={{
              width: 32,
              height: 32,
              fontSize: 13,
              fontWeight: 700,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
            }}
          >
            {initialsOf(user.nombre_usuario, user.apellido_usuario)}
          </Avatar>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorRef.current}
        open={open}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { minWidth: 240 } } }}
      >
        <Box sx={{ px: 2, py: 1.25 }}>
          <Stack spacing={0.25}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
              {fullName || user.username_usuario}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user.email_usuario}
            </Typography>
            <Box sx={{ pt: 0.5 }}>
              <Chip
                label={user.rol.nombre_rol}
                size="small"
                color="primary"
                variant="outlined"
              />
            </Box>
          </Stack>
        </Box>
        <Divider />
        <MenuItem onClick={handleChangePassword}>
          <ListItemIcon>
            <KeyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Cambiar contraseña</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleLogout} disabled={logout.isPending}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{logout.isPending ? 'Cerrando sesión…' : 'Cerrar sesión'}</ListItemText>
        </MenuItem>
      </Menu>
    </>
  )
}
