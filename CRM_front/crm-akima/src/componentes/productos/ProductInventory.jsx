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

import { InventoryLogsModal } from './InventoryLogsModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const PRODUCTS_ENDPOINT = `${API_URL}/api/products`;

export const ProductInventory = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState('all'); 
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [moveType, setMoveType] = useState('add'); 
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });
  
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [logsProductId, setLogsProductId] = useState(null); 
  const [logsProductName, setLogsProductName] = useState('');

  const { hasAnyPermission } = useAuth();

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(PRODUCTS_ENDPOINT, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
        setFilteredProducts(data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasAnyPermission([PERMISSIONS.PRODUCTS])) {
        fetchProducts();
    } else {
        setIsLoading(false);
    }
  }, [fetchProducts, hasAnyPermission]);

  useEffect(() => {
    let result = products;
    if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        result = result.filter(p => 
            p.name.toLowerCase().includes(lowerSearch) || 
            p.sku.toLowerCase().includes(lowerSearch)
        );
    }
    if (stockFilter === 'positive') result = result.filter(p => p.stock_quantity > 0);
    else if (stockFilter === 'negative') result = result.filter(p => p.stock_quantity <= 0);
    
    setFilteredProducts(result);
  }, [searchTerm, stockFilter, products]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct || !quantity || !reason) {
        setNotification({ type: 'error', message: 'Llena todos los campos.' });
        return;
    }

    setIsSubmitting(true);
    try {
        const payload = {
            move_type: moveType,
            quantity: Number(quantity),
            reason: reason
        };

        const res = await fetch(`${PRODUCTS_ENDPOINT}/${selectedProduct.id}/inventory`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        
        if (data.success) {
            setNotification({ type: 'success', message: 'Inventario actualizado.' });
            setQuantity('');
            setReason('');
            fetchProducts();
            const updatedProduct = { ...selectedProduct, stock_quantity: data.new_stock };
            setSelectedProduct(updatedProduct);
        } else {
            setNotification({ type: 'error', message: data.message });
        }
    } catch (error) {
        setNotification({ type: 'error', message: 'Error de red.' });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleOpenLogs = (product = null) => {
    if (product) {
        setLogsProductId(product.id);
        setLogsProductName(product.name);
    } else {
        setLogsProductId(null);
        setLogsProductName('');
    }
    setShowLogsModal(true);
  };

  // Configurador de colores estáticos para no perder estilos al compilar
  const actionConfig = {
      'add': { text: 'Ingresar Stock', btnClass: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/30', ring: 'focus:ring-emerald-500/20 focus:border-emerald-500', icon: PlusCircleIcon },
      'subtract': { text: 'Retirar Stock', btnClass: 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/30', ring: 'focus:ring-rose-500/20 focus:border-rose-500', icon: MinusCircleIcon },
      'set': { text: 'Ajuste Exacto', btnClass: 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/30', ring: 'focus:ring-blue-500/20 focus:border-blue-500', icon: ClipboardDocumentCheckIcon }
  }[moveType];

  return (
    <div className="space-y-6 pb-10">
      <Notification type={notification.type} message={notification.message} onClose={() => setNotification({ type: '', message: '' })} />

      {showLogsModal && (
          <InventoryLogsModal 
            productId={logsProductId} 
            productName={logsProductName} 
            onClose={() => setShowLogsModal(false)} 
          />
      )}

      {/* CABECERA (Azul protagonista) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4">
        <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl border border-blue-200 shadow-sm">
                    <CubeIcon className="h-7 w-7 text-blue-600" />
                </div>
                Inventario Rápido
            </h1>
            <p className="text-sm text-slate-500 mt-2 font-medium">Gestiona entradas, salidas y ajustes de stock en tiempo real.</p>
        </div>
        <button onClick={() => handleOpenLogs(null)} className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-5 py-2.5 rounded-xl font-bold shadow-sm hover:bg-slate-50 hover:border-slate-400 transition-all">
            <ClockIcon className="h-5 w-5 text-slate-400" /> Historial Completo
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-auto lg:h-[75vh]">
        
        {/* COLUMNA IZQUIERDA: Buscador y Lista de Productos */}
        <div className="lg:col-span-5 bg-white/90 backdrop-blur-xl shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-200 flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-slate-50/50">
                <div className="relative mb-3">
                    <MagnifyingGlassIcon className="absolute left-3.5 top-3 h-5 w-5 text-slate-400" />
                    <input 
                        type="search" placeholder="Buscar por nombre o SKU..." 
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 p-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all outline-none shadow-sm"
                    />
                </div>
                <div className="relative">
                    <FunnelIcon className="absolute left-3.5 top-3 h-5 w-5 text-slate-400" />
                    <select 
                        value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}
                        className="w-full pl-10 p-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all outline-none shadow-sm appearance-none cursor-pointer"
                    >
                        <option value="all">Todos los productos</option>
                        <option value="positive">Con Stock (> 0)</option>
                        <option value="negative">Sin Stock (0 o menos)</option>
                    </select>
                </div>
            </div>

            <div className="flex-grow overflow-y-auto bg-white p-2">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                        <ArrowPathIcon className="h-8 w-8 animate-spin mb-3 text-blue-500" />
                        <p className="font-bold">Cargando...</p>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center p-8 text-slate-400 font-bold">No se encontraron productos.</div>
                ) : (
                    <div className="space-y-1.5">
                        {filteredProducts.map(prod => (
                            <div 
                                key={prod.id} 
                                onClick={() => { setSelectedProduct(prod); setQuantity(''); setReason(''); setNotification({type:'', message:''}); }}
                                className={`p-4 rounded-2xl cursor-pointer border-l-4 transition-all duration-200 flex justify-between items-center group ${
                                    selectedProduct?.id === prod.id 
                                    ? 'bg-blue-50/80 border-blue-500 shadow-sm' 
                                    : 'border-transparent hover:bg-slate-50'
                                }`}
                            >
                                <div>
                                    <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-blue-700 transition-colors">{prod.name}</h4>
                                    <p className="text-xs font-bold text-slate-400 font-mono tracking-wide mt-0.5">{prod.sku}</p>
                                </div>
                                <div className="text-right flex flex-col items-end gap-1">
                                    <span className={`px-2.5 py-1 text-xs font-black rounded-lg border ${
                                        prod.stock_quantity > 10 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                        prod.stock_quantity > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                                        'bg-rose-50 text-rose-700 border-rose-200'
                                    }`}>
                                        {prod.stock_quantity} un.
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

        {/* COLUMNA DERECHA: Formulario de Acción */}
        <div className="lg:col-span-7 h-full">
            {selectedProduct ? (
                <div className="bg-white/90 backdrop-blur-xl shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-200 p-8 h-full flex flex-col animate-fadeIn">
                    
                    {/* Header del Producto Seleccionado */}
                    <div className="flex justify-between items-start border-b border-slate-100 pb-5 mb-6">
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Producto Seleccionado</p>
                            <h2 className="text-2xl font-extrabold text-slate-900">{selectedProduct.name}</h2>
                            <p className="text-sm font-bold text-slate-500 font-mono mt-1">SKU: {selectedProduct.sku}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Stock Actual</p>
                            <p className={`text-4xl font-black ${selectedProduct.stock_quantity <= 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                                {selectedProduct.stock_quantity}
                            </p>
                        </div>
                    </div>

                    <HasPermission required="adjust.inventory">
                        <form onSubmit={handleSubmit} className="flex-grow flex flex-col">
                            
                            {/* Segmented Control de Tipo de Movimiento */}
                            <div className="mb-8">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Tipo de Movimiento</label>
                                <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                                    <button type="button" onClick={() => setMoveType('add')} className={`flex-1 flex justify-center items-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${moveType === 'add' ? 'bg-white text-emerald-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}>
                                        <PlusCircleIcon className="h-5 w-5"/> Ingreso
                                    </button>
                                    <button type="button" onClick={() => setMoveType('subtract')} className={`flex-1 flex justify-center items-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${moveType === 'subtract' ? 'bg-white text-rose-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}>
                                        <MinusCircleIcon className="h-5 w-5"/> Salida
                                    </button>
                                    <button type="button" onClick={() => setMoveType('set')} className={`flex-1 flex justify-center items-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${moveType === 'set' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}>
                                        <ClipboardDocumentCheckIcon className="h-5 w-5"/> Ajuste
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Cantidad <span className="text-rose-500">*</span></label>
                                    <input 
                                        type="number" min="0" required
                                        className={`w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-2xl font-black text-center focus:bg-white outline-none transition-all ${actionConfig.ring}`}
                                        value={quantity} onChange={(e) => setQuantity(e.target.value)}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            
                            <div className="mb-auto">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Motivo del Movimiento <span className="text-rose-500">*</span></label>
                                <textarea 
                                    required rows="3"
                                    className={`w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white outline-none transition-all ${actionConfig.ring}`}
                                    value={reason} onChange={(e) => setReason(e.target.value)}
                                    placeholder="Ej: Compra a proveedor, Merma, Ajuste por inventario físico..."
                                ></textarea>
                            </div>

                            <button type="submit" disabled={isSubmitting} className={`mt-6 w-full flex justify-center items-center gap-2 py-4 rounded-xl text-white text-lg font-extrabold shadow-lg transition-all disabled:bg-slate-300 disabled:shadow-none ${actionConfig.btnClass}`}>
                                {isSubmitting ? 'Procesando...' : <><actionConfig.icon className="h-6 w-6" /> {actionConfig.text}</>}
                            </button>
                        </form>
                    </HasPermission>

                    {!hasAnyPermission(['adjust.inventory']) && (
                        <div className="mt-4 p-4 bg-amber-50 text-amber-800 font-bold text-sm rounded-xl text-center border border-amber-200">
                            🔒 No tienes permisos para realizar movimientos de inventario.
                        </div>
                    )}
                    
                    <div className="mt-4 pt-4 border-t border-slate-100 text-center">
                         <button onClick={() => handleOpenLogs(selectedProduct)} className="text-sm font-bold text-blue-600 hover:text-blue-700 flex justify-center items-center gap-1.5 w-full">
                            <ClockIcon className="h-4 w-4" /> Ver movimientos de este producto
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-white/60 backdrop-blur-sm p-10 rounded-3xl border-2 border-dashed border-slate-300 text-center h-full flex flex-col justify-center items-center">
                    <div className="bg-slate-100 p-4 rounded-full mb-4">
                        <CubeIcon className="h-16 w-16 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-800">Control de Inventario</h3>
                    <p className="text-slate-500 mt-2 font-medium">Selecciona un producto de la lista izquierda para gestionar su stock.</p>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};