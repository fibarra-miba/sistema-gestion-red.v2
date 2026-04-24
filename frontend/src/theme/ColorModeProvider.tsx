import { createContext, useMemo, useState, type ReactNode } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { createAppTheme, type ResolvedColorMode } from './index'

export type ColorMode = 'auto' | 'light' | 'dark'

interface ColorModeContextValue {
  mode: ColorMode
  resolvedMode: ResolvedColorMode
  setMode: (next: ColorMode) => void
}

export const ColorModeContext = createContext<ColorModeContextValue | null>(null)

const STORAGE_KEY = 'sistema-red:color-mode'

function readStoredMode(): ColorMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'auto' || stored === 'light' || stored === 'dark') return stored
  } catch {
    // ignore
  }
  return 'auto'
}

export function ColorModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ColorMode>(() => readStoredMode())
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')

  const resolvedMode: ResolvedColorMode =
    mode === 'auto' ? (prefersDark ? 'dark' : 'light') : mode

  const setMode = (next: ColorMode) => {
    setModeState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // ignore
    }
  }

  const theme = useMemo(() => createAppTheme(resolvedMode), [resolvedMode])

  const contextValue = useMemo(
    () => ({ mode, resolvedMode, setMode }),
    [mode, resolvedMode],
  )

  return (
    <ColorModeContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ColorModeContext.Provider>
  )
}
