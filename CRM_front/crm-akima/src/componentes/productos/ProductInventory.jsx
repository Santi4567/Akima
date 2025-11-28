import { useState, useEffect, useCallback } from 'react';
import { 
  MagnifyingGlassIcon, 
  CubeIcon, 
  ArrowPathIcon, 
  PlusCircleIcon, 
  MinusCircleIcon, 
  ClipboardDocumentCheckIcon,
  FunnelIcon,
  ClockIcon
} from '@heroicons/react/24/solid';
import { useAuth } from '../../context/AuthContext';
import { HasPermission } from '../HasPermission';
import { Notification } from '../Notification';
import { PERMISSIONS } from '../../config/permissions';

// IMPORTAR EL NUEVO MODAL
import { InventoryLogsModal } from './InventoryLogsModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const PRODUCTS_ENDPOINT = `${API_URL}/api/products`;

export const ProductInventory = () => {
  // --- Estados de Datos ---
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]); // Nuevo estado para filtrado local
  const [isLoading, setIsLoading] = useState(true);
  
  // --- Filtros y Búsqueda ---
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState('all'); // 'all', 'positive', 'negative'
  
  // --- Estados de Selección y Movimiento ---
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [moveType, setMoveType] = useState('add'); 
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  
  // --- Estado del Modal de Historial ---
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyTarget, setHistoryTarget] = useState(null); // null = General, {id, name} = Producto específico

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });
  
  const { hasAnyPermission } = useAuth();

  // --- 1. CARGA DE PRODUCTOS ---
  const fetchProducts = useCallback(async (query = '') => {
    setIsLoading(true);
    try {
      const url = query ? `${PRODUCTS_ENDPOINT}/search?q=${query}` : PRODUCTS_ENDPOINT;
      const response = await fetch(url, { credentials: 'include' });
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.data);
      } else {
        setProducts([]); 
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Error de conexión al cargar inventario.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasAnyPermission(PERMISSIONS.PRODUCTS)) {
      const timer = setTimeout(() => fetchProducts(searchTerm), 350);
      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
    }
  }, [searchTerm, fetchProducts, hasAnyPermission]);

  // --- 2. FILTRADO LOCAL (Stock Positivo/Negativo) ---
  useEffect(() => {
    let result = products;

    if (stockFilter === 'positive') {
        result = products.filter(p => parseInt(p.stock_quantity) > 0);
    } else if (stockFilter === 'negative') {
        // Incluye 0 y negativos
        result = products.filter(p => parseInt(p.stock_quantity) <= 0);
    }

    setFilteredProducts(result);
  }, [products, stockFilter]);


  // --- 3. REGISTRAR MOVIMIENTO (PUT) ---
  const handleUpdateStock = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (!quantity || parseInt(quantity) < 0) {
        setNotification({ type: 'error', message: 'Ingresa una cantidad válida.' });
        return;
    }
    if (!reason.trim()) {
        setNotification({ type: 'error', message: 'El motivo es obligatorio.' });
        return;
    }

    setIsSubmitting(true);
    setNotification({ type: '', message: '' });

    try {
      const response = await fetch(`${PRODUCTS_ENDPOINT}/${selectedProduct.id}/inventory`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
            type: moveType,          
            quantity: parseInt(quantity),
            reason: reason
        })
      });

      const data = await response.json();

      if (data.success) {
        setNotification({ type: 'success', message: data.message }); 
        fetchProducts(searchTerm);
        if (data.data && data.data.new_stock !== undefined) {
            setSelectedProduct(prev => ({ ...prev, stock_quantity: data.data.new_stock }));
        }
        setQuantity('');
        setReason('');
      } else {
        setNotification({ type: 'error', message: data.message });
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Error al actualizar el inventario.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectProduct = (prod) => {
    setSelectedProduct(prod);
    setMoveType('add');
    setQuantity('');
    setReason('');
    setNotification({ type: '', message: '' });
  };

  const openGeneralHistory = () => {
    setHistoryTarget(null); // null indica historial general
    setShowHistoryModal(true);
  };

  const openProductHistory = (e, prod) => {
    e.stopPropagation(); // Evitar seleccionar el producto al dar click en historial
    setHistoryTarget(prod);
    setShowHistoryModal(true);
  };

  const getActionConfig = () => {
    switch (moveType) {
        case 'add': return { color: 'green', text: 'Registrar Entrada', label: 'Cantidad a Sumar' };
        case 'subtract': return { color: 'red', text: 'Registrar Salida/Merma', label: 'Cantidad a Restar' };
        case 'set': return { color: 'blue', text: 'Ajustar Inventario Físico', label: 'Conteo Real (Físico)' };
        default: return { color: 'gray', text: 'Actualizar', label: 'Cantidad' };
    }
  };

  const actionConfig = getActionConfig();

  return (
    <div className="space-y-6">
      <Notification type={notification.type} message={notification.message} onClose={() => setNotification({ type: '', message: '' })} />

      {/* MODAL DE HISTORIAL */}
      {showHistoryModal && (
        <InventoryLogsModal 
            productId={historyTarget?.id}
            productName={historyTarget?.name}
            onClose={() => setShowHistoryModal(false)}
        />
      )}

      {/* BARRA DE HERRAMIENTAS (Buscador + Filtros + Botón General) */}
      <HasPermission required="view.products">
        <div className="flex flex-col md:flex-row gap-4 items-end justify-between bg-white p-4 rounded-lg border shadow-sm">
            
            {/* Buscador */}
            <div className="relative w-full md:w-1/3">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="search"
                    placeholder="Buscar producto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            {/* Filtro de Stock */}
            <div className="w-full md:w-1/3">
                <label className="text-xs font-bold text-gray-500 flex items-center gap-1 mb-1">
                    <FunnelIcon className="h-3 w-3"/> Filtrar por Estado
                </label>
                <select 
                    value={stockFilter}
                    onChange={(e) => setStockFilter(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-blue-500"
                >
                    <option value="all">Mostrar Todo</option>
                    <option value="positive">🟢 Stock Saludable (Positivo)</option>
                    <option value="negative">🔴 Stock Crítico (Cero o Negativo)</option>
                </select>
            </div>

            {/* Botón Historial General */}
            <button 
                onClick={openGeneralHistory}
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-900 transition-colors shadow-sm whitespace-nowrap"
            >
                <ClockIcon className="h-5 w-5 text-gray-300"/>
                Historial General
            </button>
        </div>
      </HasPermission>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* --- COLUMNA IZQUIERDA: LISTA --- */}
        <div className="lg:col-span-2 bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
          <div className="overflow-y-auto h-[60vh]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Historial</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr><td colSpan="3" className="p-6 text-center text-gray-500">Cargando inventario...</td></tr>
                ) : (
                  filteredProducts.map((prod) => (
                    <tr 
                      key={prod.id} 
                      onClick={() => selectProduct(prod)}
                      className={`cursor-pointer transition-colors group ${
                        selectedProduct?.id === prod.id ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50 border-l-4 border-transparent'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-gray-900">{prod.sku}</div>
                        <div className="text-sm text-gray-600">{prod.name}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 inline-flex text-sm font-bold rounded-full ${
                          parseInt(prod.stock_quantity) > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {prod.stock_quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                            onClick={(e) => openProductHistory(e, prod)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                            title="Ver Kardex del Producto"
                        >
                            <ClipboardDocumentCheckIcon className="h-5 w-5"/>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- COLUMNA DERECHA: FORMULARIO --- */}
        <div className="lg:col-span-1">
            {selectedProduct ? (
                <div className="bg-white p-6 rounded-lg shadow-lg border border-blue-100 sticky top-6">
                    {/* (Contenido del formulario igual que antes...) */}
                    <div className="flex items-center gap-2 mb-4 text-blue-800 border-b border-blue-100 pb-2">
                        <CubeIcon className="h-6 w-6" />
                        <h3 className="text-lg font-bold">Gestionar Stock</h3>
                    </div>
                    
                    <div className="mb-4">
                        <p className="text-xs text-gray-500 uppercase">Producto Seleccionado</p>
                        <p className="font-medium text-gray-900">{selectedProduct.name}</p>
                    </div>

                    <HasPermission required="adjust.inventory">
                        <form onSubmit={handleUpdateStock} className="space-y-5">
                            {/* Selector Tipo */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Movimiento</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button 
                                        type="button" onClick={() => setMoveType('add')}
                                        className={`flex flex-col items-center justify-center p-2 rounded-md border text-xs font-bold transition-all ${
                                            moveType === 'add' ? 'bg-green-50 border-green-500 text-green-700 ring-1 ring-green-500' : 'bg-white hover:bg-gray-50'
                                        }`}
                                    >
                                        <PlusCircleIcon className="h-6 w-6 mb-1"/> Entrada
                                    </button>
                                    <button 
                                        type="button" onClick={() => setMoveType('subtract')}
                                        className={`flex flex-col items-center justify-center p-2 rounded-md border text-xs font-bold transition-all ${
                                            moveType === 'subtract' ? 'bg-red-50 border-red-500 text-red-700 ring-1 ring-red-500' : 'bg-white hover:bg-gray-50'
                                        }`}
                                    >
                                        <MinusCircleIcon className="h-6 w-6 mb-1"/> Salida
                                    </button>
                                    <button 
                                        type="button" onClick={() => setMoveType('set')}
                                        className={`flex flex-col items-center justify-center p-2 rounded-md border text-xs font-bold transition-all ${
                                            moveType === 'set' ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500' : 'bg-white hover:bg-gray-50'
                                        }`}
                                    >
                                        <ClipboardDocumentCheckIcon className="h-6 w-6 mb-1"/> Auditoría
                                    </button>
                                </div>
                            </div>

                            {/* Cantidad y Motivo */}
                            <div>
                                <label className={`block text-sm font-bold mb-1 text-${actionConfig.color}-700`}>{actionConfig.label}</label>
                                <input 
                                    type="number" required min="1"
                                    value={quantity} onChange={(e) => setQuantity(e.target.value)}
                                    className={`block w-full p-3 border rounded-md focus:ring-${actionConfig.color}-500 focus:border-${actionConfig.color}-500 text-lg font-semibold text-center border-gray-300`}
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo / Razón *</label>
                                <textarea 
                                    required rows="2"
                                    value={reason} onChange={(e) => setReason(e.target.value)}
                                    className="block w-full p-2 border border-gray-300 rounded-md text-sm"
                                    placeholder="Ej: Compra proveedor #123"
                                ></textarea>
                            </div>

                            <button type="submit" disabled={isSubmitting} className={`w-full flex justify-center items-center gap-2 py-3 px-4 rounded-md text-white font-bold shadow-md transition-colors disabled:bg-gray-300 bg-${actionConfig.color}-600 hover:bg-${actionConfig.color}-700`}>
                                {isSubmitting ? 'Procesando...' : <><ArrowPathIcon className="h-5 w-5" /> {actionConfig.text}</>}
                            </button>
                        </form>
                    </HasPermission>

                    {!hasAnyPermission(['adjust.inventory']) && (
                        <div className="mt-4 p-4 bg-yellow-50 text-yellow-800 text-sm rounded text-center border border-yellow-200">
                            🔒 No tienes permisos para realizar movimientos.
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-gray-50 p-10 rounded-lg border-2 border-dashed border-gray-300 text-center h-full flex flex-col justify-center items-center">
                    <CubeIcon className="h-16 w-16 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">Control de Inventario</h3>
                    <p className="text-gray-500 mt-2 text-sm">Selecciona un producto para gestionar stock.</p>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};