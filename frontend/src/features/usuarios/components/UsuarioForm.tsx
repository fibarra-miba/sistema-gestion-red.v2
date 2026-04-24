import {
  Alert,
  Button,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
} from '@mui/material'
import { useForm } from 'react-hook-form'
import { PASSWORD_POLICY, validatePassword } from '@/features/auth'
import { isApiError } from '@/types/api'
import { useRoles } from '../hooks/useRoles'
import type { UsuarioOut } from '../types'

export interface UsuarioFormValues {
  codigo_rol: string
  username_usuario: string
  email_usuario: string
  nombre_usuario: string
  apellido_usuario: string
  password: string
  activo_usuario: boolean
}

interface Props {
  mode: 'create' | 'edit'
  initial?: UsuarioOut
  loading?: boolean
  error?: unknown
  onSubmit: (values: UsuarioFormValues) => void | Promise<void>
  onCancel?: () => void
  submitLabel?: string
}

export default function UsuarioForm({
  mode,
  initial,
  loading,
  error,
  onSubmit,
  onCancel,
  submitLabel,
}: Props) {
  const rolesQuery = useRoles()
  const roles = rolesQuery.data ?? []

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<UsuarioFormValues>({
    mode: 'onTouched',
    defaultValues: {
      codigo_rol: initial?.codigo_rol ?? '',
      username_usuario: initial?.username_usuario ?? '',
      email_usuario: initial?.email_usuario ?? '',
      nombre_usuario: initial?.nombre_usuario ?? '',
      apellido_usuario: initial?.apellido_usuario ?? '',
      password: '',
      activo_usuario: initial?.activo_usuario ?? true,
    },
  })

  const errorMsg = resolveError(error)
  const isCreate = mode === 'create'

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={2} sx={{ pt: 1 }}>
        {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label="Nombre"
            fullWidth
            disabled={loading}
            error={!!errors.nombre_usuario}
            helperText={errors.nombre_usuario?.message ?? ' '}
            {...register('nombre_usuario', {
              required: 'Ingresá el nombre.',
              maxLength: { value: 100, message: 'Máximo 100 caracteres.' },
            })}
          />
          <TextField
            label="Apellido"
            fullWidth
            disabled={loading}
            error={!!errors.apellido_usuario}
            helperText={errors.apellido_usuario?.message ?? ' '}
            {...register('apellido_usuario', {
              required: 'Ingresá el apellido.',
              maxLength: { value: 100, message: 'Máximo 100 caracteres.' },
            })}
          />
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label="Usuario"
            fullWidth
            disabled={loading}
            error={!!errors.username_usuario}
            helperText={errors.username_usuario?.message ?? ' '}
            {...register('username_usuario', {
              required: 'Ingresá el nombre de usuario.',
              minLength: { value: 3, message: 'Mínimo 3 caracteres.' },
              maxLength: { value: 50, message: 'Máximo 50 caracteres.' },
            })}
          />
          <TextField
            label="Email"
            type="email"
            fullWidth
            disabled={loading}
            error={!!errors.email_usuario}
            helperText={errors.email_usuario?.message ?? ' '}
            {...register('email_usuario', {
              required: 'Ingresá el email.',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Email inválido.',
              },
            })}
          />
        </Stack>

        <TextField
          label="Rol"
          select
          fullWidth
          disabled={loading || rolesQuery.isLoading}
          error={!!errors.codigo_rol}
          helperText={errors.codigo_rol?.message ?? ' '}
          {...register('codigo_rol', { required: 'Seleccioná un rol.' })}
          defaultValue={initial?.codigo_rol ?? ''}
        >
          {roles.length === 0 && (
            <MenuItem value="" disabled>
              {rolesQuery.isLoading ? 'Cargando roles…' : 'Sin roles disponibles'}
            </MenuItem>
          )}
          {roles.map((r) => (
            <MenuItem key={r.rol_id} value={r.codigo_rol}>
              {r.nombre_rol}
            </MenuItem>
          ))}
        </TextField>

        {isCreate && (
          <TextField
            label="Contraseña inicial"
            type="password"
            autoComplete="new-password"
            fullWidth
            disabled={loading}
            error={!!errors.password}
            helperText={errors.password?.message ?? PASSWORD_POLICY.helperText}
            {...register('password', {
              required: 'Ingresá una contraseña inicial.',
              validate: (value) => validatePassword(value) ?? true,
            })}
          />
        )}

        <FormControlLabel
          control={
            <Switch
              defaultChecked={initial?.activo_usuario ?? true}
              disabled={loading}
              {...register('activo_usuario')}
            />
          }
          label="Usuario activo"
        />

        <Stack
          direction="row"
          spacing={1}
          sx={{ pt: 1, justifyContent: 'flex-end' }}
        >
          {onCancel && (
            <Button onClick={onCancel} disabled={loading}>
              Cancelar
            </Button>
          )}
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !isValid}
          >
            {submitLabel ?? (isCreate ? 'Crear usuario' : 'Guardar cambios')}
          </Button>
        </Stack>
      </Stack>
    </form>
  )
}

function resolveError(error: unknown): string | null {
  if (!error) return null
  if (isApiError(error)) {
    if (error.status === 409) return 'Ya existe un usuario con ese username o email.'
    return error.detail
  }
  return 'Error inesperado.'
}
