import { useContext } from 'react'
import { ColorModeContext } from './ColorModeProvider'

export function useColorMode() {
  const ctx = useContext(ColorModeContext)
  if (!ctx) {
    throw new Error('useColorMode must be used inside ColorModeProvider')
  }
  return ctx
}
