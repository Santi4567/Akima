import { useState, useEffect, useCallback } from 'react';
import { 
  PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, PhotoIcon, ArrowPathIcon, CubeIcon 
} from '@heroicons/react/24/solid';
import { HasPermission } from '../HasPermission'; 
import { Notification } from '../Notification';
import { PERMISSIONS } from '../../config/permissions'; 
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
        <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Inventario</h1>
            <p className="text-sm text-slate-600 mt-1">Gestiona tu catálogo general de productos</p>
        </div>
        <HasPermission required="add.products">
          <button onClick={onCreate} className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-bold shadow-md shadow-emerald-500/30 hover:bg-emerald-700 hover:shadow-emerald-600/40 hover:-translate-y-0.5 transition-all active:translate-y-0">
            <PlusIcon className="h-5 w-5" /> Nuevo Producto
          </button>
        </HasPermission>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* Buscador */}
        <HasPermission required="view.products">
            <div className="relative w-full md:max-w-md">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon className="h-5 w-5 text-slate-500" />
            </div>
            <input
                type="search" placeholder="Buscar por SKU o Nombre..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2.5 pl-10 bg-white border border-slate-300 text-slate-900 placeholder-slate-400 rounded-xl shadow-sm text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
            />
            </div>
        </HasPermission>

        {/* Acciones Secundarias (Colores sólidos pastel para mayor contraste) */}
        <div className="flex gap-3 flex-wrap">
            <HasPermission required="edit.products">
            <button disabled={!selectedProduct} onClick={() => onEdit(selectedProduct)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 hover:border-amber-400 disabled:opacity-50 disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400 shadow-sm">
                <PencilIcon className="h-4 w-4" /> Modificar
            </button>
            </HasPermission>
            <HasPermission required="edit.products">
            <button disabled={!selectedProduct} onClick={() => onManageImages(selectedProduct)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all border border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100 hover:border-blue-400 disabled:opacity-50 disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400 shadow-sm">
                <PhotoIcon className="h-4 w-4" /> Fotos
            </button>
            </HasPermission>
            <HasPermission required="delete.products">
            <button disabled={!selectedProduct} onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all border border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100 hover:border-rose-400 disabled:opacity-50 disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400 shadow-sm">
                <TrashIcon className="h-4 w-4" /> Eliminar
            </button>
            </HasPermission>
        </div>
      </div>

      {/* Tabla con Estilo Tarjeta Blanca */}
      <div className="bg-white shadow-lg shadow-slate-200/50 rounded-2xl border border-slate-300 overflow-hidden">
        <div className="overflow-y-auto max-h-[60vh]">
          <table className="min-w-full text-left border-collapse">
            <thead className="bg-slate-100/90 backdrop-blur-md sticky top-0 z-10 border-b border-slate-300">
              <tr>
                <th scope="col" className="px-6 py-4 text-xs font-extrabold text-slate-700 uppercase tracking-widest">
                    Producto
                </th>
                <th scope="col" className="px-6 py-4 text-xs font-extrabold text-slate-700 uppercase tracking-widest">
                    Precio Unitario
                </th>
                <th scope="col" className="px-6 py-4 text-xs font-extrabold text-slate-700 uppercase tracking-widest">
                    Disponibilidad
                </th>
                <th scope="col" className="px-6 py-4 text-xs font-extrabold text-slate-700 uppercase tracking-widest">
                    Estado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {isLoading ? (
                <tr>
                    <td colSpan="4" className="p-16 text-center text-slate-500 font-bold">
                        <ArrowPathIcon className="h-8 w-8 animate-spin mx-auto mb-3 text-emerald-600" />
                        Cargando catálogo...
                    </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                    <td colSpan="4" className="p-16 text-center text-slate-500 font-bold text-lg">
                        No se encontraron productos.
                    </td>
                </tr>
              ) : (
                products.map((prod) => (
                  <tr 
                    key={prod.id} 
                    onClick={() => setSelectedProduct(prod)} 
                    className={`cursor-pointer group transition-all duration-200 border-l-4 ${
                        selectedProduct?.id === prod.id 
                            ? 'bg-emerald-50/80 border-emerald-500' 
                            : 'border-transparent hover:bg-slate-50'
                    }`}
                  >
                    {/* Columna: Ícono + Nombre + SKU */}
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                            {/* Ícono de caja (Colores más oscuros) */}
                            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                                selectedProduct?.id === prod.id 
                                ? 'bg-white border-emerald-300 text-emerald-700 shadow-sm' 
                                : 'bg-slate-100 border-slate-300 text-slate-600 group-hover:border-emerald-300 group-hover:text-emerald-600'
                            }`}>
                                <CubeIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <div className="font-extrabold text-slate-900 text-sm">{prod.name}</div>
                                <div className="text-xs font-bold text-slate-500 mt-0.5 font-mono tracking-wide">{prod.sku}</div>
                            </div>
                        </div>
                    </td>

                    {/* Columna: Precio */}
                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-extrabold text-slate-800">
                            ${parseFloat(prod.price).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </span>
                    </td>

                    {/* Columna: Stock con Semáforo */}
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                            <div className={`h-2.5 w-2.5 rounded-full ${
                                prod.stock_quantity > 10 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]' : 
                                prod.stock_quantity > 0 ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.7)]' : 
                                'bg-rose-600 shadow-[0_0_8px_rgba(225,29,72,0.7)]'
                            }`}></div>
                            
                            <span className={`text-sm font-extrabold ${prod.stock_quantity <= 0 ? 'text-rose-700' : 'text-slate-800'}`}>
                                {prod.stock_quantity} <span className="text-xs font-semibold text-slate-500 ml-0.5">unidades</span>
                            </span>
                        </div>
                    </td>

                    {/* Columna: Estado (Badge) */}
                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold border ${
                            prod.status === 'active' 
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}>
                            <svg className={`mr-1.5 h-2 w-2 ${prod.status === 'active' ? 'text-emerald-600' : 'text-slate-500'}`} fill="currentColor" viewBox="0 0 8 8">
                                <circle cx="4" cy="4" r="3" />
                            </svg>
                            {prod.status === 'active' ? 'Activo' : prod.status}
                        </span>
                    </td>
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