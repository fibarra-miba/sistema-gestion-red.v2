import { useState } from 'react'
import { Stack } from '@mui/material'
import PageHeader from '@/components/ui/PageHeader'
import { useAuth } from '@/features/auth'
import {
  useExistencias,
  ExistenciasTable,
  StockFilterBar,
  MovimientoStockDialog,
  KardexDialog,
  type ExistenciaOut,
  type ListExistenciasParams,
} from '@/features/stock'

const PAGE_SIZE = 50

export default function StockPage() {
  const { hasCapability } = useAuth()
  const canManage = hasCapability('can_manage_stock')

  const [params, setParams] = useState<ListExistenciasParams>({})
  const { data, isLoading, error } = useExistencias({ ...params, limit: PAGE_SIZE })

  const [kardexOf, setKardexOf] = useState<ExistenciaOut | null>(null)
  const [movimientoOf, setMovimientoOf] = useState<ExistenciaOut | null>(null)

  const offset = params.offset ?? 0

  return (
    <Stack spacing={{ xs: 2, md: 2.5 }} sx={{ minWidth: 0 }}>
      <PageHeader
        title="Stock"
        subtitle="Existencias por producto, costo promedio (PMP) y movimientos."
      />

      <StockFilterBar value={params} onChange={setParams} />

      <ExistenciasTable
        existencias={data}
        loading={isLoading}
        error={error}
        canManage={canManage}
        onKardex={setKardexOf}
        onMovimiento={setMovimientoOf}
        pagination={{
          limit: PAGE_SIZE,
          offset,
          onChange: ({ offset: nextOffset }) =>
            setParams((prev) => ({ ...prev, offset: nextOffset })),
        }}
      />

      <KardexDialog
        existencia={kardexOf}
        open={!!kardexOf}
        onClose={() => setKardexOf(null)}
      />

      <MovimientoStockDialog
        existencia={movimientoOf}
        open={!!movimientoOf}
        onClose={() => setMovimientoOf(null)}
      />
    </Stack>
  )
}
