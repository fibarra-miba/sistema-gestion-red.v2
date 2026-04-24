import { Chip } from '@mui/material'
import {
  estadoProgramacionColor,
  estadoProgramacionLabel,
} from '../utils'

interface Props {
  estadoId: number
  size?: 'small' | 'medium'
}

export default function ProgramacionEstadoChip({
  estadoId,
  size = 'small',
}: Props) {
  const color = estadoProgramacionColor(estadoId)
  return (
    <Chip
      label={estadoProgramacionLabel(estadoId)}
      color={color}
      size={size}
      variant={color === 'default' ? 'outlined' : 'filled'}
    />
  )
}
