import { Autocomplete, TextField } from '@mui/material'
import { isApiError } from '@/types/api'
import {
  useDomiciliosHistorial,
  type DomicilioOut,
} from '@/features/clientes'
import { formatDomicilioLine } from '@/features/clientes/components/domicilios/domicilioDisplay'

// Select de domicilio dentro de un cliente. Por defecto muestra sólo
// los vigentes (fecha_hasta_dom === null) — un contrato nuevo no debería
// apuntar a un domicilio histórico.
interface Props {
  clienteId: number | null
  value: number | null
  onChange: (domicilioId: number | null, domicilio: DomicilioOut | null) => void
  label?: string
  required?: boolean
  error?: boolean
  helperText?: string
  onlyVigente?: boolean
}

export default function DomicilioSelect({
  clienteId,
  value,
  onChange,
  label = 'Domicilio',
  required,
  error,
  helperText,
  onlyVigente = true,
}: Props) {
  const enabled = typeof clienteId === 'number' && clienteId > 0
  const {
    data,
    isLoading,
    error: queryError,
  } = useDomiciliosHistorial(enabled ? clienteId : undefined)

  const options = (data ?? []).filter((d) =>
    onlyVigente ? d.fecha_hasta_dom === null : true,
  )

  const selected = options.find((d) => d.domicilio_id === value) ?? null

  const queryErrorMsg = queryError
    ? isApiError(queryError)
      ? queryError.detail
      : 'Error al cargar domicilios.'
    : null

  const noOptionsText = !enabled
    ? 'Seleccioná un cliente primero.'
    : (queryErrorMsg ??
      (onlyVigente ? 'Sin domicilios vigentes.' : 'Sin domicilios.'))

  return (
    <Autocomplete<DomicilioOut, false, false, false>
      options={options}
      value={selected}
      onChange={(_, option) =>
        onChange(option?.domicilio_id ?? null, option ?? null)
      }
      getOptionLabel={(d) => formatDomicilioLine(d)}
      isOptionEqualToValue={(a, b) => a.domicilio_id === b.domicilio_id}
      loading={enabled && isLoading}
      disabled={!enabled}
      fullWidth
      noOptionsText={noOptionsText}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          error={error || !!queryErrorMsg}
          helperText={queryErrorMsg ?? helperText}
        />
      )}
    />
  )
}
