import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

// --- NOTA ---
// Para los iconos (Bars3Icon, XMarkIcon) necesitarás instalar Heroicons:
// npm install @heroicons/react

// --- Logo (Puedes reemplazar esto con tu <img />) ---
const Logo = () => (
  <svg className="h-8 w-auto text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1.5-1.5m1.5 1.5l1.5-1.5m0 0l1.5 1.5m-1.5-1.5l-1.5 1.5m-3-3l3 3m0 0l3-3m-3 3v-6m0 6h-3.75m3.75 0h3.75M9 12.75l3 3m0 0l3-3m-3 3v-6m0 6H6m3 0h3" />
  </svg>
);
// --- Fin del Logo ---

// Definimos los links de navegación
const navLinks = [
  { name: 'Home', href: '/home' },
  { name: 'Productos', href: '/productos' },
  { name: 'Clientes', href: '/clientes' },
  { name: 'Proveedores', href: '/proveedores' },
  { name: 'Órdenes', href: '/ordenes' },
  { name: 'Visitas', href: '/visitas' },
  { name: 'Usuarios', href: '/usuarios' },
  { name: 'Finanzas', href: '/finanzas' },
];

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Clases de Tailwind para los links (activo vs. inactivo)
  const activeClassName = "bg-green-100 text-green-700 rounded-md px-3 py-2 text-sm font-medium";
  const inactiveClassName = "text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md px-3 py-2 text-sm font-medium";

  // Función para NavLink que aplica la clase correcta
  const getNavLinkClass = ({ isActive }) => isActive ? activeClassName : inactiveClassName;

  // Clases para el menú móvil
  const mobileActiveClass = "bg-green-100 text-green-700 block rounded-md px-3 py-2 text-base font-medium";
  const mobileInactiveClass = "text-gray-700 hover:bg-gray-100 hover:text-gray-900 block rounded-md px-3 py-2 text-base font-medium";
  const getMobileNavLinkClass = ({ isActive }) => isActive ? mobileActiveClass : mobileInactiveClass;


  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          
          {/* Izquierda: Logo */}
          <div className="flex items-center">
            <NavLink to="/home" className="flex-shrink-0 flex items-center gap-2">
              <Logo />
              <span className="hidden sm:block font-bold text-xl text-gray-800">Akima CRM</span>
            </NavLink>
          </div>

          {/* Centro: Links (Desktop) - Oculto en móvil */}
          <div className="hidden lg:ml-6 lg:flex lg:items-center lg:space-x-4">
            {navLinks.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={getNavLinkClass}
              >
                {item.name}
              </NavLink>
            ))}
          </div>

          {/* Derecha: Botón de Menú (Mobile) - Oculto en desktop */}
          <div className="flex items-center lg:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Abrir menú principal</span>
              {mobileMenuOpen ? (
                <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Panel de Menú (Mobile) - Se muestra/oculta con JS */}
      {mobileMenuOpen && (
        <div className="lg:hidden" id="mobile-menu">
          <div className="space-y-1 px-2 pt-2 pb-3">
            {navLinks.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={getMobileNavLinkClass}
                onClick={() => setMobileMenuOpen(false)} // Cierra el menú al hacer clic
              >
                {item.name}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};