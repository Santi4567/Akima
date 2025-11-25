import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';

// --- Importaciones Corregidas ---
// 1. Sube un nivel para encontrar la carpeta 'context'
import { useAuth } from '../context/AuthContext.jsx'; 
// 2. Está en la misma carpeta 'componentes'
import { HasPermission } from './HasPermission.jsx'; 
// 3. Sube un nivel para encontrar la carpeta 'config'
import { PERMISSIONS } from '../config/permissions.js'; 

// Importamos los iconos
import { 
  Bars3Icon, 
  XMarkIcon, 
  ArrowRightOnRectangleIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

// --- Logo (Puedes reemplazar esto) ---
const Logo = () => (
  <svg className="h-8 w-auto text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1.5-1.5m1.5 1.5l1.5-1.5m0 0l1.5 1.5m-1.5-1.5l-1.5 1.5m-3-3l3 3m0 0l3-3m-3 3v-6m0 6h-3.75m3.75 0h3.75M9 12.75l3 3m0 0l3-3m-3 3v-6m0 6H6m3 0h3" />
  </svg>
);
// --- Fin del Logo ---

// --- Definimos los links de navegación CON PERMISOS ---
const navLinks = [
  { name: 'Home', href: '/home', permissions: [] }, // Home es para todos los logueados
  { name: 'Productos', href: '/productos', permissions: [...PERMISSIONS.PRODUCTS, ...PERMISSIONS.CATEGORY] },
  { name: 'Clientes', href: '/clientes', permissions: PERMISSIONS.CLIENTS },
  { name: 'Proveedores', href: '/proveedores', permissions: PERMISSIONS.SUPPLIERS },
  { name: 'Órdenes', href: '/ordenes', permissions: PERMISSIONS.ORDERS },
  { name: 'Visitas', href: '/visitas', permissions: PERMISSIONS.VISITS },
  { name: 'Usuarios', href: '/usuarios', permissions: PERMISSIONS.USERS },
  { name: 'Finanzas', href: '/finanzas', permissions: PERMISSIONS.FINANCE },
];

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Obtenemos el usuario y la función de logout del contexto
  const { user, logout } = useAuth();

  // --- Clases de Tailwind para los links (activo vs. inactivo) ---
  const activeClassName = "bg-green-100 text-green-700 rounded-md px-3 py-2 text-sm font-medium";
  const inactiveClassName = "text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md px-3 py-2 text-sm font-medium";
  const getNavLinkClass = ({ isActive }) => isActive ? activeClassName : inactiveClassName;

  const mobileActiveClass = "bg-green-100 text-green-700 block rounded-md px-3 py-2 text-base font-medium";
  const mobileInactiveClass = "text-gray-700 hover:bg-gray-100 hover:text-gray-900 block rounded-md px-3 py-2 text-base font-medium";
  const getMobileNavLinkClass = ({ isActive }) => isActive ? mobileActiveClass : mobileInactiveClass;
  // --- Fin de clases ---

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          
          {/* Izquierda: Logo */}
          <div className="flex items-center">
            <Link to="/home" className="flex-shrink-0 flex items-center gap-2">
              <Logo />
              <span className="hidden sm:block font-bold text-xl text-gray-800">Alkima CRM</span>
            </Link>
          </div>

          {/* Centro: Links (Desktop) - Oculto en móvil */}
          <div className="hidden lg:ml-6 lg:flex lg:items-center lg:space-x-4">
            {navLinks.map((item) => (
              // Aquí está la magia:
              // HasPermission revisa los permisos antes de renderizar el NavLink
              <HasPermission key={item.name} any={item.permissions}>
                <NavLink
                  to={item.href}
                  className={getNavLinkClass}
                >
                  {item.name}
                </NavLink>
              </HasPermission>
            ))}
          </div>

          {/* --- Derecha (Desktop) - Usuario y Logout --- */}
          <div className="hidden lg:ml-4 lg:flex lg:items-center">
            <span className="text-sm font-medium text-gray-700">
              Hola, {user?.nombre || 'Usuario'}
            </span>
            <button
              onClick={logout}
              title="Cerrar Sesión"
              className="ml-4 flex-shrink-0 rounded-full bg-white p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <span className="sr-only">Cerrar Sesión</span>
              <ArrowRightOnRectangleIcon className="h-6 w-6" aria-hidden="true" />
            </button>
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
          
          {/* Links del Menú */}
            <div className="space-y-1 px-2 pt-2 pb-3">
              {navLinks.map((item) => (
                // Se aplica la misma lógica de HasPermission aquí
                <HasPermission key={item.name} any={item.permissions}>
                  <NavLink
                    to={item.href}
                    className={getMobileNavLinkClass}
                    onClick={() => setMobileMenuOpen(false)} // Cierra el menú al hacer clic
                  >
                    {item.name}
                  </NavLink>
                </HasPermission>
              ))}
            </div>

          {/* --- Menú Móvil - Perfil y Logout --- */}
          <div className="border-t border-gray-200 pt-4 pb-3">
            <div className="flex items-center px-5">
              <div className="flex-shrink-0">
                <UserCircleIcon className="h-10 w-10 text-gray-400" />
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">{user?.nombre}</div>
                <div className="text-sm font-medium text-gray-500">{user?.correo}</div>
              </div>
            </div>
            <div className="mt-3 space-y-1 px-2">
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
          {/* --- Fin Menú Móvil Perfil --- */}
          
        </div>
      )}
    </nav>
  );
};