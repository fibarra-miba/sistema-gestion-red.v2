import { Button, Chip, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import ToggleOnIcon from '@mui/icons-material/ToggleOn'
import ToggleOffIcon from '@mui/icons-material/ToggleOff'
import DataTable, {
  type DataTableColumn,
  type DataTablePagination,
} from '@/components/ui/DataTable'
import type { ProductoOut } from '../types'

interface ProductoTableProps {
  productos: ProductoOut[] | undefined
  loading?: boolean
  error?: unknown
  pagination?: DataTablePagination
  canManage?: boolean
  onEdit: (producto: ProductoOut) => void
  // Acceso directo a cargar existencia: es el paso natural justo después de
  // dar de alta un producto, y desde acá se evita ir a buscarlo a Stock.
  onCargarStock?: (producto: ProductoOut) => void
  onToggleActivo: (producto: ProductoOut) => void
}

export default function ProductoTable({
  productos,
  loading,
  error,
  pagination,
  canManage = false,
  onEdit,
  onCargarStock,
  onToggleActivo,
}: ProductoTableProps) {
  const columns: DataTableColumn<ProductoOut>[] = [
    { key: 'producto_id', label: '#', width: 72, showFrom: 'md' },
    {
      key: 'nombre_producto',
      label: 'Producto',
      render: (r) => (
        <Stack sx={{ minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
            {r.nombre_producto}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            noWrap
            sx={{ display: { xs: 'block', md: 'none' } }}
          >
            {r.marca_producto} {r.modelo_producto}
          </Typography>
        </Stack>
      ),
    },
    {
      key: 'marca_producto',
      label: 'Marca / Modelo',
      showFrom: 'md',
      render: (r) => (
        <Typography variant="body2" noWrap>
          {r.marca_producto} {r.modelo_producto}
        </Typography>
      ),
    },
    {
      key: 'tipo',
      label: 'Tipo',
      width: 150,
      showFrom: 'sm',
      render: (r) => (
        <Chip
          label={r.descripcion_tproducto ?? '—'}
          size="small"
          variant="outlined"
          color={r.codigo_tproducto === 'EQUIPO' ? 'primary' : 'default'}
        />
      ),
    },
    {
      key: 'activo_producto',
      label: 'Estado',
      width: 110,
      showFrom: 'sm',
      render: (r) => (
        <Chip
          label={r.activo_producto ? 'Activo' : 'Inactivo'}
          color={r.activo_producto ? 'success' : 'default'}
          size="small"
          variant={r.activo_producto ? 'filled' : 'outlined'}
        />
      ),
    },
  ]

  if (canManage) {
    columns.push({
      key: 'acciones',
      label: '',
      width: 230,
      align: 'right',
      render: (r) => (
        <Stack
          direction="row"
          spacing={0.25}
          sx={{ justifyContent: 'flex-end' }}
          onClick={(e) => e.stopPropagation()}
        >
          <Tooltip title="Editar">
            <IconButton size="small" onClick={() => onEdit(r)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {onCargarStock && (
            <Button
              size="small"
              startIcon={<Inventory2OutlinedIcon fontSize="small" />}
              onClick={() => onCargarStock(r)}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Cargar stock
            </Button>
          )}
          <Tooltip title={r.activo_producto ? 'Desactivar' : 'Activar'}>
            <IconButton
              size="small"
              color={r.activo_producto ? 'error' : 'success'}
              onClick={() => onToggleActivo(r)}
            >
              {r.activo_producto ? (
                <ToggleOffIcon fontSize="small" />
              ) : (
                <ToggleOnIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    })
  }

  return (
    <DataTable<ProductoOut>
      columns={columns}
      rows={productos}
      loading={loading}
      error={error}
      pagination={pagination}
      getRowKey={(r) => r.producto_id}
      onRowClick={canManage ? onEdit : undefined}
      emptyMessage="No hay productos para los filtros aplicados."
    />
  )
}
