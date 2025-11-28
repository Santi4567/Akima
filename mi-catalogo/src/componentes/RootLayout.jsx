import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar'; // Asegúrate de la ruta correcta


export const RootLayout = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* 1. Aquí va lo que se repite en todas las páginas */}
      <Navbar />

      {/* 2. El Outlet es el "hueco" donde se pintarán los hijos (Home, Catalogo, etc) */}
      <main>
        <Outlet />
      </main>
    </div>
  );
};