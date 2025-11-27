import { HomeIcon, GlobeAltIcon, Cog6ToothIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../../context/AuthContext';

export const HomeHubNav = ({ activeTab, onTabChange }) => {
  const { isSuperAdmin } = useAuth(); // Para ocultar la pestaña de config si no es admin

  const getTabClass = (tabName) => {
    const isActive = activeTab === tabName;
    return `whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
      isActive
        ? 'border-green-500 text-green-600'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`;
  };

  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        
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