import type {
  ListInstalacionesParams,
  ListProgramacionesParams,
} from './types'

export const instalacionesKeys = {
  all: ['instalaciones'] as const,

  // Instalaciones
  lists: () => [...instalacionesKeys.all, 'list'] as const,
  list: (params: ListInstalacionesParams) =>
    [...instalacionesKeys.lists(), params] as const,

  details: () => [...instalacionesKeys.all, 'detail'] as const,
  detail: (instalacionId: number) =>
    [...instalacionesKeys.details(), instalacionId] as const,

  // Detalle de materiales por instalación
  detalles: (instalacionId: number) =>
    [...instalacionesKeys.all, 'detalles', instalacionId] as const,

  // Programaciones
  programacionesAll: () => [...instalacionesKeys.all, 'programaciones'] as const,
  programacionesList: (params: ListProgramacionesParams) =>
    [...instalacionesKeys.programacionesAll(), 'list', params] as const,
  programacionDetail: (programacionId: number) =>
    [...instalacionesKeys.programacionesAll(), 'detail', programacionId] as const,
  reprogramaciones: (programacionId: number) =>
    [...instalacionesKeys.programacionesAll(), 'reprogramaciones', programacionId] as const,
}
