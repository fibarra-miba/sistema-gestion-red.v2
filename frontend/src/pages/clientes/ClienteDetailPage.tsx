import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EditIcon from '@mui/icons-material/Edit'
import { useParams, Link as RouterLink } from 'react-router-dom'
import { isApiError } from '@/types/api'
import {
  useCliente,
  useUpdateCliente,
  useDomicilioVigente,
  useDomiciliosHistorial,
  useCreateDomicilio,
  type ClienteUpdate,
  type DomicilioCreate,
} from '@/features/clientes'
import ClienteForm, { type ClienteFormValues } from '@/features/clientes/components/ClienteForm'
import DomicilioVigenteCard from '@/features/clientes/components/domicilios/DomicilioVigenteCard'
import DomicilioHistorialList from '@/features/clientes/components/domicilios/DomicilioHistorialList'
import DomicilioForm, {
  type DomicilioFormValues,
} from '@/features/clientes/components/domicilios/DomicilioForm'

const DEFAULT_ESTADO_DOMICILIO_ID = 1

export default function ClienteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const clienteId = id && /^\d+$/.test(id) ? Number(id) : undefined

  const clienteQuery = useCliente(clienteId)
  const vigenteQuery = useDomicilioVigente(clienteId)
  const historialQuery = useDomiciliosHistorial(clienteId)
  const updateMutation = useUpdateCliente()
  const createDomMutation = useCreateDomicilio()

  const [editOpen, setEditOpen] = useState(false)
  const [domOpen, setDomOpen] = useState(false)

  if (clienteId == null) {
    return <Alert severity="error">ID de cliente inválido.</Alert>
  }

  if (clienteQuery.isLoading) {
    return (
      <Stack sx={{ alignItems: 'center', py: 6 }}>
        <CircularProgress />
      </Stack>
    )
  }

  if (clienteQuery.error) {
    const err = clienteQuery.error
    const detail = isApiError(err) ? err.detail : 'Error al cargar el cliente.'
    const isNotFound = isApiError(err) && err.status === 404
    return (
      <Stack spacing={2}>
        <Alert severity={isNotFound ? 'warning' : 'error'}>{detail}</Alert>
        <Box>
          <Button component={RouterLink} to="/clientes" startIcon={<ArrowBackIcon />}>
            Volver al listado
          </Button>
        </Box>
      </Stack>
    )
  }

  const cliente = clienteQuery.data
  if (!cliente) return null

  const handleUpdate = async (values: ClienteFormValues) => {
    const payload: ClienteUpdate = {
      nombre: values.nombre.trim(),
      apellido: values.apellido.trim(),
      dni: values.dni.trim(),
      telefono: values.telefono.trim(),
      email: values.email.trim() || null,
      observaciones: values.observaciones.trim() || null,
    }
    await updateMutation.mutateAsync({ clienteId, payload })
    setEditOpen(false)
    updateMutation.reset()
  }

  const handleCloseEdit = () => {
    if (updateMutation.isPending) return
    setEditOpen(false)
    updateMutation.reset()
  }

  const handleCreateDomicilio = async (values: DomicilioFormValues) => {
    const payload: DomicilioCreate = {
      calle: values.calle.trim() || null,
      numero: values.numero.trim() ? Number(values.numero) : null,
      complejo: values.complejo.trim() || null,
      piso: values.piso.trim() ? Number(values.piso) : null,
      depto: values.depto.trim() || null,
      referencias: values.referencias.trim() || null,
      estado_domicilio_id: DEFAULT_ESTADO_DOMICILIO_ID,
    }
    await createDomMutation.mutateAsync({ clienteId, payload })
    setDomOpen(false)
    createDomMutation.reset()
  }

  const handleCloseDom = () => {
    if (createDomMutation.isPending) return
    setDomOpen(false)
    createDomMutation.reset()
  }

  const reemplazaVigente = !!vigenteQuery.data

  return (
    <Stack spacing={{ xs: 2, md: 3 }} sx={{ minWidth: 0 }}>
      <Box>
        <Button
          component={RouterLink}
          to="/clientes"
          startIcon={<ArrowBackIcon />}
          size="small"
        >
          Clientes
        </Button>
      </Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={{ xs: 1.5, sm: 2 }}
        sx={{
          alignItems: { sm: 'center' },
          justifyContent: 'space-between',
          minWidth: 0,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            component="h1"
            variant="h5"
            sx={{ fontWeight: 700, lineHeight: 1.2 }}
            noWrap
          >
            {cliente.apellido_cliente}, {cliente.nombre_cliente}
          </Typography>
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center', mt: 0.75, flexWrap: 'wrap', rowGap: 0.5 }}
          >
            <Chip label={`DNI ${cliente.dni_cliente}`} size="small" variant="outlined" />
            <Chip
              label={`Estado ${cliente.estado_cliente_id}`}
              size="small"
              variant="outlined"
            />
          </Stack>
        </Box>
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={() => setEditOpen(true)}
          sx={{ alignSelf: { xs: 'stretch', sm: 'center' }, flexShrink: 0 }}
        >
          Editar
        </Button>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          Datos de contacto
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
          <Field label="Teléfono" value={cliente.telefono_cliente} />
          <Field label="Email" value={cliente.email_cliente ?? '—'} />
          <Field label="Alta" value={formatAlta(cliente.fecha_alta_cliente)} />
        </Stack>
        {cliente.observacion_cliente && (
          <>
            <Divider sx={{ my: 2 }} />
            <Field label="Observaciones" value={cliente.observacion_cliente} />
          </>
        )}
      </Paper>

      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          Domicilios
        </Typography>
        <Stack spacing={2}>
          <DomicilioVigenteCard
            domicilio={vigenteQuery.data}
            loading={vigenteQuery.isLoading}
            error={vigenteQuery.error}
            onCreate={() => setDomOpen(true)}
            onChange={() => setDomOpen(true)}
          />
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Historial
            </Typography>
            <DomicilioHistorialList
              items={historialQuery.data}
              loading={historialQuery.isLoading}
              error={historialQuery.error}
            />
          </Box>
        </Stack>
      </Box>

      <Dialog open={editOpen} onClose={handleCloseEdit} maxWidth="sm" fullWidth>
        <DialogTitle>Editar cliente</DialogTitle>
        <DialogContent>
          <ClienteForm
            initialValues={{
              nombre: cliente.nombre_cliente,
              apellido: cliente.apellido_cliente,
              dni: cliente.dni_cliente,
              telefono: cliente.telefono_cliente,
              email: cliente.email_cliente ?? '',
              observaciones: cliente.observacion_cliente ?? '',
            }}
            onSubmit={handleUpdate}
            onCancel={handleCloseEdit}
            loading={updateMutation.isPending}
            error={updateMutation.error}
            submitLabel="Guardar cambios"
          />
        </DialogContent>
      </Dialog>

      <Dialog open={domOpen} onClose={handleCloseDom} maxWidth="sm" fullWidth>
        <DialogTitle>
          {reemplazaVigente ? 'Cambiar domicilio' : 'Crear primer domicilio'}
        </DialogTitle>
        <DialogContent>
          <DomicilioForm
            onSubmit={handleCreateDomicilio}
            onCancel={handleCloseDom}
            reemplazaVigente={reemplazaVigente}
            loading={createDomMutation.isPending}
            error={createDomMutation.error}
          />
        </DialogContent>
      </Dialog>
    </Stack>
  )
}

interface FieldProps {
  label: string
  value: string
}

function Field({ label, value }: FieldProps) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Box>
  )
}

function formatAlta(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString()
}
