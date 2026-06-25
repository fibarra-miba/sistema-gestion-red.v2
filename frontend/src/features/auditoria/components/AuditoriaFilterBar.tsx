import { Box, Button, MenuItem, TextField } from '@mui/material'
import ClearIcon from '@mui/icons-material/Clear'
import FilterBar from '@/components/ui/FilterBar'
import { fromDateInputValue, toDateInputValue } from '@/lib/format'
import { useAuditoriaTipos } from '../hooks/useAuditoriaTipos'
import type { ListAuditoriaParams } from '../types'

interface Props {
  value: ListAuditoriaParams
  onChange: (next: ListAuditoriaParams) => void
}

export default function AuditoriaFilterBar({ value, onChange }: Props) {
  const { data: tipos } = useAuditoriaTipos()

  // Cualquier cambio de filtro reinicia la paginación.
  const setPatch = (patch: Partial<ListAuditoriaParams>) =>
    onChange({ ...value, ...patch, offset: 0 })

  const handleClear = () => onChange({})

  const hasFilters =
    !!value.modulo ||
    !!value.accion ||
    value.usuario_id != null ||
    !!value.entidad ||
    !!value.entidad_id ||
    !!value.desde ||
    !!value.hasta

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
          select
          size="small"
          label="Módulo"
          value={value.modulo ?? ''}
          onChange={(e) => setPatch({ modulo: e.target.value || undefined })}
        >
          <MenuItem value="">Todos</MenuItem>
          {(tipos?.modulos ?? []).map((m) => (
            <MenuItem key={m} value={m}>
              {m}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          label="Acción"
          value={value.accion ?? ''}
          onChange={(e) => setPatch({ accion: e.target.value || undefined })}
        >
          <MenuItem value="">Todas</MenuItem>
          {(tipos?.acciones ?? []).map((a) => (
            <MenuItem key={a} value={a}>
              {a}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          size="small"
          label="Usuario ID"
          type="number"
          value={value.usuario_id ?? ''}
          onChange={(e) =>
            setPatch({ usuario_id: e.target.value ? Number(e.target.value) : undefined })
          }
        />

        <TextField
          size="small"
          label="Entidad"
          placeholder="contratos, pagos…"
          value={value.entidad ?? ''}
          onChange={(e) => setPatch({ entidad: e.target.value || undefined })}
        />

        <TextField
          size="small"
          label="Desde"
          type="date"
          slotProps={{ inputLabel: { shrink: true } }}
          value={toDateInputValue(value.desde)}
          onChange={(e) =>
            setPatch({ desde: e.target.value ? fromDateInputValue(e.target.value) : undefined })
          }
        />

        <TextField
          size="small"
          label="Hasta"
          type="date"
          slotProps={{ inputLabel: { shrink: true } }}
          value={toDateInputValue(value.hasta)}
          onChange={(e) =>
            setPatch({ hasta: e.target.value ? fromDateInputValue(e.target.value) : undefined })
          }
        />
      </Box>
    </FilterBar>
  )
}
