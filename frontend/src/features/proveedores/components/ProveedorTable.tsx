import { Chip, IconButton, Tooltip } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DataTable, {
  type DataTableColumn,
  type DataTablePagination,
} from '@/components/ui/DataTable'
import type { ProveedorOut } from '../types'

interface Props {
  proveedores: ProveedorOut[] | undefined
  loading?: boolean
  error?: unknown
  canManage?: boolean
  onEdit?: (proveedor: ProveedorOut) => void
  pagination?: DataTablePagination
}

export default function ProveedorTable({
  proveedores,
  loading,
  error,
  canManage,
  onEdit,
  pagination,
}: Props) {
  const columns: DataTableColumn<ProveedorOut>[] = [
    { key: 'nombre_prov', label: 'Proveedor', render: (p) => p.nombre_prov ?? '—' },
    {
      key: 'telefono_prov',
      label: 'Teléfono',
      showFrom: 'sm',
      render: (p) => p.telefono_prov ?? '—',
    },
    {
      key: 'email_prov',
      label: 'Email',
      showFrom: 'md',
      render: (p) => p.email_prov ?? '—',
    },
    {
      key: 'descripcion_eprov',
      label: 'Estado',
      align: 'center',
      render: (p) => (
        <Chip
          size="small"
          label={p.descripcion_eprov ?? '—'}
          color={p.descripcion_eprov === 'ACTIVO' ? 'success' : 'default'}
          variant={p.descripcion_eprov === 'ACTIVO' ? 'filled' : 'outlined'}
        />
      ),
    },
  ]

  if (canManage) {
    columns.push({
      key: 'acciones',
      label: '',
      align: 'right',
      width: 64,
      render: (p) => (
        <Tooltip title="Editar">
          <IconButton size="small" onClick={() => onEdit?.(p)}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    })
  }

  return (
    <DataTable
      columns={columns}
      rows={proveedores}
      loading={loading}
      error={error}
      getRowKey={(p) => p.proveedor_id}
      emptyMessage="No hay proveedores."
      pagination={pagination}
    />
  )
}
