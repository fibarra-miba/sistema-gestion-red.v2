import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined'
import PauseCircleOutlinedIcon from '@mui/icons-material/PauseCircleOutlined'
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined'
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined'

import KpiCard from '@/components/ui/KpiCard'
import { useResumenClientes } from '../hooks/useResumenClientes'
import { useResumenContratos } from '../hooks/useResumenContratos'
import KpiGridState from './KpiGridState'
import SectionShell from './SectionShell'

export default function ContratosSection() {
  const clientes = useResumenClientes()
  const contratos = useResumenContratos()

  const isLoading = clientes.isLoading || contratos.isLoading
  const isError = clientes.isError || contratos.isError
  const porEstado = contratos.data?.por_estado

  return (
    <SectionShell title="Comercial" to="/contratos" toLabel="Ver contratos">
      <KpiGridState isLoading={isLoading} isError={isError}>
        <KpiCard
          label="Clientes activos"
          value={clientes.data?.activos ?? 0}
          hint={`${clientes.data?.total ?? 0} en total`}
          to="/clientes"
          icon={<PeopleAltOutlinedIcon fontSize="small" />}
        />
        <KpiCard
          label="Contratos activos"
          value={porEstado?.ACTIVO ?? 0}
          color="success"
          to="/contratos"
          icon={<AssignmentTurnedInOutlinedIcon fontSize="small" />}
        />
        <KpiCard
          label="Suspendidos"
          value={porEstado?.SUSPENDIDO ?? 0}
          color="warning"
          to="/contratos"
          icon={<PauseCircleOutlinedIcon fontSize="small" />}
        />
        <KpiCard
          label="Pend. instalación"
          value={porEstado?.PENDIENTE_INSTALACION ?? 0}
          color="info"
          to="/contratos"
          icon={<PendingActionsOutlinedIcon fontSize="small" />}
        />
      </KpiGridState>
    </SectionShell>
  )
}
