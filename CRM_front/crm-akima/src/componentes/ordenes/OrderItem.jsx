// src/componentes/ordenes/OrderItems.jsx

import { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeftIcon, 
  TrashIcon, 
  PlusIcon, 
  CurrencyDollarIcon, 
  ArrowUturnLeftIcon,
  BanknotesIcon,
  CreditCardIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/solid';
import { useAuth } from '../../context/AuthContext';
import { HasPermission } from '../HasPermission';
import { Notification } from '../Notification';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const OrderItems = ({ order, onClose }) => {
  // --- ESTADOS GLOBALES ---
  const [activeTab, setActiveTab] = useState('items'); 
  const [notification, setNotification] = useState({ type: '', message: '' });
  const { hasPermission } = useAuth();

  // --- ESTADOS DE DATOS ---
  const [items, setItems] = useState([]);
  const [orderStatus, setOrderStatus] = useState(order.status);
  const [payments, setPayments] = useState([]);
  const [returns, setReturns] = useState([]);

  // --- ESTADOS DE FORMULARIOS ---
  const [productSearch, setProductSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [showProductList, setShowProductList] = useState(false);
  const [newItemQty, setNewItemQty] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'cash', notes: '' });
  const [isPaying, setIsPaying] = useState(false);

  // ==========================================
  // 1. CÁLCULOS FINANCIEROS (Centralizados)
  // ==========================================
  const totalOrder = items.reduce((acc, item) => acc + parseFloat(item.subtotal), 0);
  
  const totalRefunds = returns
      .filter(r => r.status === 'completed' && r.total_refunded)
      .reduce((acc, r) => acc + parseFloat(r.total_refunded), 0);
  
  const totalPaid = payments.reduce((acc, p) => acc + parseFloat(p.amount), 0);
  
  // Lo que realmente debe pagar el cliente (Orden - Devoluciones)
  const netTotal = totalOrder - totalRefunds;
  // Lo que falta por pagar
  const balanceDue = netTotal - totalPaid;

  // ==========================================
  // 2. CARGA DE DATOS
  // ==========================================
  
  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/orders/${order.id}/items`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setItems(data.data);
    } catch (error) { console.error(error); }
  }, [order.id]);

  const fetchPayments = useCallback(async () => {
    if (!hasPermission('view.payments')) return;
    try {
      const res = await fetch(`${API_URL}/api/payments/order/${order.id}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setPayments(data.data);
    } catch (error) { console.error(error); }
  }, [order.id, hasPermission]);

  const fetchReturns = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/returns`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        const orderReturns = data.data.filter(r => r.order_id === order.id);
        setReturns(orderReturns);
      }
    } catch (error) { console.error(error); }
  }, [order.id]);

  useEffect(() => {
    fetchItems();
    fetchPayments();
    fetchReturns();
  }, [fetchItems, fetchPayments, fetchReturns]);

  // ==========================================
  // 3. ACCIONES (Estado, Items, Pagos)
  // ==========================================

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
        setNotification({ type: 'error', message: data.message });
      }
    } catch (e) { setNotification({ type: 'error', message: 'Error de red' }); }
  };

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
        setNotification({ type: 'error', message: data.message });
      }
    } catch (e) { setNotification({ type: 'error', message: 'Error de red' }); }
  };

  // --- Agregar Items ---
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
        body: JSON.stringify({ 
            product_id: Number(selectedProduct.id), 
            quantity: Number(newItemQty) 
        })
      });
      const data = await res.json();
      if(data.success) {
        setNotification({ type: 'success', message: `Item agregado.` });
        fetchItems();
        setSelectedProduct(null);
        setProductSearch('');
        setNewItemQty(1);
      } else {
        setNotification({ type: 'error', message: data.message });
      }
    } catch(e) { setNotification({ type: 'error', message: 'Error al agregar item' }); }
  };

  const deleteItem = async (itemId) => {
    if(!window.confirm("¿Eliminar producto?")) return;
    try {
      const res = await fetch(`${API_URL}/api/orders/${order.id}/items/${itemId}`, {
        method: 'DELETE', credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: 'Producto eliminado.' });
        fetchItems();
      } else {
        setNotification({ type: 'error', message: data.message });
      }
    } catch(e) { setNotification({ type: 'error', message: 'Error de red' }); }
  };

  // --- Registrar Pago ---
  const handleCreatePayment = async (e) => {
    e.preventDefault();
    setIsPaying(true);
    try {
      const payload = {
        order_id: order.id,
        amount: parseFloat(paymentForm.amount),
        method: paymentForm.method,
        notes: paymentForm.notes
      };

      const res = await fetch(`${API_URL}/api/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        setNotification({ type: 'success', message: 'Pago registrado exitosamente.' });
        setPaymentForm({ amount: '', method: 'cash', notes: '' });
        fetchPayments(); 
      } else {
        setNotification({ type: 'error', message: data.message });
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Error al registrar pago.' });
    } finally {
      setIsPaying(false);
    }
  };


  // ==========================================
  // RENDERIZADO
  // ==========================================

  return (
    <div className="space-y-6">
      <Notification type={notification.type} message={notification.message} onClose={() => setNotification({type:'', message:''})} />
      
      {/* --- HEADER --- */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"><ArrowLeftIcon className="h-6 w-6" /></button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Orden #{order.id}</h1>
            <p className="text-gray-500 text-sm">Cliente: {order.client_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-bold uppercase ${
                orderStatus === 'completed' ? 'bg-green-100 text-green-800' :
                orderStatus === 'shipped' ? 'bg-blue-100 text-blue-800' :
                orderStatus === 'processing' ? 'bg-orange-100 text-orange-800' :
                orderStatus === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
                {orderStatus}
            </span>
            <HasPermission required="edit.order.status">
                {orderStatus === 'pending' && (
                    <button onClick={() => changeStatus('processing')} className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600">Procesar</button>
                )}
                {orderStatus === 'processing' && (
                    <button onClick={() => changeStatus('shipped')} className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">Enviar</button>
                )}
                {orderStatus === 'shipped' && (
                    <button onClick={() => changeStatus('completed')} className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">Completar</button>
                )}
            </HasPermission>
            <HasPermission required="cancel.order">
                {(orderStatus === 'pending' || orderStatus === 'processing') && (
                    <button onClick={cancelOrder} className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200 ml-2">Cancelar</button>
                )}
            </HasPermission>
        </div>
      </div>

      {/* --- TABS --- */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button onClick={() => setActiveTab('items')} className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'items' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <DocumentTextIcon className="h-5 w-5" /> Productos
          </button>
          <HasPermission required="view.payments">
            <button onClick={() => setActiveTab('payments')} className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'payments' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                <BanknotesIcon className="h-5 w-5" /> Pagos y Abonos
            </button>
          </HasPermission>
          <button onClick={() => setActiveTab('returns')} className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'returns' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <ArrowUturnLeftIcon className="h-5 w-5" /> Devoluciones
          </button>
        </nav>
      </div>

      {/* ================= PESTAÑA: PRODUCTOS ================= */}
      {activeTab === 'items' && (
        <div className="space-y-6">
            <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Cant.</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                            <th className="px-6 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {items.map((item) => (
                        <tr key={item.id}>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.product_name}</td>
                            <td className="px-6 py-4 text-sm text-center">{item.quantity}</td>
                            <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">${item.subtotal}</td>
                            <td className="px-6 py-4 text-right">
                                {(orderStatus === 'pending' || orderStatus === 'processing') && (
                                    <HasPermission required="edit.order.content">
                                        <button onClick={() => deleteItem(item.id)} className="text-red-500 hover:text-red-700"><TrashIcon className="h-5 w-5" /></button>
                                    </HasPermission>
                                )}
                            </td>
                        </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* RESUMEN FINANCIERO (USANDO VARIABLES CALCULADAS) */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col items-end gap-2">
                <div className="w-full md:w-1/2 lg:w-1/3 space-y-2 text-sm">
                    <div className="flex justify-between text-gray-600">
                        <span>Subtotal Productos:</span>
                        <span className="font-medium">${totalOrder.toFixed(2)}</span>
                    </div>
                    {totalRefunds > 0 && (
                        <div className="flex justify-between text-red-600">
                            <span>(-) Devoluciones Aprobadas:</span>
                            <span className="font-medium">-${totalRefunds.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-gray-800 font-bold border-t border-gray-300 pt-2">
                        <span>Total Neto:</span>
                        <span>${netTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                        <span>(-) Pagado:</span>
                        <span className="font-medium">-${totalPaid.toFixed(2)}</span>
                    </div>
                    <div className={`flex justify-between text-lg font-bold border-t-2 pt-2 ${balanceDue > 0.01 ? 'text-red-600' : 'text-green-700'}`}>
                        <span>{balanceDue > 0.01 ? 'Saldo Pendiente:' : 'Saldo Liquidado:'}</span>
                        <span>${Math.max(0, balanceDue).toFixed(2)}</span>
                    </div>
                </div>
            </div>
            
            {/* Formulario Agregar (Condicional) */}
            {(orderStatus === 'pending' || orderStatus === 'processing') && (
                <HasPermission required="edit.order.content">
                    <div className="bg-blue-50 p-4 rounded border border-blue-200 flex gap-2 items-center mt-4">
                        <div className="relative flex-grow">
                            <input 
                                type="text" placeholder="Buscar producto..." className="w-full p-2 border rounded text-sm"
                                value={productSearch}
                                onChange={e => { setProductSearch(e.target.value); setShowProductList(true); }}
                                onBlur={() => setTimeout(() => setShowProductList(false), 200)}
                            />
                            {showProductList && products.length > 0 && (
                                <ul className="absolute z-10 w-full bg-white border mt-1 max-h-40 overflow-y-auto shadow-lg bottom-full mb-1">
                                    {products.map(p => (
                                        <li key={p.id} onClick={() => { setSelectedProduct(p); setProductSearch(p.name); }} className="p-2 hover:bg-gray-100 cursor-pointer text-sm">
                                            {p.name} (${p.price})
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <input type="number" min="1" value={newItemQty} onChange={e => setNewItemQty(parseInt(e.target.value)||1)} className="w-20 p-2 border rounded text-sm" />
                        <button onClick={handleAddItem} disabled={!selectedProduct} className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">Agregar</button>
                    </div>
                </HasPermission>
            )}
        </div>
      )}

      {/* ================= PESTAÑA: PAGOS (CON SALDO) ================= */}
      {activeTab === 'payments' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* FORMULARIO DE ABONO */}
            <div className="md:col-span-1">
                <HasPermission required="add.payment">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200 shadow-sm sticky top-4">
                        {/* RESUMEN DE DEUDA EN EL FORMULARIO */}
                        <div className="mb-4 pb-4 border-b border-green-200 text-center">
                            <p className="text-xs text-green-800 uppercase font-bold">Saldo Pendiente</p>
                            <p className={`text-2xl font-bold ${balanceDue > 0.01 ? 'text-red-600' : 'text-green-600'}`}>
                                ${Math.max(0, balanceDue).toFixed(2)}
                            </p>
                        </div>

                        <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center gap-2">
                            <CurrencyDollarIcon className="h-6 w-6"/> Registrar Abono
                        </h3>
                        <form onSubmit={handleCreatePayment} className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-green-700 mb-1">Monto a Abonar ($)</label>
                                <input 
                                    type="number" step="0.01" required min="0.01" max={balanceDue + 0.01} // Validar que no pague de más (opcional)
                                    className="w-full p-2 border border-green-300 rounded focus:ring-2 focus:ring-green-500"
                                    value={paymentForm.amount}
                                    onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-green-700 mb-1">Método</label>
                                <select 
                                    className="w-full p-2 border border-green-300 rounded bg-white"
                                    value={paymentForm.method}
                                    onChange={e => setPaymentForm({...paymentForm, method: e.target.value})}
                                >
                                    <option value="cash">Efectivo</option>
                                    <option value="card">Tarjeta</option>
                                    <option value="transfer">Transferencia</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-green-700 mb-1">Notas</label>
                                <input 
                                    type="text" placeholder="Ref. o comentario"
                                    className="w-full p-2 border border-green-300 rounded"
                                    value={paymentForm.notes}
                                    onChange={e => setPaymentForm({...paymentForm, notes: e.target.value})}
                                />
                            </div>
                            <button 
                                type="submit" disabled={isPaying || balanceDue <= 0}
                                className="w-full bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                {balanceDue <= 0 ? 'Pagado' : (isPaying ? 'Procesando...' : 'Abonar')}
                            </button>
                        </form>
                    </div>
                </HasPermission>
            </div>

            {/* TABLA HISTORIAL */}
            <div className="md:col-span-2 bg-white rounded-lg shadow border border-gray-200">
                <div className="p-4 border-b bg-gray-50">
                    <h3 className="font-bold text-gray-700">Historial de Pagos</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Fecha</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Método</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Recibido Por</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Monto</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {payments.length === 0 ? (
                                <tr><td colSpan="4" className="p-4 text-center text-gray-500 italic">No hay pagos registrados.</td></tr>
                            ) : (
                                payments.map(pay => (
                                    <tr key={pay.id}>
                                        <td className="px-4 py-2 text-sm text-gray-600">
                                            {new Date(pay.payment_date).toLocaleDateString()} <small>{new Date(pay.payment_date).toLocaleTimeString()}</small>
                                        </td>
                                        <td className="px-4 py-2 text-sm capitalize flex items-center gap-1">
                                            {pay.method === 'card' ? <CreditCardIcon className="h-4 w-4 text-blue-500"/> : <BanknotesIcon className="h-4 w-4 text-green-600"/>}
                                            {pay.method}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-600">{pay.received_by || 'Sistema'}</td>
                                        <td className="px-4 py-2 text-sm text-right font-bold text-green-700">${pay.amount}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {/* ================= PESTAÑA: DEVOLUCIONES ================= */}
      {activeTab === 'returns' && (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID RMA</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motivo</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {returns.length === 0 ? (
                        <tr><td colSpan="5" className="p-8 text-center text-gray-500 italic">No hay devoluciones asociadas a esta orden.</td></tr>
                    ) : (
                        returns.map(rma => (
                            <tr key={rma.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-bold text-gray-900">#{rma.id}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{new Date(rma.created_at).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-sm text-gray-600 truncate max-w-xs">{rma.reason}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                        rma.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                        rma.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {rma.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right font-bold text-gray-800">
                                    {rma.total_refunded ? `$${rma.total_refunded}` : 'Items'}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      )}

    </div>
  );
};