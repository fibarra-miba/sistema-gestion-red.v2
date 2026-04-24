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
export { useEjecutarProgramacion } from './hooks/useEjecutarProgramacion'
export { useDetallesInstalacion } from './hooks/useDetallesInstalacion'
export { useCreateDetalleInstalacion } from './hooks/useCreateDetalleInstalacion'

export { default as InstalacionEstadoChip } from './components/InstalacionEstadoChip'
export { default as ProgramacionEstadoChip } from './components/ProgramacionEstadoChip'
export { default as InstalacionDetailDialog } from './components/InstalacionDetailDialog'
