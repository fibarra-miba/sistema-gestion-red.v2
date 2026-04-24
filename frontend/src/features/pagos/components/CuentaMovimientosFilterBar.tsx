import { Button, MenuItem, Stack, TextField } from '@mui/material'
import FilterBar from '@/components/ui/FilterBar'
import type {
  ListCuentaMovimientosParams,
  TipoMovimientoCuenta,
} from '../types'
import { TIPO_MOV_CUENTA_OPTIONS } from '../utils'

interface Props {
  value: ListCuentaMovimientosParams
  onChange: (next: ListCuentaMovimientosParams) => void
}

export default function CuentaMovimientosFilterBar({
  value,
  onChange,
}: Props) {
  const setField = <K extends keyof ListCuentaMovimientosParams>(
    key: K,
    v: ListCuentaMovimientosParams[K],
  ) => {
    const next = { ...value }
    if (v == null || v === '') {
      delete next[key]
    } else {
      next[key] = v
    }
    onChange(next)
  }

  const hasFilters = !!(value.desde || value.hasta || value.tipo)

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
          type="date"
          size="small"
          label="Desde"
          value={value.desde ?? ''}
          onChange={(e) => setField('desde', e.target.value || undefined)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ minWidth: 160 }}
        />
        <TextField
          type="date"
          size="small"
          label="Hasta"
          value={value.hasta ?? ''}
          onChange={(e) => setField('hasta', e.target.value || undefined)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ minWidth: 160 }}
        />
        <TextField
          select
          size="small"
          label="Tipo"
          value={value.tipo ?? ''}
          onChange={(e) =>
            setField(
              'tipo',
              (e.target.value || undefined) as TipoMovimientoCuenta | undefined,
            )
          }
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">Todos</MenuItem>
          {TIPO_MOV_CUENTA_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
    </FilterBar>
  )
}
