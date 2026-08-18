import { Link } from 'react-router-dom';
import { 
  CubeIcon, 
  TagIcon, 
  PhotoIcon, 
  ClipboardDocumentListIcon
} from '@heroicons/react/24/solid';

export const ProductHubNav = ({ activeTab, onTabChange }) => {
  
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

        <Link to="/productos/categorias" className={getTabClass('categories')}>
          <TagIcon className="h-5 w-5" />
          Categorías
        </Link>

      </nav>
    </div>
  );
};