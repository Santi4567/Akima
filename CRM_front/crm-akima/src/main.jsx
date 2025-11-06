import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';

// 1. Importa el AuthProvider
import { AuthProvider } from './context/AuthContext';

// Importa tus páginas/componentes
import { LoginPage } from './componentes/login';
import { Home } from './componentes/Home';
import { ProtectedRoute } from './componentes/ProtectedRoute'; // <-- ¡AQUÍ ESTÁ LA LÍNEA QUE FALTABA!

// (Aquí importaremos el DashboardPage luego)

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/', // Por ahora, la raíz también es el login
    element: <LoginPage />,
  },
  {
    // --- RUTAS PRIVADAS (NIVEL 1: AUTENTICACIÓN) ---
    element: <ProtectedRoute />, // <-- Esta línea (26) ahora sabe qué es ProtectedRoute
    children: [
      {
        path: '/home', // <--- La nueva ruta
        element: <Home />,
      },
      {
        path: '/', // Que la raíz también te lleve a Home
        element: <Home />,
      },
      // ... (tus otras rutas privadas como /admin)
    ],
  },
  // ... aquí irán las rutas privadas
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 2. Envuelve el RouterProvider con AuthProvider */}
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
