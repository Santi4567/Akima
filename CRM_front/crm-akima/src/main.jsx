import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';

// Contexto
import { AuthProvider } from './context/AuthContext';

// Guardianes
import { ProtectedRoute } from './componentes/ProtectedRoute';
import { PermissionGuard } from './componentes/PermissionGuard';
import { Unauthorized } from './componentes/Unauthorized';
import { PERMISSIONS } from './config/permissions';

// Páginas y Plantillas
import { LoginPage } from './componentes/login';
import { Home } from './componentes/Home';
import { DashboardLayout } from './componentes/DashboardLayout'; 

// --- 1. IMPORTA TUS NUEVOS COMPONENTES ---
// (Asumo que exportas 'Clientes' desde 'clientes.jsx', 'Finanzas' desde 'finanzas.jsx', etc.)
import { Clientes } from './componentes/clientes';
import { Finanzas } from './componentes/finanzas';
import { Ordenes } from './componentes/ordenes';
import { Productos } from './componentes/productos';
import { Categorias } from './componentes/categorias';
import { Proveedores } from './componentes/proveedores';
import { Usuarios } from './componentes/usuarios';
import { Visitas } from './componentes/visitas';
import { Configuraciones } from './componentes/configuraciones';


const router = createBrowserRouter([
  {
    // --- RUTAS PÚBLICAS ---
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/', // La raíz AHORA es el login
    element: <LoginPage />,
  },
  {
    // Página a la que te enviamos si no tienes permisos
    path: '/unauthorized', 
    element: <Unauthorized />,
  },
  {// --- Rutas Privadas (Protegidas) ---
    // 1. Primero, debes estar AUTENTICADO (logueado)
    element: <ProtectedRoute />,
    children: [
      {
        // 2. Si estás logueado, se aplica el "Marco" (Header + hueco)
        element: <DashboardLayout />,
        children: [
          // 3. Estas son las páginas que van DENTRO del marco
          
          // Home (accesible para todos los logueados)
          { path: '/home', element: <Home /> },

          // Clientes (solo si tienes algún permiso de CLIENTS)
          {
            path: '/clientes',
            element: (
              <PermissionGuard any={PERMISSIONS.CLIENTS}>
                <Clientes />
              </PermissionGuard>
            ),
          },
          
          // Sección de Productos (Hub)
          {
            path: '/productos',
            element: (
              <PermissionGuard any={[...PERMISSIONS.PRODUCTS, ...PERMISSIONS.CATEGORY]}>
                <Productos />
              </PermissionGuard>
            ),
          },
          // Gestor de Categorías (anidado en la misma sección)
          {
            path: '/productos/categorias',
            element: (
              <PermissionGuard any={PERMISSIONS.CATEGORY}>
                <Categorias />
              </PermissionGuard>
            ),
          },

          // Finanzas
          {
            path: '/finanzas',
            element: (
              <PermissionGuard any={PERMISSIONS.FINANCE}>
                <Finanzas />
              </PermissionGuard>
            ),
          },
          
          // Ordenes
          {
            path: '/ordenes',
            element: (
              <PermissionGuard any={PERMISSIONS.ORDERS}>
                <Ordenes />
              </PermissionGuard>
            ),
          },
          
          // Proveedores
          {
            path: '/proveedores',
            element: (
              <PermissionGuard any={PERMISSIONS.SUPPLLIERS}>
                <Proveedores />
              </PermissionGuard>
            ),
          },

          // Usuarios
          {
            path: '/usuarios',
            element: (
              <PermissionGuard any={PERMISSIONS.USERS}>
                <Usuarios />
              </PermissionGuard>
            ),
          },

          // Visitas
          {
            path: '/visitas',
            element: (
              <PermissionGuard any={PERMISSIONS.VISITS}>
                <Visitas />
              </PermissionGuard>
            ),
          },
        ],
      },
    ],
  },
]);
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);