import { useState, useEffect, useCallback } from 'react';
import { ArrowLeftIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../../context/AuthContext';
import { HasPermission } from '../HasPermission';
import { Notification } from '../Notification';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const OrderItems = ({ order, onClose }) => {
  const [items, setItems] = useState([]);
  const [orderStatus, setOrderStatus] = useState(order.status);
  
  // Estado para agregar item
  const [productSearch, setProductSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [showProductList, setShowProductList] = useState(false);
  const [newItemQty, setNewItemQty] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [notification, setNotification] = useState({ type: '', message: '' });
  const { hasPermission } = useAuth();

  // --- Cargar Items ---
  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/orders/${order.id}/items`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setItems(data.data);
    } catch (error) {
      console.error(error);
    }
  }, [order.id]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // --- Cambiar Estado ---
  const changeStatus = async (newStatus) => {
    if (!window.confirm(`¿Cambiar estado a ${newStatus}?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/orders/${order.id}/status`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setOrderStatus(newStatus);
        setNotification({ type: 'success', message: data.message });
      } else {
        setNotification({ type: 'error', message: data.message || data.error });
      }
    } catch (e) { setNotification({ type: 'error', message: 'Error de red' }); }
  };

  // --- Cancelar ---
  const cancelOrder = async () => {
    if (!window.confirm('¿Seguro que deseas CANCELAR este pedido?')) return;
    try {
      const res = await fetch(`${API_URL}/api/orders/${order.id}/cancel`, {
        method: 'PUT', credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setOrderStatus('cancelled');
        setNotification({ type: 'success', message: data.message });
      } else {
        setNotification({ type: 'error', message: data.message || data.error });
      }
    } catch (e) { setNotification({ type: 'error', message: 'Error de red' }); }
  };

  // --- Eliminar Item ---
  const deleteItem = async (itemId) => {
    if(!window.confirm("¿Eliminar este producto de la orden?")) return;
    try {
      const res = await fetch(`${API_URL}/api/orders/${order.id}/items/${itemId}`, {
        method: 'DELETE', credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: `${data.message} Nuevo Total: $${data.data.new_order_total}` });
        fetchItems();
      } else {
        setNotification({ type: 'error', message: data.message });
      }
    } catch(e) { setNotification({ type: 'error', message: 'Error de red' }); }
  };

  // --- Agregar Item ---
  useEffect(() => {
    if(productSearch.length > 1) {
      fetch(`${API_URL}/api/products/search?q=${productSearch}`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => { if(data.success) setProducts(data.data); });
    }
  }, [productSearch]);

  const handleAddItem = async () => {
    if(!selectedProduct) return;
    try {
      const res = await fetch(`${API_URL}/api/orders/${order.id}/items`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        credentials: 'include',
        // Corrección de tipos (Number/parseInt)
        body: JSON.stringify({ product_id: Number(selectedProduct.id), quantity: Number(newItemQty) })
      });
      const data = await res.json();
      if(data.success) {
        setNotification({ type: 'success', message: `${data.message} Nuevo Total: $${data.data.new_order_total}` });
        fetchItems();
        setSelectedProduct(null);
        setProductSearch('');
        setNewItemQty(1);
      } else {
        setNotification({ type: 'error', message: data.message });
      }
    } catch(e) { setNotification({ type: 'error', message: 'Error al agregar item' }); }
  };

  return (
    <div className="space-y-6">
      <Notification type={notification.type} message={notification.message} onClose={() => setNotification({type:'', message:''})} />
      
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"><ArrowLeftIcon className="h-6 w-6" /></button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Orden #{order.id}</h1>
            <p className="text-gray-500 text-sm">Cliente: {order.client_name} | Vendedor: {order.user_name}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* ETIQUETAS DE ESTADO ACTUALIZADAS */}
          <span className={`px-3 py-1 rounded-full text-sm font-bold uppercase ${
              orderStatus === 'completed' ? 'bg-green-100 text-green-800' :
              orderStatus === 'shipped' ? 'bg-blue-100 text-blue-800' :
              orderStatus === 'processing' ? 'bg-orange-100 text-orange-800' : // <-- Color para Processing
              orderStatus === 'cancelled' ? 'bg-red-100 text-red-800' : 
              'bg-yellow-100 text-yellow-800' // Pending
          }`}>{orderStatus}</span>
          
          {/* BOTONES DE ACCIÓN DE ESTADO (FLUJO COMPLETO) */}
          <HasPermission required="edit.order.status">
             
             {/* 1. Pending -> Processing */}
             {orderStatus === 'pending' && (
                 <button 
                   onClick={() => changeStatus('processing')} 
                   className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600 shadow"
                 >
                   Procesar Pedido
                 </button>
             )}

             {/* 2. Processing -> Shipped */}
             {orderStatus === 'processing' && (
                 <button 
                   onClick={() => changeStatus('shipped')} 
                   className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 shadow"
                 >
                   Marcar Enviado
                 </button>
             )}

             {/* 3. Shipped -> Completed */}
             {orderStatus === 'shipped' && (
                 <button 
                   onClick={() => changeStatus('completed')} 
                   className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 shadow"
                 >
                   Marcar Completado
                 </button>
             )}

          </HasPermission>
          
          <HasPermission required="cancel.order">
            {(orderStatus === 'pending' || orderStatus === 'processing') && (
                <button onClick={cancelOrder} className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200 ml-2">
                  Cancelar Pedido
                </button>
            )}
          </HasPermission>
        </div>
      </div>

      {/* Detalles de Envío */}
      <div className="bg-gray-50 p-4 rounded-md border">
          <p><strong>Dirección de Envío:</strong> {order.shipping_address}</p>
          <p><strong>Notas:</strong> {order.notes}</p>
      </div>

      {/* Tabla de Items */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cant.</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio U.</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.product_name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{item.sku}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{item.quantity}</td>
                <td className="px-6 py-4 text-sm text-gray-500">${item.unit_price}</td>
                <td className="px-6 py-4 text-sm font-bold text-gray-900">${item.subtotal}</td>
                <td className="px-6 py-4 text-right">
                  {/* Solo se puede eliminar si no está enviado/completado/cancelado */}
                  {(orderStatus === 'pending' || orderStatus === 'processing') && (
                    <HasPermission required="edit.order.content">
                        <button onClick={() => deleteItem(item.id)} className="text-red-500 hover:text-red-700">
                            <TrashIcon className="h-5 w-5" />
                        </button>
                    </HasPermission>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Formulario Agregar Item (Solo si editable) */}
      {(orderStatus === 'pending' || orderStatus === 'processing') && (
        <HasPermission required="edit.order.content">
            <div className="bg-blue-50 p-4 rounded border border-blue-200">
                <h4 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2"><PlusIcon className="h-4 w-4"/> Agregar Producto a esta Orden</h4>
                <div className="flex gap-2 items-center">
                    <div className="relative w-64">
                        <input 
                            type="text" placeholder="Buscar producto..." 
                            className="w-full p-2 border rounded text-sm"
                            value={productSearch}
                            onChange={e => { setProductSearch(e.target.value); setShowProductList(true); }}
                            onBlur={() => setTimeout(() => setShowProductList(false), 200)}
                        />
                         {showProductList && products.length > 0 && (
                            <ul className="absolute z-10 w-full bg-white border mt-1 max-h-40 overflow-y-auto shadow-lg">
                            {products.map(p => (
                                <li key={p.id} onClick={() => { setSelectedProduct(p); setProductSearch(p.name); }} className="p-2 hover:bg-gray-100 cursor-pointer text-sm">
                                {p.name} (${p.price})
                                </li>
                            ))}
                            </ul>
                        )}
                    </div>
                    <input 
                        type="number" min="1" 
                        value={newItemQty} 
                        onChange={e => setNewItemQty(parseInt(e.target.value) || 1)}
                        className="w-20 p-2 border rounded text-sm" placeholder="Cant."
                    />
                    <button 
                        onClick={handleAddItem}
                        disabled={!selectedProduct}
                        className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:bg-gray-300"
                    >
                        Agregar
                    </button>
                </div>
            </div>
        </HasPermission>
      )}
    </div>
  );
};