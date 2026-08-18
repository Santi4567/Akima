import { HomeIcon, GlobeAltIcon, Cog6ToothIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../../context/AuthContext';

export const HomeHubNav = ({ activeTab, onTabChange }) => {
  const { isSuperAdmin } = useAuth(); // Para ocultar la pestaña de config si no es admin

  const getTabClass = (tabName) => {
    const isActive = activeTab === tabName;
    return `whitespace-nowrap px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all duration-200 ${
      isActive
        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm'
        : 'text-slate-600 bg-transparent hover:text-emerald-700 hover:bg-emerald-50 border border-transparent'
    }`;
  };

  return (
    <div className="mb-8">
      {/* Contenedor con fondo blanco puro y borde definido para que resalte sobre el fondo general */}
      <nav className="inline-flex p-1.5 space-x-2 bg-white border border-slate-300 rounded-xl overflow-x-auto shadow-sm" aria-label="Tabs">
        
        {/* TAB 1: INICIO (Dashboard Operativo) */}
        <button onClick={() => onTabChange('dashboard')} className={getTabClass('dashboard')}>
          <HomeIcon className="h-5 w-5" />
          Inicio
        </button>

        {/* TAB 2: WEB (Gestión de Contenido) */}
        {isSuperAdmin() && (
        <button onClick={() => onTabChange('web')} className={getTabClass('web')}>
          <GlobeAltIcon className="h-5 w-5" />
          Sitio Web
        </button>
        )}

        {/* TAB 3: CONFIGURACIÓN (Solo Admins) */}
        {isSuperAdmin() && (
          <button onClick={() => onTabChange('settings')} className={getTabClass('settings')}>
            <Cog6ToothIcon className="h-5 w-5" />
            Configuración
          </button>
        )}

      </nav>
    </div>
  );
};