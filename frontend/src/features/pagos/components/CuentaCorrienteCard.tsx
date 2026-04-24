import {
  Alert,
  Box,
  Chip,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import { isApiError } from '@/types/api'
import { formatCurrencyARS } from '@/lib/format'
import type { CuentaClienteOut } from '../types'
import { estadoCuentaColor, estadoCuentaLabel } from '../utils'

interface Props {
  data: CuentaClienteOut | undefined
  loading?: boolean
  error?: unknown
}

export default function CuentaCorrienteCard({ data, loading, error }: Props) {
  if (loading) {
    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={1}>
          <Skeleton width="40%" />
          <Skeleton width="60%" height={32} />
          <Skeleton width="80%" />
        </Stack>
      </Paper>
    )
  }

  if (error) {
    return (
      <Alert severity="error">
        {isApiError(error) ? error.detail : 'Error al cargar la cuenta.'}
      </Alert>
    )
  }

  if (!data) return null

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { sm: 'center' } }}
      >
        <Stack sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Saldo de cuenta
          </Typography>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700 }}
            color={
              data.saldo_cuenta > 0
                ? 'warning.main'
                : data.saldo_cuenta < 0
                  ? 'info.main'
                  : 'success.main'
            }
          >
            {formatCurrencyARS(data.saldo_cuenta)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Positivo = deuda · Negativo = saldo a favor
          </Typography>
        </Stack>
        <Chip
          label={estadoCuentaLabel(data.estado_calculado)}
          color={estadoCuentaColor(data.estado_calculado)}
          variant="filled"
        />
      </Stack>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ mt: 2 }}
      >
        <Box
          sx={{
            flex: 1,
            p: 1.5,
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Deuda actual
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {formatCurrencyARS(data.deuda_actual)}
          </Typography>
        </Box>
        <Box
          sx={{
            flex: 1,
            p: 1.5,
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Crédito disponible
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {formatCurrencyARS(data.credito_actual)}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  )
}
