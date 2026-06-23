import { Autocomplete, TextField, type AutocompleteProps } from '@mui/material'
import { isApiError } from '@/types/api'
import { useProductos } from '../hooks/useProductos'
import type { ProductoOut } from '../types'

// Select reutilizable para elegir un producto. Fuente única: useProductos.
// - onlyActive: por defecto oculta productos inactivos.
// - tipoCodigo: limita a un tipo (ej. 'EQUIPO' para garantías).
// - allowedIds: restringe a un subconjunto (ej. productos instalados).

interface ProductoSelectProps {
  value: number | null
  onChange: (productoId: number | null, producto: ProductoOut | null) => void
  label?: string
  required?: boolean
  disabled?: boolean
  error?: boolean
  helperText?: string
  onlyActive?: boolean
  tipoCodigo?: string
  allowedIds?: number[]
  noOptionsText?: string
  size?: AutocompleteProps<ProductoOut, false, false, false>['size']
  fullWidth?: boolean
}

export default function ProductoSelect({
  value,
  onChange,
  label = 'Producto',
  required,
  disabled,
  error,
  helperText,
  onlyActive = true,
  tipoCodigo,
  allowedIds,
  noOptionsText,
  size,
  fullWidth = true,
}: ProductoSelectProps) {
  const { data, isLoading, error: queryError } = useProductos(
    onlyActive ? { solo_activos: true } : {},
  )

  const allowed = allowedIds ? new Set(allowedIds) : null
  const options = (data ?? []).filter((p) => {
    if (tipoCodigo && p.codigo_tproducto !== tipoCodigo) return false
    if (allowed && !allowed.has(p.producto_id)) return false
    return true
  })

  const selected = options.find((p) => p.producto_id === value) ?? null

  const queryErrorMsg = queryError
    ? isApiError(queryError)
      ? queryError.detail
      : 'Error al cargar productos.'
    : null

  return (
    <Autocomplete<ProductoOut, false, false, false>
      options={options}
      value={selected}
      onChange={(_, option) => onChange(option?.producto_id ?? null, option ?? null)}
      getOptionLabel={(p) => `${p.nombre_producto} — ${p.marca_producto} ${p.modelo_producto}`}
      isOptionEqualToValue={(a, b) => a.producto_id === b.producto_id}
      loading={isLoading}
      disabled={disabled}
      size={size}
      fullWidth={fullWidth}
      noOptionsText={queryErrorMsg ?? noOptionsText ?? 'Sin productos.'}
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
