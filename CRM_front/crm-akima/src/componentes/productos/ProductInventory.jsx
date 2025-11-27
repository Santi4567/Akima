import { useState, useEffect, useCallback } from 'react';
import { MagnifyingGlassIcon, CubeIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../../context/AuthContext';
import { HasPermission } from '../HasPermission';
import { Notification } from '../Notification';
import { PERMISSIONS } from '../../config/permissions';

const API_URL = import.meta.env.VITE_API_URL;
const PRODUCTS_ENDPOINT = `${API_URL}/api/products`;

export const ProductInventory = () => {
  // Estados de Datos
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados de Selección y Edición
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newStock, setNewStock] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Feedback
  const [notification, setNotification] = useState({ type: '', message: '' });
  const { hasAnyPermission } = useAuth();

  // --- 1. CARGA DE PRODUCTOS ---
  const fetchProducts = useCallback(async (query = '') => {
    setIsLoading(true);
    try {
      // Reutilizamos el endpoint de búsqueda que ya tienes o el general
      const url = query 
        ? `${PRODUCTS_ENDPOINT}/search?q=${query}`
        : PRODUCTS_ENDPOINT;

      const response = await fetch(url, { credentials: 'include' });
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.data);
      } else {
        // Si es búsqueda vacía, a veces la API retorna array vacío, no error
        setProducts([]); 
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Error de conexión al cargar inventario.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carga inicial y Debounce del buscador
  useEffect(() => {
    if (hasAnyPermission(PERMISSIONS.PRODUCTS)) {
      const timer = setTimeout(() => fetchProducts(searchTerm), 350);
      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
    }
  }, [searchTerm, fetchProducts, hasAnyPermission]);

  // --- 2. ACTUALIZAR STOCK ---
  const handleUpdateStock = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setIsSubmitting(true);
    try {
      // Usamos PUT para actualizar. Nota: Esto asume que tu endpoint de editar producto
      // acepta enviar SOLO el stock_quantity y mantiene lo demás igual, o actualiza solo ese campo.
      // Si tu API requiere enviar TODO el objeto producto, habría que ajustar esto.
      // Basado en tu .md anterior: "Modificar: curl -v -X PUT ... -d '{ "stock_quantity": 45 }'" -> SÍ FUNCIONA ASÍ.
      
      const response = await fetch(`${PRODUCTS_ENDPOINT}/${selectedProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
            stock_quantity: parseInt(newStock) 
        })
      });

      const data = await response.json();

      if (data.success) {
        setNotification({ type: 'success', message: data.message }); // Usa mensaje del API
        
        // Actualizar la lista localmente para ver el cambio inmediato (Optimistic UI o Refetch)
        // Opción A: Refetch completo (más seguro)
        fetchProducts(searchTerm); 
        
        // Actualizar el seleccionado también para que el form refleje el cambio si no se cierra
        setSelectedProduct(prev => ({ ...prev, stock_quantity: parseInt(newStock) }));
        
      } else {
        setNotification({ type: 'error', message: data.message });
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Error al actualizar el inventario.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Al seleccionar un producto, prellenar el input
  const selectProduct = (prod) => {
    setSelectedProduct(prod);
    setNewStock(prod.stock_quantity);
    setNotification({ type: '', message: '' }); // Limpiar notificaciones viejas
  };

  return (
    <div className="space-y-6">
      <Notification type={notification.type} message={notification.message} onClose={() => setNotification({ type: '', message: '' })} />

      {/* Buscador */}
      <HasPermission required="view.products">
        <div className="relative w-full max-w-xl">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="search"
            placeholder="Buscar producto por nombre o SKU para gestionar stock..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 pl-10 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </HasPermission>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* --- COLUMNA IZQUIERDA: TABLA SIMPLIFICADA --- */}
        <div className="lg:col-span-2 bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
          <div className="overflow-y-auto h-[60vh]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Stock Actual</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr><td colSpan="2" className="p-6 text-center text-gray-500">Cargando inventario...</td></tr>
                ) : (
                  products.map((prod) => (
                    <tr 
                      key={prod.id} 
                      onClick={() => selectProduct(prod)}
                      className={`cursor-pointer transition-colors ${
                        selectedProduct?.id === prod.id ? 'bg-blue-100' : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-gray-900">{prod.sku}</div>
                        <div className="text-sm text-gray-600">{prod.name}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {/* Lógica de colores: > 0 Verde, <= 0 Rojo */}
                        <span className={`px-3 py-1 inline-flex text-sm font-bold rounded-full ${
                          parseInt(prod.stock_quantity) > 0 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {prod.stock_quantity}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
                {!isLoading && products.length === 0 && (
                   <tr><td colSpan="2" className="p-6 text-center text-gray-500">No se encontraron productos.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- COLUMNA DERECHA: FORMULARIO DE ACTUALIZACIÓN --- */}
        <div className="lg:col-span-1">
            {selectedProduct ? (
                <div className="bg-white p-6 rounded-lg shadow-lg border border-blue-100 sticky top-6">
                    <div className="flex items-center gap-2 mb-4 text-blue-800 border-b border-blue-100 pb-2">
                        <CubeIcon className="h-6 w-6" />
                        <h3 className="text-lg font-bold">Gestionar Stock</h3>
                    </div>
                    
                    <div className="mb-4">
                        <p className="text-xs text-gray-500 uppercase">Producto Seleccionado</p>
                        <p className="font-medium text-gray-900">{selectedProduct.name}</p>
                        <p className="text-sm text-gray-500">SKU: {selectedProduct.sku}</p>
                    </div>

                    <HasPermission required="edit.products">
                        <form onSubmit={handleUpdateStock} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nuevo Inventario Total
                                </label>
                                <input 
                                    type="number" 
                                    required
                                    value={newStock}
                                    onChange={(e) => setNewStock(e.target.value)}
                                    className="block w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-lg font-semibold text-center"
                                    placeholder="Ej: 50"
                                />
                                <p className="text-xs text-gray-500 mt-1 text-center">
                                    Esto reemplazará la cantidad actual ({selectedProduct.stock_quantity}).
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 transition-colors shadow-md"
                            >
                                {isSubmitting ? (
                                    'Actualizando...'
                                ) : (
                                    <>
                                        <ArrowPathIcon className="h-5 w-5" />
                                        Actualizar Inventario
                                    </>
                                )}
                            </button>
                        </form>
                    </HasPermission>

                    {!hasAnyPermission(['edit.products']) && (
                        <div className="mt-4 p-3 bg-yellow-50 text-yellow-700 text-sm rounded text-center">
                            No tienes permisos para modificar el inventario.
                        </div>
                    )}
                </div>
            ) : (
                // Estado vacío (sin selección)
                <div className="bg-gray-50 p-8 rounded-lg border-2 border-dashed border-gray-300 text-center">
                    <CubeIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">Inventario Rápido</h3>
                    <p className="text-gray-500 mt-1">
                        Selecciona un producto de la lista de la izquierda para ver y actualizar sus existencias.
                    </p>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};