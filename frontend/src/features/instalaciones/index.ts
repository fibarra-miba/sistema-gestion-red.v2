export * from './types'
export { instalacionesKeys } from './keys'
export {
  ESTADO_INSTALACION,
  ESTADO_INSTALACION_OPTIONS,
  ESTADO_PROGRAMACION,
  ESTADO_PROGRAMACION_OPTIONS,
  estadoInstalacionColor,
  estadoInstalacionLabel,
  estadoProgramacionColor,
  estadoProgramacionLabel,
  instalacionActions,
  instalacionContratoLabel,
  instalacionDomicilioLabel,
  programacionContratoLabel,
  programacionDomicilioLabel,
  contratoLabelFromFields,
  domicilioLabelFromFields,
  formatDateTime,
  depositosActivosLabel,
  cobroGarantiaLabel,
  defaultMedioPagoId,
  toDateTimeInputValue,
  fromDateTimeInputValue,
} from './utils'

export { instalacionesService } from './services/instalacionesService'

export { useInstalaciones } from './hooks/useInstalaciones'
export { useInstalacion } from './hooks/useInstalacion'
export { useInstalacionActions } from './hooks/useInstalacionActions'
export { useReintentarInstalacion } from './hooks/useReintentarInstalacion'
export { useProgramaciones } from './hooks/useProgramaciones'
export { useReprogramar } from './hooks/useReprogramar'
export { useCreateInstalacion } from './hooks/useCreateInstalacion'
export { useUpdateInstalacion } from './hooks/useUpdateInstalacion'
export { useEjecutarProgramacion } from './hooks/useEjecutarProgramacion'
export { useDetallesInstalacion } from './hooks/useDetallesInstalacion'
export { useCreateDetalleInstalacion } from './hooks/useCreateDetalleInstalacion'
export { useGarantias } from './hooks/useGarantias'
export { useGarantiasList } from './hooks/useGarantiasList'
export { useCreateGarantia } from './hooks/useCreateGarantia'
export { useAnularGarantia } from './hooks/useAnularGarantia'
export { useUpdateGarantia } from './hooks/useUpdateGarantia'
export { useResumenGarantias } from './hooks/useResumenGarantias'
export { useReciboGarantia } from './hooks/useReciboGarantia'
export { useGarantia } from './hooks/useGarantia'
export { useGarantiasCliente } from './hooks/useGarantiasCliente'
export { useCobrosGarantia } from './hooks/useCobrosGarantia'
export { useRegistrarCobroGarantia } from './hooks/useRegistrarCobroGarantia'

export { default as InstalacionEstadoChip } from './components/InstalacionEstadoChip'
export {
  default as GarantiaEstadoChip,
  ESTADO_GARANTIA,
} from './components/GarantiaEstadoChip'
export { default as GarantiaCobrosList } from './components/GarantiaCobrosList'
export { default as GarantiasClienteSection } from './components/GarantiasClienteSection'
export { default as EditarGarantiaDialog } from './components/EditarGarantiaDialog'
export { default as AnularGarantiaDialog } from './components/AnularGarantiaDialog'
export { default as GarantiaCobrosDialog } from './components/GarantiaCobrosDialog'
export { default as RegistrarCobroGarantiaDialog } from './components/RegistrarCobroGarantiaDialog'
export { default as ProgramacionEstadoChip } from './components/ProgramacionEstadoChip'
export { default as InstalacionDetailDialog } from './components/InstalacionDetailDialog'
