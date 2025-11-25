import { Link } from 'react-router-dom';
import { 
  CubeIcon, 
  TagIcon, 
  PhotoIcon, 
  ClipboardDocumentListIcon // Nuevo icono para la lista
} from '@heroicons/react/24/solid';

export const ProductHubNav = ({ activeTab, onTabChange }) => {
  
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
      <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
        
        {/* TAB 1: LISTA DE PRODUCTOS (Antes Inventario) */}
        {onTabChange ? (
          <button onClick={() => onTabChange('list')} className={getTabClass('list')}>
            <ClipboardDocumentListIcon className="h-5 w-5" />
            Lista de Productos
          </button>
        ) : (
          <Link to="/productos" state={{ initialTab: 'list' }} className={getTabClass('list')}>
            <ClipboardDocumentListIcon className="h-5 w-5" />
            Lista de Productos
          </Link>
        )}

        {/* TAB 2: INVENTARIO (NUEVA PESTAÑA DE STOCK) */}
        {onTabChange ? (
          <button onClick={() => onTabChange('inventory')} className={getTabClass('inventory')}>
            <CubeIcon className="h-5 w-5" />
            Inventario (Stock)
          </button>
        ) : (
          <Link to="/productos" state={{ initialTab: 'inventory' }} className={getTabClass('inventory')}>
            <CubeIcon className="h-5 w-5" />
            Inventario (Stock)
          </Link>
        )}

        {/* TAB 3: IMÁGENES */}
        {onTabChange ? (
          <button onClick={() => onTabChange('images')} className={getTabClass('images')}>
            <PhotoIcon className="h-5 w-5" />
            Imágenes
          </button>
        ) : (
          <Link to="/productos" state={{ initialTab: 'images' }} className={getTabClass('images')}>
            <PhotoIcon className="h-5 w-5" />
            Imágenes
          </Link>
        )}

        {/* TAB 4: CATEGORÍAS */}
        <Link to="/productos/categorias" className={getTabClass('categories')}>
          <TagIcon className="h-5 w-5" />
          Categorías
        </Link>

      </nav>
    </div>
  );
};