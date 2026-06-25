import HourglassBottomOutlinedIcon from '@mui/icons-material/HourglassBottomOutlined'
import PendingOutlinedIcon from '@mui/icons-material/PendingOutlined'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import { Divider, Paper, Stack, Typography } from '@mui/material'

import KpiCard from '@/components/ui/KpiCard'
import { formatCurrencyARS } from '@/lib/format'
import { useResumenPagos } from '../hooks/useResumenPagos'
import KpiGridState from './KpiGridState'
import SectionShell from './SectionShell'

export default function CobranzasSection() {
  const { data, isLoading, isError } = useResumenPagos()

  return (
    <SectionShell title="Cobranzas" to="/pagos" toLabel="Ver pagos">
      <KpiGridState isLoading={isLoading} isError={isError}>
        <KpiCard
          label="Deudores"
          value={data?.deudores_count ?? 0}
          hint={`${formatCurrencyARS(data?.monto_adeudado ?? 0)} adeudado`}
          color="error"
          to="/pagos"
          icon={<WarningAmberOutlinedIcon fontSize="small" />}
        />
        <KpiCard
          label="Facturado del mes"
          value={formatCurrencyARS(data?.facturado_mes ?? 0)}
          to="/pagos"
          icon={<ReceiptLongOutlinedIcon fontSize="small" />}
        />
        <KpiCard
          label="Pagos pendientes (mes)"
          value={data?.pagos_pendientes_mes ?? 0}
          color="warning"
          to="/pagos"
          icon={<PendingOutlinedIcon fontSize="small" />}
        />
        <KpiCard
          label="Pagos parciales (mes)"
          value={data?.pagos_parciales_mes ?? 0}
          color="info"
          to="/pagos"
          icon={<HourglassBottomOutlinedIcon fontSize="small" />}
        />
      </KpiGridState>

      {data && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            Mayores deudores
          </Typography>
          {data.top_morosos.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Sin cuentas deudoras.
            </Typography>
          ) : (
            <Stack divider={<Divider flexItem />} spacing={1}>
              {data.top_morosos.map((item) => (
                <Stack
                  key={item.cliente_id}
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Typography variant="body2" noWrap sx={{ minWidth: 0 }}>
                    {item.nombre_cliente} {item.apellido_cliente}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 700, flexShrink: 0, color: 'error.main' }}
                  >
                    {formatCurrencyARS(item.saldo_cuenta)}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          )}
        </Paper>
      )}
    </SectionShell>
  )
}
