export { default as ContratosSection } from './components/ContratosSection'
export { default as InstalacionesSection } from './components/InstalacionesSection'
export { default as CobranzasSection } from './components/CobranzasSection'
export { default as DepositosSection } from './components/DepositosSection'

export { useResumenClientes } from './hooks/useResumenClientes'
export { useResumenContratos } from './hooks/useResumenContratos'
export { useResumenInstalaciones } from './hooks/useResumenInstalaciones'
export { useResumenPagos } from './hooks/useResumenPagos'
export { useResumenDepositos } from './hooks/useResumenDepositos'

export { dashboardService } from './services/dashboardService'
export { dashboardKeys } from './keys'

export type {
  ClientesResumen,
  ContratosResumen,
  InstalacionesResumen,
  InstalacionAgendaItem,
  PagosResumen,
  TopMorosoItem,
  DepositosResumen,
} from './types'
