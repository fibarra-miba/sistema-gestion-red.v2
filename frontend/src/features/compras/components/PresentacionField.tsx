import { MenuItem, TextField } from '@mui/material'
import { usePresentaciones } from '@/features/productos'

interface Props {
  productoId: number | null
  value: number | null
  onChange: (presentacionId: number | null) => void
  size?: 'small' | 'medium'
}

// Presentaciones de compra del producto elegido. La opción vacía = compra
// directa en unidad base (factor 1).
export default function PresentacionField({ productoId, value, onChange, size }: Props) {
  const { data, isLoading } = usePresentaciones(productoId)

  return (
    <TextField
      select
      size={size}
      label="Presentación"
      fullWidth
      disabled={!productoId || isLoading}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      helperText={!productoId ? 'Elegí un producto' : undefined}
    >
      <MenuItem value="">Unidad base (directo)</MenuItem>
      {(data ?? []).map((p) => (
        <MenuItem key={p.presentacion_id} value={p.presentacion_id}>
          {p.nombre_presentacion} · x{p.factor_a_stock}
        </MenuItem>
      ))}
    </TextField>
  )
}
