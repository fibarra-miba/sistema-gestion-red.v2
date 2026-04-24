import { Button, MenuItem, Stack, TextField } from '@mui/material'
import FilterBar from '@/components/ui/FilterBar'
import type { EstadoPago, ListPagosContratoParams } from '../types'
import { ESTADO_PAGO_OPTIONS } from '../utils'

const MES_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1)
const CURRENT_YEAR = new Date().getFullYear()
const ANIO_OPTIONS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - 1 + i)

interface Props {
  value: ListPagosContratoParams
  onChange: (next: ListPagosContratoParams) => void
}

export default function PagosFilterBar({ value, onChange }: Props) {
  const setField = <K extends keyof ListPagosContratoParams>(
    key: K,
    v: ListPagosContratoParams[K] | undefined,
  ) => {
    const next = { ...value }
    if (v == null || (typeof v === 'number' && Number.isNaN(v))) {
      delete next[key]
    } else {
      next[key] = v
    }
    onChange(next)
  }

  const hasFilters =
    value.anio != null || value.mes != null || value.estado != null

  return (
    <FilterBar
      actions={
        hasFilters ? (
          <Button size="small" onClick={() => onChange({})}>
            Limpiar filtros
          </Button>
        ) : undefined
      }
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{ alignItems: { sm: 'center' } }}
      >
        <TextField
          select
          size="small"
          label="Año"
          value={value.anio ?? ''}
          onChange={(e) =>
            setField('anio', e.target.value === '' ? undefined : Number(e.target.value))
          }
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="">Todos</MenuItem>
          {ANIO_OPTIONS.map((a) => (
            <MenuItem key={a} value={a}>
              {a}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          label="Mes"
          value={value.mes ?? ''}
          onChange={(e) =>
            setField('mes', e.target.value === '' ? undefined : Number(e.target.value))
          }
          sx={{ minWidth: 100 }}
        >
          <MenuItem value="">Todos</MenuItem>
          {MES_OPTIONS.map((m) => (
            <MenuItem key={m} value={m}>
              {String(m).padStart(2, '0')}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          label="Estado"
          value={value.estado ?? ''}
          onChange={(e) =>
            setField('estado', (e.target.value || undefined) as EstadoPago | undefined)
          }
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="">Todos</MenuItem>
          {ESTADO_PAGO_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
    </FilterBar>
  )
}
