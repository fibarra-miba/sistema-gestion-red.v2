import { createBrowserRouter, Navigate } from 'react-router-dom'
import AppLayout from '@/layouts/AppLayout'
import HomePage from '@/pages/HomePage'
import NotFoundPage from '@/pages/NotFoundPage'
import ClientesListPage from '@/pages/clientes/ClientesListPage'
import ClienteDetailPage from '@/pages/clientes/ClienteDetailPage'
import PlanesPage from '@/pages/planes/PlanesPage'
import ContratosPage from '@/pages/contratos/ContratosPage'
import InstalacionesPage from '@/pages/instalaciones/InstalacionesPage'
import PagosPage from '@/pages/pagos/PagosPage'
import UsuariosPage from '@/pages/usuarios/UsuariosPage'
import LoginPage from '@/pages/auth/LoginPage'
import ChangePasswordPage from '@/pages/auth/ChangePasswordPage'
import ProtectedRoute from '@/routes/ProtectedRoute'
import PublicOnlyRoute from '@/routes/PublicOnlyRoute'
import RequireCapability from '@/routes/RequireCapability'

export const router = createBrowserRouter([
  // Rutas públicas (sólo accesibles sin sesión).
  {
    element: <PublicOnlyRoute />,
    children: [{ path: '/login', element: <LoginPage /> }],
  },

  // Cambio de contraseña: requiere sesión pero está fuera del AppLayout
  // porque puede ser el estado forzado (el guard redirige acá desde cualquier ruta).
  {
    element: <ProtectedRoute />,
    children: [{ path: '/change-password', element: <ChangePasswordPage /> }],
  },

  // App autenticada: todo dentro del layout principal.
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <AppLayout />,
        children: [
          { index: true, element: <HomePage /> },

          {
            element: <RequireCapability anyOf={['can_manage_clientes']} />,
            children: [
              { path: 'clientes', element: <ClientesListPage /> },
              { path: 'clientes/:id', element: <ClienteDetailPage /> },
            ],
          },

          {
            element: <RequireCapability anyOf={['can_manage_contratos']} />,
            children: [{ path: 'contratos', element: <ContratosPage /> }],
          },

          {
            element: <RequireCapability anyOf={['can_manage_planes']} />,
            children: [{ path: 'planes', element: <PlanesPage /> }],
          },

          {
            element: <RequireCapability anyOf={['can_manage_instalaciones']} />,
            children: [{ path: 'instalaciones', element: <InstalacionesPage /> }],
          },

          {
            element: <RequireCapability anyOf={['can_manage_pagos']} />,
            children: [{ path: 'pagos', element: <PagosPage /> }],
          },

          {
            element: <RequireCapability anyOf={['can_manage_users']} />,
            children: [{ path: 'usuarios', element: <UsuariosPage /> }],
          },

          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },

  // Cualquier cosa fuera del árbol anterior redirige al inicio (el guard decide después).
  { path: '*', element: <Navigate to="/" replace /> },
])
