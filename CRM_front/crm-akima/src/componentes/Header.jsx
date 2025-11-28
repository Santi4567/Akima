import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  Bars3Icon, 
  XMarkIcon, 
  ArrowRightOnRectangleIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

// --- Logo ---
const Logo = () => (
  <svg className="h-8 w-auto text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1.5-1.5m1.5 1.5l1.5-1.5m0 0l1.5 1.5m-1.5-1.5l-1.5 1.5m-3-3l3 3m0 0l3-3m-3 3v-6m0 6h-3.75m3.75 0h3.75M9 12.75l3 3m0 0l3-3m-3 3v-6m0 6H6m3 0h3" />
  </svg>
);

// --- Definición de Links ---
const navLinks = [
  { name: 'Home', href: '/home', requireGroup: null }, 
  { name: 'Productos', href: '/productos', requireGroup: 'PRODUCTS' },
  { name: 'Clientes', href: '/clientes', requireGroup: 'CLIENTS' },
  { name: 'Proveedores', href: '/proveedores', requireGroup: 'SUPPLIERS' }, 
  { name: 'Órdenes', href: '/ordenes', requireGroup: 'ORDERS' },
  { name: 'Visitas', href: '/visitas', requireGroup: 'VISITS' },
  { name: 'Usuarios', href: '/usuarios', requireGroup: 'USERS' },
  // CAMBIO AQUÍ: Agregamos la propiedad 'onlyAdmin'
  { name: 'Finanzas', href: '/finanzas', onlyAdmin: true }, 
];

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Traemos 'hasGroupAccess' y 'hasPermission' pero la lógica fuerte la haremos aquí
  const { user, logout, hasGroupAccess, hasPermission } = useAuth();

  // --- Lógica de Visibilidad Robusta ---
  const canShowLink = (item) => {
    // 1. Validación estricta para Finanzas (Solo rol 'admin')
    if (item.onlyAdmin) {
      return user?.rol === 'admin';
    }

    // 2. Si es Admin, ¡VE TODO LO DEMÁS! (Esto soluciona que no te aparezca nada)
    if (user?.rol === 'admin') {
      return true;
    }

    // 3. Validaciones para el resto de mortales (Vendedores, Gerentes, etc.)
    if (item.requireGroup) return hasGroupAccess(item.requireGroup);
    if (item.specificPermission) return hasPermission(item.specificPermission);
    
    return true; // Home (sin restricciones) se muestra siempre
  };

  // --- Clases Tailwind ---
  const activeClassName = "bg-green-100 text-green-700 rounded-md px-3 py-2 text-sm font-medium";
  const inactiveClassName = "text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md px-3 py-2 text-sm font-medium";
  const getNavLinkClass = ({ isActive }) => isActive ? activeClassName : inactiveClassName;

  const mobileActiveClass = "bg-green-100 text-green-700 block rounded-md px-3 py-2 text-base font-medium";
  const mobileInactiveClass = "text-gray-700 hover:bg-gray-100 hover:text-gray-900 block rounded-md px-3 py-2 text-base font-medium";
  const getMobileNavLinkClass = ({ isActive }) => isActive ? mobileActiveClass : mobileInactiveClass;

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/home" className="flex-shrink-0 flex items-center gap-2">
              <Logo />
              <span className="hidden sm:block font-bold text-xl text-gray-800">Alkima CRM</span>
            </Link>
          </div>

          {/* Menú Desktop */}
          <div className="hidden lg:ml-6 lg:flex lg:items-center lg:space-x-4">
            {navLinks.map((item) => (
              // Usamos la función canShowLink antes de renderizar
              canShowLink(item) && (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={getNavLinkClass}
                >
                  {item.name}
                </NavLink>
              )
            ))}
          </div>

          {/* Usuario y Logout */}
          <div className="hidden lg:ml-4 lg:flex lg:items-center">
            <span className="text-sm font-medium text-gray-700">
              Hola, {user?.nombre || 'Usuario'}
            </span>
            <button
              onClick={logout}
              title="Cerrar Sesión"
              className="ml-4 flex-shrink-0 rounded-full bg-white p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <ArrowRightOnRectangleIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          {/* Botón Móvil */}
          <div className="flex items-center lg:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Menú Móvil */}
      {mobileMenuOpen && (
        <div className="lg:hidden" id="mobile-menu">
            <div className="space-y-1 px-2 pt-2 pb-3">
              {navLinks.map((item) => (
                canShowLink(item) && (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={getMobileNavLinkClass}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </NavLink>
                )
              ))}
            </div>

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
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="block w-full text-left rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};