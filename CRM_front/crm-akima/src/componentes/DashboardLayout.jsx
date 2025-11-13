import { Outlet } from 'react-router-dom';
// Voy a añadir la extensión .jsx al archivo de importación, a veces eso soluciona problemas del bundler.
import { Header } from './Header'; // Importamos el Header

export const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 1. El Header siempre estará en la parte superior */}
      <Header />

      {/* 2. El contenido de la página (Home, Clientes, etc.) se renderizará aquí */}
      <main>
        {/* 'py-6' añade espacio vertical, 'px-4' (móvil) y 'sm:px-6 lg:px-8' (desktop) añaden espacio horizontal */}
        <div className="mx-auto max-w-7xl py-6 px-4 sm:px-6 lg:px-8">
          {/* Outlet es el marcador de posición donde React Router pondrá tu página (Home, Clientes, etc.) */}
          <Outlet />
        </div>
      </main>
    </div>
  );
};