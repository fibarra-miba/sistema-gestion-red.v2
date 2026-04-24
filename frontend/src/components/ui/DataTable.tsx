import { type ReactNode } from 'react'
import {
  Alert,
  Box,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material'
import { isApiError } from '@/types/api'

export type ResponsiveBreakpoint = 'sm' | 'md' | 'lg' | 'xl'

export interface DataTableColumn<Row> {
  key: string
  label: string
  width?: number | string
  align?: 'left' | 'right' | 'center'
  render?: (row: Row) => ReactNode
  // Breakpoint mínimo en el que la columna es visible.
  // Ej. `showFrom: 'md'` → la columna se oculta en xs/sm.
  // Sin esta prop, la columna se muestra siempre.
  showFrom?: ResponsiveBreakpoint
}

export interface DataTablePagination {
  limit: number
  offset: number
  // Si el backend no devuelve total, dejar undefined y el componente asume "unknown count".
  total?: number
  onChange: (next: { limit: number; offset: number }) => void
  rowsPerPageOptions?: number[]
}

export interface DataTableProps<Row> {
  columns: DataTableColumn<Row>[]
  rows: Row[] | undefined
  loading?: boolean
  error?: unknown
  emptyMessage?: string
  getRowKey: (row: Row) => string | number
  onRowClick?: (row: Row) => void
  pagination?: DataTablePagination
}

// Oculta el TableCell debajo del breakpoint indicado.
// Usamos `display: none` en xs y `table-cell` a partir del breakpoint —
// esto mantiene el layout de tabla intacto para las columnas visibles.
function visibilitySx(showFrom?: ResponsiveBreakpoint) {
  if (!showFrom) return undefined
  return { display: { xs: 'none', [showFrom]: 'table-cell' } }
}

export default function DataTable<Row>({
  columns,
  rows,
  loading,
  error,
  emptyMessage = 'Sin resultados.',
  getRowKey,
  onRowClick,
  pagination,
}: DataTableProps<Row>) {
  const errorMsg = resolveErrorMessage(error)
  const hasRows = !!rows && rows.length > 0

  return (
    <Paper
      variant="outlined"
      sx={{
        position: 'relative',
        width: '100%',
        // minWidth: 0 para jugar bien dentro de flex containers.
        minWidth: 0,
        maxWidth: '100%',
        overflow: 'hidden',
      }}
    >
      {loading && (
        <LinearProgress
          sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 }}
        />
      )}

      {errorMsg && (
        <Alert severity="error" sx={{ borderRadius: 0 }}>
          {errorMsg}
        </Alert>
      )}

      {/* TableContainer permite scroll horizontal sólo dentro de la tabla
          si el contenido aún no entra después de ocultar columnas por
          breakpoint — nunca a nivel página. */}
      <TableContainer sx={{ width: '100%' }}>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.key}
                  align={col.align}
                  sx={{
                    width: col.width,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    ...visibilitySx(col.showFrom),
                  }}
                >
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {!hasRows && !loading && !errorMsg && (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      {emptyMessage}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}

            {hasRows &&
              rows!.map((row) => (
                <TableRow
                  key={getRowKey(row)}
                  hover={!!onRowClick}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  sx={onRowClick ? { cursor: 'pointer' } : undefined}
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      align={col.align}
                      sx={visibilitySx(col.showFrom)}
                    >
                      {col.render
                        ? col.render(row)
                        : (row as unknown as Record<string, ReactNode>)[col.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      {pagination && (
        <TablePagination
          component="div"
          count={pagination.total ?? -1}
          page={Math.floor(pagination.offset / pagination.limit)}
          rowsPerPage={pagination.limit}
          rowsPerPageOptions={pagination.rowsPerPageOptions ?? [25, 50, 100]}
          onPageChange={(_, page) =>
            pagination.onChange({
              limit: pagination.limit,
              offset: page * pagination.limit,
            })
          }
          onRowsPerPageChange={(e) =>
            pagination.onChange({
              limit: parseInt(e.target.value, 10),
              offset: 0,
            })
          }
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) =>
            count === -1 ? `${from}–${to}` : `${from}–${to} de ${count}`
          }
        />
      )}
    </Paper>
  )
}

function resolveErrorMessage(error: unknown): string | null {
  if (!error) return null
  if (isApiError(error)) return error.detail
  if (error instanceof Error) return error.message
  return 'Error inesperado.'
}
