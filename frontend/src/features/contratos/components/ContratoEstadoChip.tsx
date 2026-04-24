import { Chip } from '@mui/material'
import { estadoContratoColor } from '../utils'

interface Props {
  estadoId: number
  descripcion: string
  size?: 'small' | 'medium'
}

// Un solo componente para renderizar el estado — así el color y la
// descripción son coherentes en tabla, detalle y dialogs.
export default function ContratoEstadoChip({
  estadoId,
  descripcion,
  size = 'small',
}: Props) {
  const color = estadoContratoColor(estadoId)
  return (
    <Chip
      label={descripcion}
      color={color}
      size={size}
      variant={color === 'default' ? 'outlined' : 'filled'}
    />
  )
}
