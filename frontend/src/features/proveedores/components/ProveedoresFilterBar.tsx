import { Box, Button, MenuItem, TextField } from '@mui/material'
import ClearIcon from '@mui/icons-material/Clear'
import FilterBar from '@/components/ui/FilterBar'
import { useEstadosProveedor } from '@/features/catalogos'
import type { ListProveedoresParams } from '../types'

interface Props {
  value: ListProveedoresParams
  onChange: (next: ListProveedoresParams) => void
}

export default function ProveedoresFilterBar({ value, onChange }: Props) {
  const { data: estados } = useEstadosProveedor()

  const setPatch = (patch: Partial<ListProveedoresParams>) =>
    onChange({ ...value, ...patch, offset: 0 })

  const handleClear = () => onChange({})

  const hasFilters = !!value.search || value.estado_proveedor_id != null

  return (
    <FilterBar
      actions={
        <Button
          variant="text"
          size="small"
          startIcon={<ClearIcon />}
          onClick={handleClear}
          disabled={!hasFilters}
        >
          Limpiar filtros
        </Button>
      }
    >
      <Box
        sx={{
          display: 'grid',
          gap: { xs: 1.5, sm: 2 },
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
          alignItems: 'start',
        }}
      >
        <TextField
          size="small"
          label="Buscar (nombre, email, teléfono)"
          value={value.search ?? ''}
          onChange={(e) => setPatch({ search: e.target.value || undefined })}
        />
        <TextField
          select
          size="small"
          label="Estado"
          value={value.estado_proveedor_id ?? ''}
          onChange={(e) =>
            setPatch({
              estado_proveedor_id: e.target.value ? Number(e.target.value) : undefined,
            })
          }
        >
          <MenuItem value="">Todos</MenuItem>
          {(estados ?? []).map((e) => (
            <MenuItem key={e.id} value={e.id}>
              {e.descripcion}
            </MenuItem>
          ))}
        </TextField>
      </Box>
    </FilterBar>
  )
}
