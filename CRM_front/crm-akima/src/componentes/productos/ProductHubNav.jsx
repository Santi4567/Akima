// src/componentes/productos/ProductHubNav.jsx

import { Link } from 'react-router-dom';
import { CubeIcon, TagIcon, PhotoIcon } from '@heroicons/react/24/solid';

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
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        
        {/* TAB 1: INVENTARIO */}
        {onTabChange ? (
          <button onClick={() => onTabChange('list')} className={getTabClass('list')}>
            <CubeIcon className="h-5 w-5" />
            Inventario
          </button>
        ) : (
          <Link to="/productos" className={getTabClass('list')}>
            <CubeIcon className="h-5 w-5" />
            Inventario
          </Link>
        )}

        {/* TAB 2: IMÁGENES (AQUÍ ESTÁ EL CAMBIO CLAVE) */}
        {onTabChange ? (
          <button onClick={() => onTabChange('images')} className={getTabClass('images')}>
            <PhotoIcon className="h-5 w-5" />
            Imágenes
          </button>
        ) : (
          // Usamos 'state' para pasar el dato de qué tab abrir
          <Link 
            to="/productos" 
            state={{ initialTab: 'images' }} 
            className={getTabClass('images')}
          >
            <PhotoIcon className="h-5 w-5" />
            Imágenes
          </Link>
        )}

        {/* TAB 3: CATEGORÍAS */}
        <Link to="/productos/categorias" className={getTabClass('categories')}>
          <TagIcon className="h-5 w-5" />
          Categorías
        </Link>

      </nav>
    </div>
  );
};