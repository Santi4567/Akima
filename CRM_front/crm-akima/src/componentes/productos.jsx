import { Link } from 'react-router-dom';
// --- CORRECCIÓN ---
// Añadimos las extensiones .jsx y .js para ser más explícitos con el importador
import { HasPermission } from './HasPermission.jsx'; // Importa el guardián de UI
import { PERMISSIONS } from '../config/permissions.js'; // Importa el mapa

export const Productos = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">
        Gestión de Catálogo
      </h1>
      <p>Selecciona la sección que deseas administrar.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Botón 1: Gestionar Categorías */}
        <HasPermission any={PERMISSIONS.CATEGORY}>
          <Link 
            to="/productos/categorias" 
            className="block p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow"
          >
            <h2 className="text-xl font-semibold text-green-700">
              Gestionar Categorías
            </h2>
            <p className="mt-2 text-gray-600">
              Crea, edita y organiza las categorías de tus productos.
            </p>
          </Link>
        </HasPermission>
        
        {/* Botón 2: Gestionar Productos */}
        <HasPermission any={PERMISSIONS.PRODUCTS}>
          <Link 
            to="/productos/lista" // <-- ¡RUTA FUTURA!
            className="block p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow"
          >
            <h2 className="text-xl font-semibold text-green-700">
              Gestionar Productos
            </h2>
            <p className="mt-2 text-gray-600">
              Administra tu inventario, precios e imágenes de productos.
            </p>
          </Link>
        </HasPermission>
        
      </div>
    </div>
  );
};