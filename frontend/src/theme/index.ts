import { createTheme, type Theme } from '@mui/material/styles'

export type ResolvedColorMode = 'light' | 'dark'

export function createAppTheme(mode: ResolvedColorMode): Theme {
  const isLight = mode === 'light'

  return createTheme({
    palette: {
      mode,
      primary: { main: isLight ? '#1f6feb' : '#58a6ff' },
      secondary: { main: isLight ? '#6f42c1' : '#b392f0' },
      ...(isLight
        ? {
            background: { default: '#f5f6f8', paper: '#ffffff' },
          }
        : {
            background: { default: '#0d1117', paper: '#161b22' },
          }),
    },
    shape: {
      borderRadius: 8,
    },
    typography: {
      fontFamily:
        '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontSize: 14,
      button: {
        textTransform: 'none',
        fontWeight: 600,
      },
    },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
      },
      MuiTextField: {
        defaultProps: { size: 'small', fullWidth: true },
      },
      MuiTable: {
        defaultProps: { size: 'small' },
      },
    },
  })
}
