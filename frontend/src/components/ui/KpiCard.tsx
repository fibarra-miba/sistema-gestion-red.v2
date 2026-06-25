import { Paper, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import type { ReactNode } from 'react'

type KpiColor = 'default' | 'primary' | 'warning' | 'error' | 'success' | 'info'

interface Props {
  label: string
  value: ReactNode
  icon?: ReactNode
  hint?: string
  // Si se informa, toda la card es un Link al módulo correspondiente.
  to?: string
  color?: KpiColor
}

// Tarjeta de KPI para el dashboard: etiqueta + valor destacado + hint opcional.
// Operativa, contenida, opcionalmente navegable.
export default function KpiCard({ label, value, icon, hint, to, color = 'default' }: Props) {
  const valueColor = color === 'default' ? 'text.primary' : `${color}.main`

  const inner = (
    <Stack spacing={0.5} sx={{ minWidth: 0 }}>
      <Stack
        direction="row"
        spacing={0.75}
        sx={{ alignItems: 'center', color: 'text.secondary' }}
      >
        {icon}
        <Typography
          variant="caption"
          sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}
          noWrap
        >
          {label}
        </Typography>
      </Stack>
      <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.15, color: valueColor }} noWrap>
        {value}
      </Typography>
      {hint && (
        <Typography variant="body2" color="text.secondary" noWrap>
          {hint}
        </Typography>
      )}
    </Stack>
  )

  if (to) {
    return (
      <Paper
        variant="outlined"
        component={RouterLink}
        to={to}
        sx={{
          p: 2,
          height: '100%',
          display: 'block',
          textDecoration: 'none',
          color: 'inherit',
          transition: 'border-color 120ms, background-color 120ms',
          '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
        }}
      >
        {inner}
      </Paper>
    )
  }

  return (
    <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
      {inner}
    </Paper>
  )
}
