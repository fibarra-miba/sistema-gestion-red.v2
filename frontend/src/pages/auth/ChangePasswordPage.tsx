import { useState } from 'react'
import {
  Alert,
  Button,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '@/layouts/AuthLayout'
import {
  PASSWORD_POLICY,
  useAuth,
  useChangePassword,
  validatePassword,
} from '@/features/auth'
import { useSnackbar } from '@/components/ui/SnackbarProvider'
import { isApiError } from '@/types/api'

interface ChangePasswordFormValues {
  current_password: string
  new_password: string
  confirm_password: string
}

export default function ChangePasswordPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const snackbar = useSnackbar()
  const changePassword = useChangePassword()
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<ChangePasswordFormValues>({
    mode: 'onTouched',
    defaultValues: {
      current_password: '',
      new_password: '',
      confirm_password: '',
    },
  })

  const newPasswordValue = watch('new_password')

  const forced = !!user?.requiere_cambio_password_usuario
  const submitting = changePassword.isPending
  const errorMsg = resolveError(changePassword.error)

  const onSubmit = async (values: ChangePasswordFormValues) => {
    await changePassword.mutateAsync({
      current_password: values.current_password,
      new_password: values.new_password,
      revoke_all_sessions: true,
    })

    snackbar.showSuccess('Contraseña actualizada. Ingresá nuevamente.')
    navigate('/login', { replace: true })
  }

  return (
    <AuthLayout
      title={forced ? 'Cambio de contraseña obligatorio' : 'Cambiar contraseña'}
      subtitle={
        forced
          ? 'Tu contraseña fue reseteada. Definí una nueva antes de continuar.'
          : 'Ingresá tu contraseña actual y definí una nueva.'
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2}>
          {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

          <TextField
            label="Contraseña actual"
            type={showCurrent ? 'text' : 'password'}
            autoComplete="current-password"
            autoFocus
            fullWidth
            disabled={submitting}
            error={!!errors.current_password}
            helperText={errors.current_password?.message ?? ' '}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => setShowCurrent((v) => !v)}
                      tabIndex={-1}
                      aria-label="Mostrar / ocultar"
                    >
                      {showCurrent ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
            {...register('current_password', {
              required: 'Ingresá tu contraseña actual.',
            })}
          />

          <TextField
            label="Contraseña nueva"
            type={showNew ? 'text' : 'password'}
            autoComplete="new-password"
            fullWidth
            disabled={submitting}
            error={!!errors.new_password}
            helperText={errors.new_password?.message ?? PASSWORD_POLICY.helperText}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => setShowNew((v) => !v)}
                      tabIndex={-1}
                      aria-label="Mostrar / ocultar"
                    >
                      {showNew ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
            {...register('new_password', {
              required: 'Ingresá una contraseña nueva.',
              validate: (value) => validatePassword(value) ?? true,
            })}
          />

          <TextField
            label="Repetir contraseña nueva"
            type={showNew ? 'text' : 'password'}
            autoComplete="new-password"
            fullWidth
            disabled={submitting}
            error={!!errors.confirm_password}
            helperText={errors.confirm_password?.message ?? ' '}
            {...register('confirm_password', {
              required: 'Repetí la contraseña nueva.',
              validate: (value) =>
                value === newPasswordValue || 'Las contraseñas no coinciden.',
            })}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={submitting || !isValid}
          >
            {submitting ? 'Actualizando…' : 'Actualizar contraseña'}
          </Button>
        </Stack>
      </form>
    </AuthLayout>
  )
}

function resolveError(error: unknown): string | null {
  if (!error) return null
  if (isApiError(error)) {
    if (error.isNetworkError) {
      return 'No se pudo conectar con el servidor.'
    }
    return error.detail
  }
  return 'Error inesperado al actualizar la contraseña.'
}
