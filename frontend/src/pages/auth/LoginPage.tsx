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
import { useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '@/layouts/AuthLayout'
import { useLogin } from '@/features/auth'
import type { LoginRequest } from '@/features/auth'
import { isApiError } from '@/types/api'

interface LoginFormValues {
  identifier: string
  password: string
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useLogin()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginFormValues>({
    mode: 'onTouched',
    defaultValues: { identifier: '', password: '' },
  })

  const fromPath =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/'

  const onSubmit = async (values: LoginFormValues) => {
    const payload: LoginRequest = {
      identifier: values.identifier.trim(),
      password: values.password,
    }

    const user = await login.mutateAsync(payload)

    // Si el usuario debe cambiar la contraseña, enviarlo al flujo correspondiente.
    const target = user.requiere_cambio_password_usuario
      ? '/change-password'
      : fromPath && fromPath !== '/login'
        ? fromPath
        : '/'

    navigate(target, { replace: true })
  }

  const submitting = login.isPending
  const errorMsg = resolveLoginError(login.error)

  return (
    <AuthLayout title="Iniciar sesión" subtitle="Ingresá con tu usuario corporativo.">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2}>
          {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

          <TextField
            label="Usuario o email"
            autoComplete="username"
            autoFocus
            fullWidth
            disabled={submitting}
            error={!!errors.identifier}
            helperText={errors.identifier?.message ?? ' '}
            {...register('identifier', {
              required: 'Ingresá tu usuario o email.',
              maxLength: { value: 100, message: 'Máximo 100 caracteres.' },
            })}
          />

          <TextField
            label="Contraseña"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            fullWidth
            disabled={submitting}
            error={!!errors.password}
            helperText={errors.password?.message ?? ' '}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      tabIndex={-1}
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
            {...register('password', {
              required: 'Ingresá tu contraseña.',
            })}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={submitting || !isValid}
          >
            {submitting ? 'Ingresando…' : 'Ingresar'}
          </Button>
        </Stack>
      </form>
    </AuthLayout>
  )
}

function resolveLoginError(error: unknown): string | null {
  if (!error) return null
  if (isApiError(error)) {
    if (error.isNetworkError) {
      return 'No se pudo conectar con el servidor. Verificá tu conexión.'
    }
    if (error.status === 401) {
      return 'Usuario o contraseña incorrectos.'
    }
    return error.detail
  }
  return 'Error inesperado al iniciar sesión.'
}
