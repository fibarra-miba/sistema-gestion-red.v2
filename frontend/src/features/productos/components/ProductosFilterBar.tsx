import { Box, Button, MenuItem, TextField } from '@mui/material'
import ClearIcon from '@mui/icons-material/Clear'
import FilterBar from '@/components/ui/FilterBar'
import { useTiposProducto } from '@/features/catalogos'
import type { ListProductosParams } from '../types'

interface Props {
  value: ListProductosParams
  onChange: (next: ListProductosParams) => void
}

export default function ProductosFilterBar({ value, onChange }: Props) {
  const { data: tipos } = useTiposProducto()

  const setPatch = (patch: Partial<ListProductosParams>) =>
    onChange({ ...value, ...patch, offset: 0 })

  const handleClear = () => onChange({})

  const hasFilters =
    !!value.search || value.tipo_producto_id != null || !!value.solo_activos

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
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
            lg: 'repeat(3, minmax(0, 1fr))',
          },
          alignItems: 'start',
        }}
      >
        <TextField
          size="small"
          label="Buscar (nombre, marca, modelo)"
          value={value.search ?? ''}
          onChange={(e) => setPatch({ search: e.target.value || undefined })}
        />
        <TextField
          select
          size="small"
          label="Tipo"
          value={value.tipo_producto_id ?? ''}
          onChange={(e) =>
            setPatch({
              tipo_producto_id: e.target.value ? Number(e.target.value) : undefined,
            })
          }
        >
          <MenuItem value="">Todos</MenuItem>
          {(tipos ?? []).map((t) => (
            <MenuItem key={t.id} value={t.id}>
              {t.descripcion}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Estado"
          value={value.solo_activos ? 'activos' : 'todos'}
          onChange={(e) => setPatch({ solo_activos: e.target.value === 'activos' || undefined })}
        >
          <MenuItem value="todos">Todos</MenuItem>
          <MenuItem value="activos">Solo activos</MenuItem>
        </TextField>
      </Box>
    </FilterBar>
  )
}
