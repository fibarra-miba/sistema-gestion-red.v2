import { Chip, type ChipProps } from '@mui/material'
import type { EstadoPago } from '../types'
import { estadoPagoColor, estadoPagoLabel } from '../utils'

interface Props {
  estado: EstadoPago
  size?: ChipProps['size']
}

export default function PagoEstadoChip({ estado, size = 'small' }: Props) {
  return (
    <Chip
      size={size}
      label={estadoPagoLabel(estado)}
      color={estadoPagoColor(estado)}
      variant="filled"
    />
  )
}
