import { Alert, Skeleton } from '@mui/material'
import type { ReactNode } from 'react'
import KpiGrid from './KpiGrid'

interface Props {
  isLoading: boolean
  isError: boolean
  skeletonCount?: number
  children: ReactNode
}

// Maneja los tres estados de una grilla de KPIs: error, carga (skeletons) y datos.
export default function KpiGridState({
  isLoading,
  isError,
  skeletonCount = 4,
  children,
}: Props) {
  if (isError) {
    return <Alert severity="error">No se pudo cargar el resumen.</Alert>
  }

  if (isLoading) {
    return (
      <KpiGrid>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={96} />
        ))}
      </KpiGrid>
    )
  }

  return <KpiGrid>{children}</KpiGrid>
}
