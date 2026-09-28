import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import AssignmentReturnedOutlinedIcon from '@mui/icons-material/AssignmentReturnedOutlined'

import KpiCard from '@/components/ui/KpiCard'
import { formatCurrencyARS } from '@/lib/format'
import { depositosActivosLabel } from '@/features/instalaciones'
import { useResumenDepositos } from '../hooks/useResumenDepositos'
import KpiGridState from './KpiGridState'
import SectionShell from './SectionShell'

export default function DepositosSection() {
  const { data, isLoading, isError } = useResumenDepositos()

  return (
    <SectionShell title="Depósitos" to="/garantias" toLabel="Ver garantías">
      <KpiGridState isLoading={isLoading} isError={isError} skeletonCount={3}>
        <KpiCard
          label="Comprometido"
          value={formatCurrencyARS(data?.comprometido ?? 0)}
          hint={depositosActivosLabel(data?.cantidad_activas ?? 0)}
          color="info"
          to="/garantias"
          icon={<SavingsOutlinedIcon fontSize="small" />}
        />
        <KpiCard
          label="Devuelto"
          value={formatCurrencyARS(data?.devuelto ?? 0)}
          color="success"
          to="/garantias"
          icon={<AssignmentReturnedOutlinedIcon fontSize="small" />}
        />
        <KpiCard
          label="Retenido"
          value={formatCurrencyARS(data?.retenido ?? 0)}
          color="warning"
          to="/garantias"
          icon={<LockOutlinedIcon fontSize="small" />}
        />
      </KpiGridState>
    </SectionShell>
  )
}
