import { useMemo, useState } from 'react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  InputAdornment,
  Stack,
  TextField,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import { useNavigate } from 'react-router-dom'
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable'
import FilterBar from '@/components/ui/FilterBar'
import PageHeader from '@/components/ui/PageHeader'
import { useDebounce } from '@/hooks/useDebounce'
import {
  useClientes,
  useCreateCliente,
  type ClienteOut,
  type ClienteCreate,
} from '@/features/clientes'
import ClienteForm, { type ClienteFormValues } from '@/features/clientes/components/ClienteForm'

const DEFAULT_LIMIT = 25
const DEFAULT_ESTADO_CLIENTE_ID = 1

export default function ClientesListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [limit, setLimit] = useState(DEFAULT_LIMIT)
  const [offset, setOffset] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)

  const params = useMemo(
    () => ({
      limit,
      offset,
      ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
    }),
    [limit, offset, debouncedSearch],
  )

  const { data, isLoading, error } = useClientes(params)
  const createMutation = useCreateCliente()

  const columns: DataTableColumn<ClienteOut>[] = [
    { key: 'dni_cliente', label: 'DNI', width: 140, showFrom: 'sm' },
    {
      key: 'nombre_cliente',
      label: 'Nombre',
      render: (r) => `${r.apellido_cliente}, ${r.nombre_cliente}`,
    },
    {
      key: 'telefono_cliente',
      label: 'Teléfono',
      width: 160,
      showFrom: 'md',
    },
    {
      key: 'email_cliente',
      label: 'Email',
      showFrom: 'lg',
      render: (r) => r.email_cliente ?? '—',
    },
  ]

  const handleCreate = async (values: ClienteFormValues) => {
    const payload: ClienteCreate = {
      nombre: values.nombre.trim(),
      apellido: values.apellido.trim(),
      dni: values.dni.trim(),
      telefono: values.telefono.trim(),
      email: values.email.trim() || null,
      observaciones: values.observaciones.trim() || null,
      estado_cliente_id: DEFAULT_ESTADO_CLIENTE_ID,
    }

    const cliente = await createMutation.mutateAsync(payload)
    setCreateOpen(false)
    createMutation.reset()
    navigate(`/clientes/${cliente.cliente_id}`)
  }

  const handleCloseCreate = () => {
    if (createMutation.isPending) return
    setCreateOpen(false)
    createMutation.reset()
  }

  return (
    <Stack spacing={{ xs: 2, md: 2.5 }} sx={{ minWidth: 0 }}>
      <PageHeader
        title="Clientes"
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
          >
            Nuevo cliente
          </Button>
        }
      />

      <FilterBar>
        <TextField
          placeholder="Buscar por DNI, nombre o apellido"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setOffset(0)
          }}
          size="small"
          fullWidth
          sx={{ maxWidth: { sm: 420 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
      </FilterBar>

      <DataTable<ClienteOut>
        columns={columns}
        rows={data}
        loading={isLoading}
        error={error}
        getRowKey={(r) => r.cliente_id}
        onRowClick={(r) => navigate(`/clientes/${r.cliente_id}`)}
        emptyMessage={
          debouncedSearch
            ? 'Sin clientes que coincidan con la búsqueda.'
            : 'Todavía no hay clientes cargados.'
        }
        pagination={{
          limit,
          offset,
          onChange: ({ limit: nextLimit, offset: nextOffset }) => {
            setLimit(nextLimit)
            setOffset(nextOffset)
          },
        }}
      />

      <Dialog open={createOpen} onClose={handleCloseCreate} maxWidth="sm" fullWidth>
        <DialogTitle>Nuevo cliente</DialogTitle>
        <DialogContent>
          <ClienteForm
            onSubmit={handleCreate}
            onCancel={handleCloseCreate}
            loading={createMutation.isPending}
            error={createMutation.error}
            submitLabel="Crear cliente"
          />
        </DialogContent>
      </Dialog>
    </Stack>
  )
}
