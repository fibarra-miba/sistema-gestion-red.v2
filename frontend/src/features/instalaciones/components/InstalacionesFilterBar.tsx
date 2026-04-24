import { Box, Button, MenuItem, TextField } from '@mui/material'
import ClearIcon from '@mui/icons-material/Clear'
import FilterBar from '@/components/ui/FilterBar'
import type { ListInstalacionesParams } from '../types'
import { ESTADO_INSTALACION_OPTIONS } from '../utils'

interface Props {
  value: ListInstalacionesParams
  onChange: (next: ListInstalacionesParams) => void
}

// Filtros operativos por ID + estado. El dominio no expone búsqueda
// por texto en este endpoint — los ids vienen desde contratos/domicilios.
export default function InstalacionesFilterBar({ value, onChange }: Props) {
  const setPatch = (patch: Partial<ListInstalacionesParams>) =>
    onChange({ ...value, ...patch })

  const handleClear = () => onChange({})

  const hasFilters =
    value.contrato_id != null ||
    value.domicilio_id != null ||
    value.estado_instalacion_id != null ||
    value.programacion_id != null

  const numericOrUndefined = (raw: string): number | undefined => {
    if (!raw) return undefined
    const n = Number(raw)
    return Number.isFinite(n) && n > 0 ? n : undefined
  }

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
            lg: 'repeat(4, minmax(0, 1fr))',
          },
          alignItems: 'start',
        }}
      >
        <TextField
          size="small"
          label="Contrato ID"
          type="number"
          slotProps={{ htmlInput: { min: 1 } }}
          value={value.contrato_id ?? ''}
          onChange={(e) =>
            setPatch({ contrato_id: numericOrUndefined(e.target.value) })
          }
        />
        <TextField
          size="small"
          label="Domicilio ID"
          type="number"
          slotProps={{ htmlInput: { min: 1 } }}
          value={value.domicilio_id ?? ''}
          onChange={(e) =>
            setPatch({ domicilio_id: numericOrUndefined(e.target.value) })
          }
        />
        <TextField
          size="small"
          label="Programación ID"
          type="number"
          slotProps={{ htmlInput: { min: 1 } }}
          value={value.programacion_id ?? ''}
          onChange={(e) =>
            setPatch({ programacion_id: numericOrUndefined(e.target.value) })
          }
        />
        <TextField
          select
          size="small"
          label="Estado"
          value={value.estado_instalacion_id ?? ''}
          onChange={(e) =>
            setPatch({
              estado_instalacion_id: e.target.value
                ? Number(e.target.value)
                : undefined,
            })
          }
        >
          <MenuItem value="">Todos</MenuItem>
          {ESTADO_INSTALACION_OPTIONS.map((opt) => (
            <MenuItem key={opt.id} value={opt.id}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>
      </Box>
    </FilterBar>
  )
}
