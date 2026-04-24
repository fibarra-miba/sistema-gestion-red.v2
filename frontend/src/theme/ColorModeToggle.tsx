import { useState, type MouseEvent } from 'react'
import {
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material'
import LightModeIcon from '@mui/icons-material/LightMode'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness'
import CheckIcon from '@mui/icons-material/Check'
import { useColorMode } from './useColorMode'
import type { ColorMode } from './ColorModeProvider'

const OPTIONS: { value: ColorMode; label: string; icon: typeof LightModeIcon }[] = [
  { value: 'light', label: 'Claro', icon: LightModeIcon },
  { value: 'dark', label: 'Oscuro', icon: DarkModeIcon },
  { value: 'auto', label: 'Automático (sistema)', icon: SettingsBrightnessIcon },
]

export default function ColorModeToggle() {
  const { mode, resolvedMode, setMode } = useColorMode()
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const open = Boolean(anchorEl)

  const CurrentIcon =
    mode === 'auto'
      ? SettingsBrightnessIcon
      : resolvedMode === 'dark'
        ? DarkModeIcon
        : LightModeIcon

  const handleOpen = (e: MouseEvent<HTMLButtonElement>) => setAnchorEl(e.currentTarget)
  const handleClose = () => setAnchorEl(null)
  const handleSelect = (next: ColorMode) => {
    setMode(next)
    handleClose()
  }

  return (
    <>
      <Tooltip title="Tema">
        <IconButton color="inherit" onClick={handleOpen} aria-label="Cambiar tema">
          <CurrentIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        {OPTIONS.map(({ value, label, icon: Icon }) => {
          const selected = mode === value
          return (
            <MenuItem key={value} selected={selected} onClick={() => handleSelect(value)}>
              <ListItemIcon>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{label}</ListItemText>
              {selected && <CheckIcon fontSize="small" sx={{ ml: 2, opacity: 0.7 }} />}
            </MenuItem>
          )
        })}
      </Menu>
    </>
  )
}
