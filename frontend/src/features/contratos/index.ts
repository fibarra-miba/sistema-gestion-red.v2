export * from './types'
export { contratosKeys } from './keys'
export {
  ESTADO_CONTRATO,
  ESTADO_CONTRATO_OPTIONS,
  estadoContratoColor,
  contratoActions,
  contratoDisplayName,
} from './utils'

export { contratosService } from './services/contratosService'

export { useContratos } from './hooks/useContratos'
export { useContrato } from './hooks/useContrato'
export { useCreateContrato } from './hooks/useCreateContrato'
export { useContratoActions } from './hooks/useContratoActions'
export { useChangePlan } from './hooks/useChangePlan'
export { useProgramarInstalacion } from './hooks/useProgramarInstalacion'

export { default as ContratoEstadoChip } from './components/ContratoEstadoChip'
export { default as ContratoDetailDialog } from './components/ContratoDetailDialog'
