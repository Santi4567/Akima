import { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  Bars3Icon, 
  XMarkIcon, 
  ArrowRightOnRectangleIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

const API_URL = import.meta.env.VITE_API_URL;

// --- Logo SVG (Fallback) ---
const LogoSVG = () => (
  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/30 text-white font-black text-lg">
    A
  </div>
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
  { name: 'Finanzas', href: '/finanzas', onlyAdmin: true }, 
];

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoPath, setLogoPath] = useState(null); 
  
  const { user, logout, hasGroupAccess, hasPermission } = useAuth();

  useEffect(() => {
    const fetchCompanyLogo = async () => {
      try {
        const res = await fetch(`${API_URL}/api/company/public`, { credentials: 'include' });
        const data = await res.json();
        
        if (data.success && data.data?.logo_path) {
          setLogoPath(data.data.logo_path);
        }
      } catch (error) {
        console.error("Error cargando logo de empresa", error);
      }
    };
    
    fetchCompanyLogo();
  }, []);

  const canShowLink = (item) => {
    if (item.onlyAdmin) return user?.rol === 'admin';
    if (user?.rol === 'admin') return true;
    if (item.requireGroup) return hasGroupAccess(item.requireGroup);
    if (item.specificPermission) return hasPermission(item.specificPermission);
    return true; 
  };

  // --- Nuevas Clases Tailwind (Dark SaaS Theme) ---
  const activeClassName = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg px-3.5 py-2 text-sm font-semibold transition-all shadow-sm";
  const inactiveClassName = "text-slate-300 hover:bg-slate-800/60 hover:text-white rounded-lg px-3.5 py-2 text-sm font-medium transition-all";

  const mobileActiveClass = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 block rounded-lg px-4 py-3 text-base font-semibold shadow-sm";
  const mobileInactiveClass = "text-slate-300 hover:bg-slate-800/60 hover:text-white block rounded-lg px-4 py-3 text-base font-medium transition-all";

  return (
    <nav className="bg-slate-950 border-b border-slate-800 shadow-sm sticky top-0 z-50 selection:bg-emerald-500 selection:text-white">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          
          {/* Logo y Branding */}
          <div className="flex items-center">
            <Link to="/home" className="flex-shrink-0 flex items-center gap-3 transition-transform hover:scale-105 duration-200">
              {logoPath ? (
                <img 
                  src={`${API_URL}${logoPath}`} 
                  alt="Logo Empresa" 
                  className="h-9 w-auto object-contain drop-shadow-md" 
                />
              ) : (
                <LogoSVG />
              )}
              <span className="hidden sm:block font-bold text-xl tracking-tight text-white">Alkima CRM</span>
            </Link>
          </div>

          {/* Menú Desktop */}
          <div className="hidden lg:ml-8 lg:flex lg:items-center lg:space-x-2">
            {navLinks.map((item) => (
              canShowLink(item) && (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) => isActive ? activeClassName : inactiveClassName}
                >
                  {item.name}
                </NavLink>
              )
            ))}
          </div>

          {/* Área de Usuario y Logout */}
          <div className="hidden lg:ml-6 lg:flex lg:items-center lg:gap-4">
            <div className="flex items-center gap-2 border-l border-slate-800 pl-6">
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-slate-200 leading-tight">
                  {user?.nombre || 'Usuario'}
                </span>
                <span className="text-xs text-slate-500 capitalize leading-tight">
                  {user?.rol || 'Rol'}
                </span>
              </div>
              <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                <UserCircleIcon className="h-6 w-6 text-emerald-500" />
              </div>
            </div>

            <button
              onClick={logout}
              title="Cerrar Sesión"
              className="ml-2 flex-shrink-0 rounded-lg p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all duration-200"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {/* Botón Hamburguesa (Móvil) */}
          <div className="flex items-center lg:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg p-2.5 text-slate-400 hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500 transition-colors"
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

      {/* Menú Móvil Desplegable */}
      {mobileMenuOpen && (
        <div className="lg:hidden animate-fadeIn border-t border-slate-800 bg-slate-900" id="mobile-menu">
            <div className="space-y-1.5 px-4 pt-4 pb-3">
              {navLinks.map((item) => (
                canShowLink(item) && (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) => isActive ? mobileActiveClass : mobileInactiveClass}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </NavLink>
                )
              ))}
            </div>

          <div className="border-t border-slate-800 pt-4 pb-6">
            <div className="flex items-center px-5">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                  <UserCircleIcon className="h-6 w-6 text-emerald-500" />
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-semibold text-white">{user?.nombre}</div>
                <div className="text-sm font-medium text-emerald-400">{user?.correo}</div>
              </div>
            </div>
            <div className="mt-4 space-y-1 px-4">
              <button
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="flex w-full items-center gap-2 rounded-lg px-4 py-3 text-base font-medium text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};