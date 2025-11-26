import { UsersIcon, ShieldCheckIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../../context/AuthContext';

export const UserHub = ({ activeTab, onTabChange }) => {
  const { isSuperAdmin } = useAuth(); // Asumimos que tienes esto en tu contexto

  const getTabClass = (tabName) => {
    const isActive = activeTab === tabName;
    return `whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
      isActive
        ? 'border-green-500 text-green-600'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`;
  };

  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        
        <button onClick={() => onTabChange('list')} className={getTabClass('list')}>
          <UsersIcon className="h-5 w-5" />
          Gestión de Usuarios
        </button>

        {/* Solo Admin puede ver la gestión de roles */}
        {isSuperAdmin() && (
          <button onClick={() => onTabChange('roles')} className={getTabClass('roles')}>
            <ShieldCheckIcon className="h-5 w-5" />
            Roles y Permisos
          </button>
        )}

      </nav>
    </div>
  );
};