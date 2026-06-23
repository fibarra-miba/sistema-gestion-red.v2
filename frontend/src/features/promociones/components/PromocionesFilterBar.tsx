import { Box, Button, MenuItem, TextField } from '@mui/material'
import ClearIcon from '@mui/icons-material/Clear'
import FilterBar from '@/components/ui/FilterBar'
import { useTiposPromo } from '@/features/catalogos'
import type { ListPromocionesParams } from '../types'

interface Props {
  value: ListPromocionesParams
  onChange: (next: ListPromocionesParams) => void
}

export default function PromocionesFilterBar({ value, onChange }: Props) {
  const { data: tipos } = useTiposPromo()

  const setPatch = (patch: Partial<ListPromocionesParams>) =>
    onChange({ ...value, ...patch, offset: 0 })

  const handleClear = () => onChange({})

  const hasFilters =
    value.tipo_promo_id != null || value.activo != null || !!value.vigentes

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
          select
          size="small"
          label="Tipo"
          value={value.tipo_promo_id ?? ''}
          onChange={(e) =>
            setPatch({
              tipo_promo_id: e.target.value ? Number(e.target.value) : undefined,
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
          value={value.activo == null ? 'todos' : value.activo ? 'activas' : 'inactivas'}
          onChange={(e) => {
            const v = e.target.value
            setPatch({ activo: v === 'todos' ? undefined : v === 'activas' })
          }}
        >
          <MenuItem value="todos">Todas</MenuItem>
          <MenuItem value="activas">Activas</MenuItem>
          <MenuItem value="inactivas">Inactivas</MenuItem>
        </TextField>
        <TextField
          select
          size="small"
          label="Vigencia"
          value={value.vigentes ? 'vigentes' : 'todas'}
          onChange={(e) => setPatch({ vigentes: e.target.value === 'vigentes' || undefined })}
        >
          <MenuItem value="todas">Todas</MenuItem>
          <MenuItem value="vigentes">Solo vigentes hoy</MenuItem>
        </TextField>
      </Box>
    </FilterBar>
  )
}
