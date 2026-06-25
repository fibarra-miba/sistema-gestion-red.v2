import { useState } from 'react'
import { Stack } from '@mui/material'
import PageHeader from '@/components/ui/PageHeader'
import {
  useAuditoria,
  AuditoriaTable,
  AuditoriaFilterBar,
  type ListAuditoriaParams,
} from '@/features/auditoria'

const PAGE_SIZE = 50

export default function AuditoriaPage() {
  const [params, setParams] = useState<ListAuditoriaParams>({})
  const limit = params.limit ?? PAGE_SIZE
  const offset = params.offset ?? 0

  const { data, isLoading, error } = useAuditoria({ ...params, limit, offset })

  return (
    <Stack spacing={{ xs: 2, md: 2.5 }} sx={{ minWidth: 0 }}>
      <PageHeader
        title="Auditoría"
        subtitle="Registro de acciones del sistema: quién hizo qué, sobre qué entidad y cuándo."
      />

      <AuditoriaFilterBar value={params} onChange={setParams} />

      <AuditoriaTable
        eventos={data?.items}
        loading={isLoading}
        error={error}
        pagination={{
          limit,
          offset,
          total: data?.total,
          onChange: ({ limit: nextLimit, offset: nextOffset }) =>
            setParams((prev) => ({ ...prev, limit: nextLimit, offset: nextOffset })),
        }}
      />
    </Stack>
  )
}
