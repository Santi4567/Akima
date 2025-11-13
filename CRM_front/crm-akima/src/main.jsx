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
import { DashboardLayout } from './componentes/DashboardLayout'; 

// --- 1. IMPORTA TUS NUEVOS COMPONENTES ---
// (Asumo que exportas 'Clientes' desde 'clientes.jsx', 'Finanzas' desde 'finanzas.jsx', etc.)
import { Clientes } from './componentes/clientes';
import { Finanzas } from './componentes/finanzas';
import { Ordenes } from './componentes/ordenes';
import { Productos } from './componentes/productos';
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
    // --- RUTAS PRIVADAS ---
    element: <ProtectedRoute />, // 1. El guardia principal
    children: [
      {
        element: <DashboardLayout />, // 2. El "marco" con el Header
        children: [
          // 3. Todas las páginas que van DENTRO del marco
          
          { path: '/home', element: <Home /> },

          // --- 2. AÑADE TUS NUEVAS RUTAS AQUÍ ---
          { path: '/clientes', element: <Clientes /> },
          { path: '/finanzas', element: <Finanzas /> },
          { path: '/ordenes', element: <Ordenes /> },
          { path: '/productos', element: <Productos /> },
          { path: '/proveedores', element: <Proveedores /> },
          { path: '/usuarios', element: <Usuarios /> },
          { path: '/visitas', element: <Visitas /> },
          { path: '/configuraciones', element: <Configuraciones /> },,
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