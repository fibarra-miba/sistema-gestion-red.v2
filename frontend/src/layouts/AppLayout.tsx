import { useMemo, useState, type ReactNode } from 'react'
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import HomeIcon from '@mui/icons-material/Home'
import PeopleIcon from '@mui/icons-material/People'
import DescriptionIcon from '@mui/icons-material/Description'
import CategoryIcon from '@mui/icons-material/Category'
import LocalOfferIcon from '@mui/icons-material/LocalOffer'
import EngineeringIcon from '@mui/icons-material/Engineering'
import SavingsIcon from '@mui/icons-material/Savings'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import StorefrontIcon from '@mui/icons-material/Storefront'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import WarehouseIcon from '@mui/icons-material/Warehouse'
import PaymentsIcon from '@mui/icons-material/Payments'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import HistoryIcon from '@mui/icons-material/History'
import { NavLink, Outlet } from 'react-router-dom'
import ColorModeToggle from '@/theme/ColorModeToggle'
import UserMenu from '@/layouts/UserMenu'
import { useAuth, type CapabilityKey } from '@/features/auth'

const DRAWER_WIDTH = 240

interface NavItem {
  to: string
  label: string
  icon: ReactNode
  end?: boolean
  // Si se define, el item sólo es visible si el usuario tiene alguna de estas capabilities.
  anyOf?: CapabilityKey[]
  // Item ADMIN-only que no se expresa como capability (p. ej. auditoría).
  adminOnly?: boolean
}

// Nav items completos. Inicio siempre visible. El resto se filtra por capabilities
// para no mostrar secciones que el usuario no puede operar (el backend es la
// fuente de verdad; esto es puramente UX).
const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Inicio', icon: <HomeIcon />, end: true },
  {
    to: '/clientes',
    label: 'Clientes',
    icon: <PeopleIcon />,
    anyOf: ['can_manage_clientes'],
  },
  {
    to: '/contratos',
    label: 'Contratos',
    icon: <DescriptionIcon />,
    anyOf: ['can_manage_contratos'],
  },
  {
    to: '/planes',
    label: 'Planes',
    icon: <CategoryIcon />,
    anyOf: ['can_manage_planes'],
  },
  {
    to: '/promociones',
    label: 'Promociones',
    icon: <LocalOfferIcon />,
    anyOf: ['can_manage_promociones'],
  },
  {
    to: '/instalaciones',
    label: 'Instalaciones',
    icon: <EngineeringIcon />,
    anyOf: ['can_manage_instalaciones'],
  },
  {
    to: '/garantias',
    label: 'Garantías',
    icon: <SavingsIcon />,
    anyOf: ['can_manage_instalaciones'],
  },
  {
    to: '/productos',
    label: 'Productos',
    icon: <Inventory2Icon />,
    anyOf: ['can_manage_productos'],
  },
  {
    to: '/proveedores',
    label: 'Proveedores',
    icon: <StorefrontIcon />,
    anyOf: ['can_manage_proveedores'],
  },
  {
    to: '/compras',
    label: 'Compras',
    icon: <ShoppingCartIcon />,
    anyOf: ['can_manage_compras'],
  },
  {
    to: '/stock',
    label: 'Stock',
    icon: <WarehouseIcon />,
    anyOf: ['can_view_stock'],
  },
  {
    to: '/pagos',
    label: 'Pagos',
    icon: <PaymentsIcon />,
    anyOf: ['can_manage_pagos'],
  },
  {
    to: '/usuarios',
    label: 'Usuarios',
    icon: <AdminPanelSettingsIcon />,
    anyOf: ['can_manage_users'],
  },
  {
    to: '/auditoria',
    label: 'Auditoría',
    icon: <HistoryIcon />,
    adminOnly: true,
  },
]

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user } = useAuth()

  const visibleItems = useMemo(() => {
    if (!user) return NAV_ITEMS.filter((i) => !i.anyOf && !i.adminOnly)
    return NAV_ITEMS.filter((i) => {
      if (i.adminOnly) return user.rol.codigo_rol === 'ADMIN'
      return !i.anyOf || i.anyOf.some((cap) => user.capabilities[cap])
    })
  }, [user])

  const handleNavClick = () => {
    if (mobileOpen) setMobileOpen(false)
  }

  const navList = (
    <List dense sx={{ pt: 1 }}>
      {visibleItems.map((item) => (
        <ListItemButton
          key={item.to}
          component={NavLink}
          to={item.to}
          end={item.end}
          onClick={handleNavClick}
          sx={{
            '&.active': {
              bgcolor: 'action.selected',
              fontWeight: 600,
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
          <ListItemText primary={item.label} />
        </ListItemButton>
      ))}
    </List>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar variant="dense">
          <IconButton
            color="inherit"
            edge="start"
            aria-label="abrir menú"
            onClick={() => setMobileOpen(true)}
            sx={{ mr: 1, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            component="div"
            variant="h6"
            sx={{ fontWeight: 700, flexGrow: 1 }}
          >
            Sistema RED
          </Typography>
          <ColorModeToggle />
          <UserMenu />
        </Toolbar>
      </AppBar>

      {/* Drawer navigation — temporary <md, permanent md+.
          Renderizamos los dos y alternamos visibilidad con sx responsive,
          así React no remonta la lista al cambiar breakpoint. */}
      <Box
        component="nav"
        sx={{
          width: { md: DRAWER_WIDTH },
          flexShrink: { md: 0 },
        }}
        aria-label="navegación principal"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
            },
          }}
        >
          <Toolbar variant="dense" />
          {navList}
        </Drawer>

        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
            },
          }}
        >
          <Toolbar variant="dense" />
          {navList}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          // minWidth: 0 es crítico en contenedores flex — sin esto,
          // un hijo con contenido ancho (tabla) empuja el padre y
          // genera scroll horizontal de página.
          minWidth: 0,
          maxWidth: '100%',
          // Nada dentro del main debería poder desbordar horizontalmente
          // al viewport — las tablas resuelven el overflow internamente.
          overflowX: 'hidden',
          px: { xs: 2, sm: 2.5, md: 3 },
          pt: { xs: 2, sm: 2.5, md: 3 },
          pb: { xs: 3, md: 4 },
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Toolbar variant="dense" />
        <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
