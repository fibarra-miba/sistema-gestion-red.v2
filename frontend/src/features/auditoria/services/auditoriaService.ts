import { http } from '@/services/http'
import type {
  AuditEventListResponse,
  AuditTiposOut,
  ListAuditoriaParams,
} from '../types'

export const auditoriaService = {
  async list(params: ListAuditoriaParams = {}): Promise<AuditEventListResponse> {
    const { data } = await http.get<AuditEventListResponse>('/auditoria', { params })
    return data
  },

  async tipos(): Promise<AuditTiposOut> {
    const { data } = await http.get<AuditTiposOut>('/auditoria/tipos')
    return data
  },
}
