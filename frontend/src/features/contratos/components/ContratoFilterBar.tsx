import { Box, Button, MenuItem, TextField } from '@mui/material'
import ClearIcon from '@mui/icons-material/Clear'
import FilterBar from '@/components/ui/FilterBar'
import { PlanSelect } from '@/features/planes'
import type { ClienteOut } from '@/features/clientes'
import ClienteSelect from './ClienteSelect'
import DomicilioSelect from './DomicilioSelect'
import { ESTADO_CONTRATO_OPTIONS } from '../utils'
import type { ListContratosParams } from '../types'

interface Props {
  value: ListContratosParams
  onChange: (next: ListContratosParams) => void
  selectedCliente: ClienteOut | null
  onSelectedClienteChange: (cliente: ClienteOut | null) => void
}

// Grid adaptativo por escalones:
//  xs → 1 columna (stack)
//  sm → 2 columnas
//  md → 2 columnas (evita campos muy angostos en notebook)
//  lg → 4 columnas (desktop ancho)
// minmax(0, 1fr) evita overflow por contenido largo en los selects.
export default function ContratoFilterBar({
  value,
  onChange,
  selectedCliente,
  onSelectedClienteChange,
}: Props) {
  const setPatch = (patch: Partial<ListContratosParams>) =>
    onChange({ ...value, ...patch })

  const handleClienteChange = (id: number | null, cliente: ClienteOut | null) => {
    onSelectedClienteChange(cliente)
    onChange({
      ...value,
      cliente_id: id ?? undefined,
      domicilio_id: undefined,
    })
  }

  const handleClear = () => {
    onSelectedClienteChange(null)
    onChange({})
  }

  const hasFilters =
    value.cliente_id != null ||
    value.estado_contrato_id != null ||
    value.plan_id != null ||
    value.domicilio_id != null

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
        <ClienteSelect
          value={value.cliente_id ?? null}
          onChange={handleClienteChange}
          preselected={selectedCliente}
          size="small"
          label="Cliente"
        />

        <DomicilioSelect
          clienteId={value.cliente_id ?? null}
          value={value.domicilio_id ?? null}
          onChange={(id) => setPatch({ domicilio_id: id ?? undefined })}
          onlyVigente={false}
          label="Domicilio"
        />

        <PlanSelect
          value={value.plan_id ?? null}
          onChange={(id) => setPatch({ plan_id: id ?? undefined })}
          onlyActive={false}
          size="small"
          label="Plan"
        />

        <TextField
          select
          size="small"
          label="Estado"
          value={value.estado_contrato_id ?? ''}
          onChange={(e) =>
            setPatch({
              estado_contrato_id: e.target.value
                ? Number(e.target.value)
                : undefined,
            })
          }
        >
          <MenuItem value="">Todos</MenuItem>
          {ESTADO_CONTRATO_OPTIONS.map((opt) => (
            <MenuItem key={opt.id} value={opt.id}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>
      </Box>
    </FilterBar>
  )
}
