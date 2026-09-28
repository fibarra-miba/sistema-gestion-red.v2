import { Chip } from '@mui/material'

// Estados de garantía (ids estables del catálogo estado_garantia).
// La garantía modela un depósito reembolsable: ACTIVA = plata retenida
// por nosotros, DEVUELTA = se la devolvimos al cliente, RETENIDA = nos
// la quedamos (equipo no devuelto o dañado), ANULADA = error de carga.
export const ESTADO_GARANTIA = {
  ACTIVA: 1,
  VENCIDA: 2,
  ANULADA: 3,
  DEVUELTA: 4,
  RETENIDA: 5,
} as const

type ChipColor = 'success' | 'warning' | 'default' | 'info'

function colorFor(estadoId: number): ChipColor {
  switch (estadoId) {
    case ESTADO_GARANTIA.ACTIVA:
      return 'info'
    case ESTADO_GARANTIA.DEVUELTA:
      return 'success'
    case ESTADO_GARANTIA.RETENIDA:
      return 'warning'
    case ESTADO_GARANTIA.ANULADA:
    case ESTADO_GARANTIA.VENCIDA:
    default:
      return 'default'
  }
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
