import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { Alert, Snackbar, type AlertColor } from '@mui/material'

interface SnackItem {
  id: number
  message: string
  severity: AlertColor
}

interface SnackbarContextValue {
  show: (message: string, severity?: AlertColor) => void
  showSuccess: (message: string) => void
  showError: (message: string) => void
  showInfo: (message: string) => void
  showWarning: (message: string) => void
}

const SnackbarContext = createContext<SnackbarContextValue | null>(null)

// Cola simple: sólo renderizamos el snack más reciente.
// Si se dispara uno nuevo antes de que cierre el anterior, lo reemplaza.
export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [snack, setSnack] = useState<SnackItem | null>(null)

  const show = useCallback((message: string, severity: AlertColor = 'info') => {
    setSnack({ id: Date.now(), message, severity })
  }, [])

  const value = useMemo<SnackbarContextValue>(
    () => ({
      show,
      showSuccess: (m) => show(m, 'success'),
      showError: (m) => show(m, 'error'),
      showInfo: (m) => show(m, 'info'),
      showWarning: (m) => show(m, 'warning'),
    }),
    [show],
  )

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <Snackbar
        key={snack?.id}
        open={!!snack}
        autoHideDuration={4000}
        onClose={(_e, reason) => {
          if (reason === 'clickaway') return
          setSnack(null)
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {snack ? (
          <Alert
            severity={snack.severity}
            variant="filled"
            onClose={() => setSnack(null)}
            sx={{ width: '100%' }}
          >
            {snack.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </SnackbarContext.Provider>
  )
}

export function useSnackbar(): SnackbarContextValue {
  const ctx = useContext(SnackbarContext)
  if (!ctx) throw new Error('useSnackbar debe usarse dentro de <SnackbarProvider>')
  return ctx
}
