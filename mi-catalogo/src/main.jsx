import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';

// 1. Importamos el Layout
import { RootLayout } from './componentes/RootLayout';

// 2. Importamos las páginas
import { Home } from './componentes/Home'; // O './pages/Home'
import { Catalogo } from './componentes/Catalogo';
import { Contacto } from './componentes/Contacto';
import { ProductDetail } from './componentes/ProductDetail';

// 3. Definimos las rutas como Objetos (Igual que tu ejemplo PRO)
const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />, // Este es el "padre" que tiene el Navbar
    children: [
      {
        index: true, // Esto significa: "Si la ruta es '/', carga esto en el Outlet"
        element: <Home />,
      },
      {
        path: 'catalogo', // Ruta: /catalogo
        element: <Catalogo />,
      },
      {
        path: 'contacto', // Ruta: /contacto
        element: <Contacto />,
      },
      {
         path: 'producto/:id', 
         element: <ProductDetail /> 
        },
    ],
  },
  // Aquí podrías agregar rutas sin Navbar (como un Login futuro)
  // { path: '/login', element: <Login /> }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Ya no usamos <App />, usamos el proveedor del router */}
    <RouterProvider router={router} />
  </React.StrictMode>
);