import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import CssBaseline from '@mui/material/CssBaseline'
import { QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import { ColorModeProvider } from '@/theme/ColorModeProvider'
import { SnackbarProvider } from '@/components/ui/SnackbarProvider'
import { AuthProvider } from '@/features/auth'
import { queryClient } from '@/services/queryClient'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ColorModeProvider>
        <CssBaseline />
        <SnackbarProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </SnackbarProvider>
      </ColorModeProvider>
    </QueryClientProvider>
  </StrictMode>,
)
