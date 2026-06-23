import { Autocomplete, TextField, type AutocompleteProps } from '@mui/material'
import { isApiError } from '@/types/api'
import { usePromociones } from '../hooks/usePromociones'
import type { PromocionOut } from '../types'
import { formatDescuento } from './PromocionTable'

// Select reutilizable para elegir una promoción (ej. al crear/asignar en un
// contrato). Fuente única: usePromociones. Por defecto muestra solo activas.

interface PromocionSelectProps {
  value: number | null
  onChange: (promocionId: number | null, promo: PromocionOut | null) => void
  label?: string
  required?: boolean
  disabled?: boolean
  error?: boolean
  helperText?: string
  onlyActive?: boolean
  noOptionsText?: string
  size?: AutocompleteProps<PromocionOut, false, false, false>['size']
  fullWidth?: boolean
}

export default function PromocionSelect({
  value,
  onChange,
  label = 'Promoción',
  required,
  disabled,
  error,
  helperText,
  onlyActive = true,
  noOptionsText,
  size,
  fullWidth = true,
}: PromocionSelectProps) {
  const { data, isLoading, error: queryError } = usePromociones(
    onlyActive ? { activo: true } : {},
  )

  const options = data ?? []
  const selected = options.find((p) => p.promocion_id === value) ?? null

  const queryErrorMsg = queryError
    ? isApiError(queryError)
      ? queryError.detail
      : 'Error al cargar promociones.'
    : null

  return (
    <Autocomplete<PromocionOut, false, false, false>
      options={options}
      value={selected}
      onChange={(_, option) => onChange(option?.promocion_id ?? null, option ?? null)}
      getOptionLabel={(p) => `${p.nombre_promo} — ${formatDescuento(p)}`}
      isOptionEqualToValue={(a, b) => a.promocion_id === b.promocion_id}
      loading={isLoading}
      disabled={disabled}
      size={size}
      fullWidth={fullWidth}
      noOptionsText={queryErrorMsg ?? noOptionsText ?? 'Sin promociones activas.'}
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
