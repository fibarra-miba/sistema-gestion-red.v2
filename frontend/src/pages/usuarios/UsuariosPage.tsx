import { useState } from 'react'
import {
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Tooltip,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import LockResetIcon from '@mui/icons-material/LockReset'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import PageHeader from '@/components/ui/PageHeader'
import { useSnackbar } from '@/components/ui/SnackbarProvider'
import {
  useCreateUsuario,
  useResetPassword,
  useUpdateUsuario,
  useUsuarios,
  type UsuarioCreate,
  type UsuarioOut,
  type UsuarioUpdate,
} from '@/features/usuarios'
import UsuarioForm, {
  type UsuarioFormValues,
} from '@/features/usuarios/components/UsuarioForm'

export default function UsuariosPage() {
  const snackbar = useSnackbar()
  const { data, isLoading, error } = useUsuarios()
  const createMutation = useCreateUsuario()
  const updateMutation = useUpdateUsuario()
  const resetMutation = useResetPassword()

  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<UsuarioOut | null>(null)
  const [resetting, setResetting] = useState<UsuarioOut | null>(null)

  const columns: DataTableColumn<UsuarioOut>[] = [
    {
      key: 'username_usuario',
      label: 'Usuario',
      render: (u) => u.username_usuario,
    },
    {
      key: 'nombre_usuario',
      label: 'Nombre',
      render: (u) => `${u.apellido_usuario}, ${u.nombre_usuario}`,
      showFrom: 'sm',
    },
    {
      key: 'email_usuario',
      label: 'Email',
      showFrom: 'md',
      render: (u) => u.email_usuario,
    },
    {
      key: 'nombre_rol',
      label: 'Rol',
      width: 140,
      render: (u) => <Chip label={u.nombre_rol} size="small" />,
    },
    {
      key: 'estado',
      label: 'Estado',
      width: 130,
      showFrom: 'sm',
      render: (u) =>
        u.activo_usuario ? (
          <Chip label="Activo" color="success" size="small" variant="outlined" />
        ) : (
          <Chip label="Inactivo" color="default" size="small" variant="outlined" />
        ),
    },
    {
      key: 'requiere_cambio_password_usuario',
      label: 'Password',
      width: 140,
      showFrom: 'md',
      render: (u) =>
        u.requiere_cambio_password_usuario ? (
          <Chip label="Debe cambiar" color="warning" size="small" />
        ) : (
          <Chip label="OK" size="small" variant="outlined" />
        ),
    },
    {
      key: 'acciones',
      label: '',
      width: 110,
      align: 'right',
      render: (u) => (
        <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
          <Tooltip title="Editar usuario">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation()
                setEditing(u)
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Resetear contraseña">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation()
                setResetting(u)
              }}
            >
              <LockResetIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ]

  const handleCreate = async (values: UsuarioFormValues) => {
    const payload: UsuarioCreate = {
      codigo_rol: values.codigo_rol,
      username_usuario: values.username_usuario.trim(),
      email_usuario: values.email_usuario.trim(),
      password: values.password,
      nombre_usuario: values.nombre_usuario.trim(),
      apellido_usuario: values.apellido_usuario.trim(),
      activo_usuario: values.activo_usuario,
      requiere_cambio_password_usuario: false,
    }
    await createMutation.mutateAsync(payload)
    snackbar.showSuccess('Usuario creado.')
    setCreateOpen(false)
    createMutation.reset()
  }

  const handleUpdate = async (values: UsuarioFormValues) => {
    if (!editing) return
    const payload: UsuarioUpdate = {
      codigo_rol: values.codigo_rol,
      username_usuario: values.username_usuario.trim(),
      email_usuario: values.email_usuario.trim(),
      nombre_usuario: values.nombre_usuario.trim(),
      apellido_usuario: values.apellido_usuario.trim(),
      activo_usuario: values.activo_usuario,
    }
    await updateMutation.mutateAsync({ usuarioId: editing.usuario_id, payload })
    snackbar.showSuccess('Usuario actualizado.')
    setEditing(null)
    updateMutation.reset()
  }

  const handleReset = async () => {
    if (!resetting) return
    await resetMutation.mutateAsync(resetting.usuario_id)
    snackbar.showSuccess(
      `Contraseña reseteada a "Inicio.01". Se pedirá cambio al próximo login.`,
    )
    setResetting(null)
    resetMutation.reset()
  }

  return (
    <Stack spacing={{ xs: 2, md: 2.5 }} sx={{ minWidth: 0 }}>
      <PageHeader
        title="Usuarios"
        subtitle="Gestión de accesos al sistema."
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
          >
            Nuevo usuario
          </Button>
        }
      />

      <DataTable<UsuarioOut>
        columns={columns}
        rows={data}
        loading={isLoading}
        error={error}
        getRowKey={(u) => u.usuario_id}
        emptyMessage="Todavía no hay usuarios cargados."
      />

      <Dialog
        open={createOpen}
        onClose={() => {
          if (createMutation.isPending) return
          setCreateOpen(false)
          createMutation.reset()
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Nuevo usuario</DialogTitle>
        <DialogContent>
          <UsuarioForm
            mode="create"
            loading={createMutation.isPending}
            error={createMutation.error}
            onSubmit={handleCreate}
            onCancel={() => {
              setCreateOpen(false)
              createMutation.reset()
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editing}
        onClose={() => {
          if (updateMutation.isPending) return
          setEditing(null)
          updateMutation.reset()
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Editar usuario</DialogTitle>
        <DialogContent>
          {editing && (
            <UsuarioForm
              mode="edit"
              initial={editing}
              loading={updateMutation.isPending}
              error={updateMutation.error}
              onSubmit={handleUpdate}
              onCancel={() => {
                setEditing(null)
                updateMutation.reset()
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!resetting}
        title="Resetear contraseña"
        description={
          resetting
            ? `Se reseteará la contraseña de "${resetting.username_usuario}" a "Inicio.01". El usuario deberá cambiarla en el próximo ingreso.`
            : ''
        }
        confirmLabel="Resetear"
        confirmColor="warning"
        loading={resetMutation.isPending}
        error={resetMutation.error}
        onConfirm={handleReset}
        onCancel={() => {
          if (resetMutation.isPending) return
          setResetting(null)
          resetMutation.reset()
        }}
      />
    </Stack>
  )
}
