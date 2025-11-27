import { useState, useEffect } from 'react';
import { 
  ArrowLeftIcon, 
  CurrencyDollarIcon, 
  CubeIcon, 
  ExclamationTriangleIcon,
  MagnifyingGlassIcon 
} from '@heroicons/react/24/outline';
import { Notification } from '../Notification';

const API_URL = import.meta.env.VITE_API_URL;

export const ReturnsForm = ({ onClose, initialData }) => { 
  const [step, setStep] = useState(initialData ? 2 : 1); 
  const [orderId, setOrderId] = useState(initialData?.id || '');
  const [orderSummary, setOrderSummary] = useState(null);
  const [notification, setNotification] = useState({ type: '', message: '' });

  const handleVerifyOrder = async (e) => {
    e.preventDefault();
    if(!orderId) return;
    
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}/items`, { credentials: 'include' });
      const data = await res.json();
      
      if(data.success) {
        setOrderSummary(data.data); 
        setStep(2);
        setNotification({ type: '', message: '' });
      } else {
        setNotification({ type: 'error', message: 'Orden no encontrada o sin acceso.' });
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Error al verificar la orden.' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Notification type={notification.type} message={notification.message} onClose={() => setNotification({type:'', message:''})} />

      <div className="flex items-center gap-4 border-b pb-4">
        <button onClick={onClose} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
          <ArrowLeftIcon className="h-6 w-6" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Nueva Devolución</h1>
      </div>

      {step === 1 && (
        <div className="bg-white p-8 rounded-lg shadow border max-w-lg mx-auto text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Paso 1: Identificar Orden</h3>
            <p className="text-gray-500 mb-6">Ingresa el ID de la orden a la cual se le aplicará la devolución.</p>
            <form onSubmit={handleVerifyOrder} className="flex gap-2">
                <input 
                    type="number" 
                    placeholder="Ej. 1024"
                    className="flex-grow p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                    value={orderId}
                    onChange={e => setOrderId(e.target.value)}
                    required
                />
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2">
                    <MagnifyingGlassIcon className="h-5 w-5" /> Buscar
                </button>
            </form>
        </div>
      )}

      {step === 2 && (
        <ReturnLogic 
            orderId={orderId} 
            preloadedItems={orderSummary}
            onClose={onClose} 
            onSuccess={() => onClose()}
        />
      )}
    </div>
  );
};

// --- COMPONENTE INTERNO CON LA LÓGICA ---
const ReturnLogic = ({ orderId, preloadedItems, onClose, onSuccess }) => {
  const [returnType, setReturnType] = useState('items'); 
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState('completed'); 
  
  const [orderItems, setOrderItems] = useState(preloadedItems || []);
  const [selectedItems, setSelectedItems] = useState({}); 
  const [totalRefunded, setTotalRefunded] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!preloadedItems || preloadedItems.length === 0) {
        const fetchOrderItems = async () => {
        try {
            const res = await fetch(`${API_URL}/api/orders/${orderId}/items`, { credentials: 'include' });
            const data = await res.json();
            if (data.success) setOrderItems(data.data);
        } catch (err) { console.error(err); }
        };
        fetchOrderItems();
    }
  }, [orderId, preloadedItems]);

  const handleItemChange = (orderItemId, val, maxQty) => {
    const qty = parseInt(val) || 0;
    if (qty < 0) return;
    if (qty > maxQty) return; 

    setSelectedItems(prev => ({
      ...prev,
      [orderItemId]: qty
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // --- CORRECCIÓN AQUÍ: Convertimos orderId a Entero ---
      const payload = {
        order_id: parseInt(orderId), // <--- ¡IMPORTANTE!
        reason: reason,
        status: status
      };

      if (returnType === 'items') {
        const itemsPayload = Object.entries(selectedItems)
          .filter(([_, qty]) => qty > 0)
          .map(([id, qty]) => ({
            order_item_id: parseInt(id), // Aseguramos entero también aquí
            quantity: qty // Ya es entero por handleItemChange
          }));

        if (itemsPayload.length === 0) throw new Error("Selecciona al menos un producto.");
        payload.items = itemsPayload;

      } else {
        if (!totalRefunded || parseFloat(totalRefunded) <= 0) throw new Error("El monto debe ser mayor a 0.");
        payload.total_refunded = parseFloat(totalRefunded);
      }

      const res = await fetch(`${API_URL}/api/returns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success) {
        alert(data.message || 'Devolución creada con éxito'); 
        onSuccess(data);
      } else {
        setError(data.message || 'Error al crear devolución');
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="flex justify-between items-center mb-6">
         <h2 className="text-lg font-bold text-gray-800">Detalles de la Devolución (Orden #{orderId})</h2>
         <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Paso 2 de 2</span>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded flex items-center gap-2 text-sm">
          <ExclamationTriangleIcon className="h-5 w-5"/> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setReturnType('items')}
            className={`p-4 border rounded-lg flex flex-col items-center gap-2 transition-all ${
              returnType === 'items' ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-200' : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <CubeIcon className="h-6 w-6"/>
            <span className="font-medium text-sm">Devolver Productos</span>
          </button>

          <button
            type="button"
            onClick={() => setReturnType('manual')}
            className={`p-4 border rounded-lg flex flex-col items-center gap-2 transition-all ${
              returnType === 'manual' ? 'border-green-500 bg-green-50 text-green-700 ring-1 ring-green-200' : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <CurrencyDollarIcon className="h-6 w-6"/>
            <span className="font-medium text-sm">Ajuste Monetario</span>
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Motivo / Razón *</label>
          <textarea
            required
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            rows="2"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        {returnType === 'items' ? (
          <div className="border rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Comprado</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Devolver</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orderItems.map(item => (
                  <tr key={item.id}>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {item.product_name}
                      <div className="text-xs text-gray-500">${item.unit_price}</div>
                    </td>
                    <td className="px-4 py-2 text-center text-sm text-gray-500">{item.quantity}</td>
                    <td className="px-4 py-2 text-center">
                      <input
                        type="number" min="0" max={item.quantity}
                        className="w-16 border rounded text-center p-1"
                        value={selectedItems[item.id] || 0}
                        onChange={(e) => handleItemChange(item.id, e.target.value, item.quantity)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto a Reembolsar *</label>
            <div className="relative rounded-md shadow-sm max-w-xs">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number" step="0.01" required
                className="block w-full rounded-md border-gray-300 pl-7 p-2 border focus:ring-green-500 focus:border-green-500"
                placeholder="0.00"
                value={totalRefunded}
                onChange={(e) => setTotalRefunded(e.target.value)}
              />
            </div>
          </div>
        )}

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado Inicial</label>
            <select 
                value={status} onChange={(e) => setStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 bg-white"
            >
                <option value="completed">Completado (Aplicar inmediato)</option>
                <option value="pending">Pendiente (Requiere revisión)</option>
            </select>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button 
            type="button"
            onClick={onClose} // Importante: Añadido para cancelar
            className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 shadow-sm">
            {loading ? 'Procesando...' : 'Generar Devolución'}
          </button>
        </div>

      </form>
    </div>
  );
};