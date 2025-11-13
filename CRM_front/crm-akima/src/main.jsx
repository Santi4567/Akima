import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';

// Contexto
import { AuthProvider } from './context/AuthContext';

// Guardianes
import { ProtectedRoute } from './componentes/ProtectedRoute';

// Páginas y Plantillas
import { LoginPage } from './componentes/login';
import { Home } from './componentes/Home';
// ¡Esta es la importación clave que faltaba!
import { DashboardLayout } from './componentes/DashboardLayout'; 

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
    // --- RUTAS PRIVADAS ---
    // 1. Pasa por el guardia de seguridad
    element: <ProtectedRoute />,
    children: [
      // 2. Carga el "Marco" (Header + hueco)
      {
        element: <DashboardLayout />, // <--- APLICA EL MARCO
        children: [
          // 3. Pone el "Contenido" (Home) DENTRO del hueco
          {
            path: '/home',
            element: <Home />, // <--- ESTA ES TU PÁGINA
          },
          // ... aquí puedes añadir /clientes, /productos, etc.
          // { path: '/clientes', element: <ClientesPage /> }
        ]
      }
    ]
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);