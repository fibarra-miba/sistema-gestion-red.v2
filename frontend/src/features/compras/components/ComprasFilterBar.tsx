import { Box, Button, MenuItem, TextField } from '@mui/material'
import ClearIcon from '@mui/icons-material/Clear'
import FilterBar from '@/components/ui/FilterBar'
import { useProveedores } from '@/features/proveedores'
import type { ListComprasParams } from '../types'

// estado_facturas_compras (005): 1=EMITIDA, 2=ANULADA.
const ESTADOS = [
  { id: 1, label: 'Emitida' },
  { id: 2, label: 'Anulada' },
]

interface Props {
  value: ListComprasParams
  onChange: (next: ListComprasParams) => void
}

export default function ComprasFilterBar({ value, onChange }: Props) {
  const { data: proveedores } = useProveedores({ limit: 200 })

  const setPatch = (patch: Partial<ListComprasParams>) =>
    onChange({ ...value, ...patch, offset: 0 })

  const handleClear = () => onChange({})

  const hasFilters = value.proveedor_id != null || value.estado_factura_compra_id != null

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
          select
          size="small"
          label="Proveedor"
          value={value.proveedor_id ?? ''}
          onChange={(e) =>
            setPatch({ proveedor_id: e.target.value ? Number(e.target.value) : undefined })
          }
        >
          <MenuItem value="">Todos</MenuItem>
          {(proveedores ?? []).map((p) => (
            <MenuItem key={p.proveedor_id} value={p.proveedor_id}>
              {p.nombre_prov}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Estado"
          value={value.estado_factura_compra_id ?? ''}
          onChange={(e) =>
            setPatch({
              estado_factura_compra_id: e.target.value ? Number(e.target.value) : undefined,
            })
          }
        >
          <MenuItem value="">Todos</MenuItem>
          {ESTADOS.map((e) => (
            <MenuItem key={e.id} value={e.id}>
              {e.label}
            </MenuItem>
          ))}
        </TextField>
      </Box>
    </FilterBar>
  )
}
