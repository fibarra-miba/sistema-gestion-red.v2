import { Chip } from '@mui/material'

// Estados de garantía (ids estables del catálogo estado_garantia).
export const ESTADO_GARANTIA = {
  ACTIVA: 1,
  VENCIDA: 2,
  ANULADA: 3,
} as const

type ChipColor = 'success' | 'warning' | 'default'

function colorFor(estadoId: number): ChipColor {
  if (estadoId === ESTADO_GARANTIA.ACTIVA) return 'success'
  if (estadoId === ESTADO_GARANTIA.VENCIDA) return 'warning'
  return 'default'
}

interface Props {
  estadoId: number
  descripcion?: string | null
  size?: 'small' | 'medium'
}

export default function GarantiaEstadoChip({ estadoId, descripcion, size = 'small' }: Props) {
  const color = colorFor(estadoId)
  return (
    <Chip
      label={descripcion ?? '—'}
      color={color}
      size={size}
      variant={color === 'default' ? 'outlined' : 'filled'}
    />
  )
}
