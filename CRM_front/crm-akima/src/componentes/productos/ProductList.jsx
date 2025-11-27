import { useState, useEffect, useCallback } from 'react';
import { 
  PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon 
} from '@heroicons/react/24/solid';
import { HasPermission } from '../HasPermission'; // Ajusta la ruta si es necesario
import { Notification } from '../Notification';
import { PERMISSIONS } from '../../config/permissions'; // Ruta sube 2 niveles
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;
const PRODUCTS_ENDPOINT = `${API_URL}/api/products`;

export const ProductList = ({ onCreate, onEdit, onManageImages, externalNotification }) => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState({ type: '', message: '' });
  const [selectedProduct, setSelectedProduct] = useState(null);

  const { hasAnyPermission } = useAuth();

  // Si el Hub nos manda una notificación (ej: "Guardado éxito"), la mostramos
  useEffect(() => {
    if (externalNotification?.message) {
      setNotification(externalNotification);
    }
  }, [externalNotification]);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setSelectedProduct(null);
    try {
      const response = await fetch(PRODUCTS_ENDPOINT, { credentials: 'include' });
      const data = await response.json();
      if (data.success) setProducts(data.data);
      else throw new Error(data.message);
    } catch (error) {
      setNotification({ type: 'error', message: error.message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchProducts = useCallback(async (query) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${PRODUCTS_ENDPOINT}/search?q=${query}`, { credentials: 'include' });
      const data = await response.json();
      if (data.success) setProducts(data.data);
      else setProducts([]); 
    } catch (error) {
      setNotification({ type: 'error', message: error.message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasAnyPermission(PERMISSIONS.PRODUCTS)) fetchProducts();
    else setIsLoading(false);
  }, [fetchProducts, hasAnyPermission]);

  // Debounce para búsqueda
  useEffect(() => {
    const timerId = setTimeout(() => {
      searchTerm === '' ? fetchProducts() : searchProducts(searchTerm);
    }, 350);
    return () => clearTimeout(timerId);
  }, [searchTerm, fetchProducts, searchProducts]);

  const handleDelete = async () => {
    if (!selectedProduct) return;
    if (window.confirm(`¿Eliminar "${selectedProduct.name}"?`)) {
      try {
        const response = await fetch(`${PRODUCTS_ENDPOINT}/${selectedProduct.id}`, {
          method: 'DELETE', credentials: 'include',
        });
        const data = await response.json();
        if (data.success) {
          setNotification({ type: 'success', message: data.message });
          setSelectedProduct(null);
          searchTerm ? searchProducts(searchTerm) : fetchProducts();
        } else throw new Error(data.message);
      } catch (error) {
        setNotification({ type: 'error', message: error.message });
      }
    }
  };

  return (
    <div className="space-y-6">
      <Notification
        type={notification.type} 
        message={notification.message} 
        onClose={() => setNotification({ type: '', message: '' })} 
      />

      {/* Cabecera y Botón Crear */}
      <div className="flex justify-between items-center pb-2">
        <h1 className="text-3xl font-bold text-gray-900">Inventario</h1>
        <HasPermission required="add.products">
          <button onClick={onCreate} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-700">
            <PlusIcon className="h-5 w-5" /> Nuevo Producto
          </button>
        </HasPermission>
      </div>

      {/* Buscador */}
      <HasPermission required="view.products">
        <div className="relative w-full max-w-xl">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="search" placeholder="Buscar..." value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 pl-10 border border-gray-300 rounded-lg shadow-sm focus:ring-green-500"
          />
        </div>
      </HasPermission>

      {/* Acciones */}
      <div className="flex gap-3 flex-wrap">
        <HasPermission required="edit.products">
          <button disabled={!selectedProduct} onClick={() => onEdit(selectedProduct)} className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-yellow-600 disabled:bg-gray-300">
            <PencilIcon className="h-5 w-5" /> Modificar
          </button>
        </HasPermission>
        <HasPermission required="edit.products">
          <button disabled={!selectedProduct} onClick={() => onManageImages(selectedProduct)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-300">
            <PlusIcon className="h-5 w-5" /> Gestionar Fotos
          </button>
        </HasPermission>
        <HasPermission required="delete.products">
          <button disabled={!selectedProduct} onClick={handleDelete} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-red-700 disabled:bg-gray-300">
            <TrashIcon className="h-5 w-5" /> Eliminar
          </button>
        </HasPermission>
      </div>

      {/* Tabla */}
      <div className="bg-white shadow-xl rounded-lg overflow-hidden">
        <div className="overflow-y-auto h-[60vh]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">SKU / Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Precio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Estado</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan="4" className="p-6 text-center">Cargando...</td></tr>
              ) : (
                products.map((prod) => (
                  <tr key={prod.id} onClick={() => setSelectedProduct(prod)} className={`cursor-pointer ${selectedProduct?.id === prod.id ? 'bg-blue-100' : 'hover:bg-gray-50'}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{prod.sku}</div>
                      <div className="text-sm text-gray-500">{prod.name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">${prod.price}</td>
                    <td className="px-6 py-4 text-sm">{prod.stock_quantity}</td>
                    <td className="px-6 py-4"><span className={`px-2 text-xs rounded-full ${prod.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>{prod.status}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};