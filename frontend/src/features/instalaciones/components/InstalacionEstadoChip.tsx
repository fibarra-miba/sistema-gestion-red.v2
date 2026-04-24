import { Chip } from '@mui/material'
import { estadoInstalacionColor, estadoInstalacionLabel } from '../utils'

interface Props {
  estadoId: number
  size?: 'small' | 'medium'
}

export default function InstalacionEstadoChip({
  estadoId,
  size = 'small',
}: Props) {
  const color = estadoInstalacionColor(estadoId)
  return (
    <Chip
      label={estadoInstalacionLabel(estadoId)}
      color={color}
      size={size}
      variant={color === 'default' ? 'outlined' : 'filled'}
    />
  )
}
