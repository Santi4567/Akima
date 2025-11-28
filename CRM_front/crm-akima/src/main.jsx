// src/main.jsx

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

// Páginas y Layouts
import { LoginPage } from './componentes/login';
import { Home } from './componentes/Home'; // Recuerda que movimos el Home a 'pages'
import { DashboardLayout } from './componentes/DashboardLayout'; 

// --- IMPORTACIÓN DE HUBS Y COMPONENTES ---
// Asegúrate de que estas rutas coincidan con dónde guardaste cada archivo final
import { Clientes } from './componentes/clientes';
import { Productos } from './componentes/productos'; // El Hub Principal de Productos
import { Categorias } from './componentes/categorias';
import { Finanzas } from './componentes/finanzas';   // El Hub Principal de Finanzas
import { Ordenes } from './componentes/ordenes';     // El Hub Principal de Órdenes
import { Proveedores } from './componentes/proveedores';
import { Usuarios } from './componentes/usuarios';   // El Hub Principal de Usuarios
import { Visitas } from './componentes/visitas';


const router = createBrowserRouter([
  {
    // --- RUTAS PÚBLICAS ---
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/', 
    element: <LoginPage />,
  },
  {
    path: '/unauthorized', 
    element: <Unauthorized />,
  },
  {
    // --- RUTAS PRIVADAS (PROTEGIDAS) ---
    // 1. Verifica Autenticación (Token)
    element: <ProtectedRoute />,
    children: [
      {
        // 2. Aplica el Layout (Header + Contenedor)
        element: <DashboardLayout />,
        children: [
          
          // Home (Accesible para todos los logueados)
          { path: '/home', element: <Home /> },

          // --- MÓDULO PRODUCTOS (HUB) ---
          {
            path: '/productos',
            element: (
              // Solo requiere 'view.products' para entrar al Hub
              <PermissionGuard any={['view.products']}>
                <Productos />
              </PermissionGuard>
            ),
          },
          // Categorías (Ruta separada pero accesible desde el Hub)
          {
            path: '/productos/categorias',
            element: (
              <PermissionGuard any={['view.category']}>
                <Categorias />
              </PermissionGuard>
            ),
          },

          // --- MÓDULO CLIENTES ---
          {
            path: '/clientes',
            element: (
              <PermissionGuard any={['view.clients']}>
                <Clientes />
              </PermissionGuard>
            ),
          },

          // --- MÓDULO ÓRDENES (HUB) ---
          {
            path: '/ordenes',
            element: (
              // Acceso si puede ver propias o todas
              <PermissionGuard any={['view.own.order', 'view.all.order']}>
                <Ordenes />
              </PermissionGuard>
            ),
          },

          // --- MÓDULO FINANZAS (HUB) ---
          {
            path: '/finanzas',
            element: (
              // Requiere permiso específico de dashboard o ver pagos para entrar
              <PermissionGuard any={['view.finance.dashboard', 'view.payments']}>
                <Finanzas />
              </PermissionGuard>
            ),
          },
          
          // --- MÓDULO PROVEEDORES ---
          {
            path: '/proveedores',
            element: (
              <PermissionGuard any={['view.suppliers']}>
                <Proveedores />
              </PermissionGuard>
            ),
          },

          // --- MÓDULO USUARIOS (HUB) ---
          {
            path: '/usuarios',
            element: (
              <PermissionGuard any={['view.users']}>
                <Usuarios />
              </PermissionGuard>
            ),
          },

          // --- MÓDULO VISITAS ---
          {
            path: '/visitas',
            element: (
              <PermissionGuard any={['view.own.visits', 'view.all.visits']}>
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