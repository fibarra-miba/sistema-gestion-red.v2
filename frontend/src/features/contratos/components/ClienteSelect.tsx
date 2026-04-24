import { useState } from 'react'
import {
  Autocomplete,
  TextField,
  type AutocompleteProps,
} from '@mui/material'
import { isApiError } from '@/types/api'
import { useDebounce } from '@/hooks/useDebounce'
import { useClientes, type ClienteOut } from '@/features/clientes'

// Select de cliente con búsqueda server-side (reutiliza el `search` del
// endpoint GET /clientes). Lo consume el form de contratos y el filtro.
// Si aparece una segunda feature que lo necesite, promover a components/ui.

interface Props {
  value: number | null
  onChange: (clienteId: number | null, cliente: ClienteOut | null) => void
  label?: string
  required?: boolean
  disabled?: boolean
  error?: boolean
  helperText?: string
  size?: AutocompleteProps<ClienteOut, false, false, false>['size']
  fullWidth?: boolean
  // Cliente preseleccionado — cuando lo conocemos pero todavía no está
  // en la lista filtrada por `search` (p. ej. al editar / recuperar estado).
  preselected?: ClienteOut | null
}

export default function ClienteSelect({
  value,
  onChange,
  label = 'Cliente',
  required,
  disabled,
  error,
  helperText,
  size,
  fullWidth = true,
  preselected,
}: Props) {
  const [input, setInput] = useState('')
  const debouncedSearch = useDebounce(input, 300)

  const { data, isLoading, error: queryError } = useClientes({
    limit: 25,
    offset: 0,
    ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
  })

  const options = data ?? []

  // Si tenemos un valor seleccionado pero no está en options, lo agregamos
  // para que el Autocomplete pueda renderizar la etiqueta correcta.
  const selected =
    options.find((c) => c.cliente_id === value) ??
    (preselected && preselected.cliente_id === value ? preselected : null)

  const mergedOptions =
    selected && !options.some((c) => c.cliente_id === selected.cliente_id)
      ? [selected, ...options]
      : options

  const queryErrorMsg = queryError
    ? isApiError(queryError)
      ? queryError.detail
      : 'Error al cargar clientes.'
    : null

  return (
    <Autocomplete<ClienteOut, false, false, false>
      options={mergedOptions}
      value={selected}
      onChange={(_, option) =>
        onChange(option?.cliente_id ?? null, option ?? null)
      }
      onInputChange={(_, next, reason) => {
        if (reason === 'input') setInput(next)
      }}
      getOptionLabel={(c) =>
        `${c.apellido_cliente}, ${c.nombre_cliente} — DNI ${c.dni_cliente}`
      }
      isOptionEqualToValue={(a, b) => a.cliente_id === b.cliente_id}
      loading={isLoading}
      disabled={disabled}
      size={size}
      fullWidth={fullWidth}
      filterOptions={(x) => x}
      noOptionsText={
        queryErrorMsg ??
        (debouncedSearch
          ? 'Sin coincidencias.'
          : 'Empezá a escribir para buscar.')
      }
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
