// src/componentes/ordenes/OrderItems.jsx

import { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeftIcon, TrashIcon, CurrencyDollarIcon, 
  ArrowUturnLeftIcon, BanknotesIcon, DocumentTextIcon,
  ShoppingCartIcon, ArchiveBoxXMarkIcon,
  CreditCardIcon, EyeIcon, PrinterIcon, ClipboardDocumentListIcon,
  CalendarDaysIcon // <-- Agregado para el ícono de fecha
} from '@heroicons/react/24/solid';
import { useAuth } from '../../context/AuthContext';
import { HasPermission } from '../HasPermission';
import { Notification } from '../Notification';
import { ReturnDetails } from './ReturnDetails';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const OrderItems = ({ order, onClose }) => {
  const [activeTab, setActiveTab] = useState('items'); 
  const [notification, setNotification] = useState({ type: '', message: '' });
  const { hasPermission } = useAuth();
  const [selectedReturnId, setSelectedReturnId] = useState(null);

  const [items, setItems] = useState([]);
  const [orderStatus, setOrderStatus] = useState(order.status);
  const [payments, setPayments] = useState([]);
  const [returns, setReturns] = useState([]);
  const [returnDetails, setReturnDetails] = useState([]); 

  const [productSearch, setProductSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [showProductList, setShowProductList] = useState(false);
  const [newItemQty, setNewItemQty] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'cash', notes: '' });
  const [isPaying, setIsPaying] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false); 

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
        const detailsPromises = orderReturns.map(r => 
            fetch(`${API_URL}/api/returns/${r.id}`, { credentials: 'include' }).then(res => res.json())
        );
        const detailsResponses = await Promise.all(detailsPromises);
        const details = detailsResponses.filter(r => r.success).map(r => r.data);
        setReturnDetails(details);
      }
    } catch (error) { console.error(error); }
  }, [order.id]);

  useEffect(() => {
    fetchItems(); fetchPayments(); fetchReturns();
  }, [fetchItems, fetchPayments, fetchReturns]);

  const totalOrder = items.reduce((acc, item) => acc + parseFloat(item.subtotal), 0);
  const totalMoneyRefunds = returnDetails.filter(r => r.status === 'completed' && !r.items?.length && r.total_refunded).reduce((acc, r) => acc + parseFloat(r.total_refunded), 0);
  const returnedItemsList = returnDetails.filter(r => r.status === 'completed' && r.items?.length > 0).flatMap(r => r.items);
  const totalItemRefunds = returnedItemsList.reduce((acc, item) => acc + parseFloat(item.subtotal_refunded), 0);
  const totalPaid = payments.reduce((acc, p) => acc + parseFloat(p.amount), 0);
  
  const netTotal = totalOrder - totalItemRefunds - totalMoneyRefunds;
  const balanceDue = netTotal - totalPaid;

  const changeStatus = async (newStatus) => {
    if (!window.confirm(`¿Cambiar estado a ${newStatus}?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/orders/${order.id}/status`, {
        method: 'PUT', headers: {'Content-Type': 'application/json'}, credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) { setOrderStatus(newStatus); setNotification({ type: 'success', message: data.message }); }
      else setNotification({ type: 'error', message: data.message });
    } catch (e) { setNotification({ type: 'error', message: 'Error de red' }); }
  };

  const cancelOrder = async () => {
    if (!window.confirm('¿Seguro que deseas CANCELAR este pedido?')) return;
    try {
      const res = await fetch(`${API_URL}/api/orders/${order.id}/cancel`, { method: 'PUT', credentials: 'include' });
      const data = await res.json();
      if (data.success) { setOrderStatus('cancelled'); setNotification({ type: 'success', message: data.message }); }
      else setNotification({ type: 'error', message: data.message });
    } catch (e) { setNotification({ type: 'error', message: 'Error de red' }); }
  };

  const handlePrint = async (reportType) => {
    setIsPrinting(true);
    try {
        const response = await fetch(`${API_URL}/api/pdf/orders/${order.id}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
            body: JSON.stringify({ reportType }) 
        });
        if (!response.ok) throw new Error('Error al generar el documento PDF');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
    } catch (error) {
        setNotification({ type: 'error', message: 'No se pudo generar el PDF.' });
    } finally {
        setIsPrinting(false);
    }
  };

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
        method: 'POST', headers: {'Content-Type': 'application/json'}, credentials: 'include',
        body: JSON.stringify({ product_id: Number(selectedProduct.id), quantity: Number(newItemQty) })
      });
      const data = await res.json();
      if(data.success) {
        setNotification({ type: 'success', message: `Item agregado.` });
        fetchItems(); setSelectedProduct(null); setProductSearch(''); setNewItemQty(1);
      } else setNotification({ type: 'error', message: data.message });
    } catch(e) { setNotification({ type: 'error', message: 'Error al agregar item' }); }
  };

  const deleteItem = async (itemId) => {
    if(!window.confirm("¿Eliminar producto?")) return;
    try {
      const res = await fetch(`${API_URL}/api/orders/${order.id}/items/${itemId}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      if (data.success) { setNotification({ type: 'success', message: 'Producto eliminado.' }); fetchItems(); } 
      else setNotification({ type: 'error', message: data.message });
    } catch(e) { setNotification({ type: 'error', message: 'Error de red' }); }
  };

  const handleCreatePayment = async (e) => {
    e.preventDefault(); setIsPaying(true);
    try {
      const res = await fetch(`${API_URL}/api/payments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ order_id: order.id, amount: parseFloat(paymentForm.amount), method: paymentForm.method, notes: paymentForm.notes })
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: 'Pago registrado exitosamente.' });
        setPaymentForm({ amount: '', method: 'cash', notes: '' }); fetchPayments(); 
      } else setNotification({ type: 'error', message: data.message });
    } catch (error) {
        setNotification({ type: 'error', message: 'Error al registrar pago.' });
    } finally { setIsPaying(false); }
  };

  // Helper de formato de fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    const d = new Date(dateString);
    return `${d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })} - ${d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'shipped': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'processing': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'cancelled': return 'bg-rose-100 text-rose-800 border-rose-300';
      default: return 'bg-slate-100 text-slate-800 border-slate-300'; 
    }
  };

  if (selectedReturnId) {
    return <ReturnDetails returnId={selectedReturnId} onClose={() => { setSelectedReturnId(null); fetchReturns(); }} />;
  }

  const getTabClass = (tabName) => {
    const isActive = activeTab === tabName;
    return `whitespace-nowrap px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all duration-200 ${
      isActive
        ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
        : 'text-slate-600 bg-transparent hover:text-slate-900 hover:bg-slate-100 border border-transparent'
    }`;
  };

  return (
    <div className="space-y-6 pb-10">
      <Notification type={notification.type} message={notification.message} onClose={() => setNotification({type:'', message:''})} />
      
      {/* HEADER PRINCIPAL (Actualizado con la fecha) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-200 pb-5 gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2.5 text-slate-500 bg-white border border-slate-300 hover:bg-slate-50 hover:text-slate-800 rounded-xl transition-all shadow-sm"><ArrowLeftIcon className="h-5 w-5" /></button>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                Orden <span className="bg-slate-100 border border-slate-200 px-3 py-1 rounded-xl text-2xl shadow-inner">#{order.id}</span>
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2">
                <p className="text-slate-500 font-bold text-sm">Cliente: <span className="text-slate-800">{order.client_name}</span></p>
                <span className="text-slate-300">•</span>
                <p className="text-slate-500 font-bold text-sm flex items-center gap-1.5">
                    <CalendarDaysIcon className="h-4 w-4 text-slate-400" /> 
                    <span className="text-slate-800">{formatDate(order.created_at)}</span>
                </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-2 mr-2 border-r pr-4 border-slate-200">
                <button onClick={() => handlePrint('simple')} disabled={isPrinting} className="flex items-center gap-1.5 bg-white text-slate-700 px-4 py-2 rounded-xl shadow-sm hover:bg-slate-50 font-bold text-sm border border-slate-300 transition-colors">
                    <PrinterIcon className="h-4 w-4 text-slate-400"/> Nota
                </button>
                <button onClick={() => handlePrint('full')} disabled={isPrinting} className="flex items-center gap-1.5 bg-white text-slate-700 px-4 py-2 rounded-xl shadow-sm hover:bg-slate-50 font-bold text-sm border border-slate-300 transition-colors">
                    <ClipboardDocumentListIcon className="h-4 w-4 text-slate-400"/> Detalle
                </button>
            </div>

            <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border ${getStatusColor(orderStatus)}`}>
                {orderStatus}
            </span>
            
            <HasPermission required="edit.order.status">
                {orderStatus === 'pending' && <button onClick={() => changeStatus('processing')} className="bg-amber-500 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-amber-600 shadow-sm shadow-amber-500/30">Procesar</button>}
                {orderStatus === 'processing' && <button onClick={() => changeStatus('shipped')} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 shadow-sm shadow-blue-500/30">Enviar</button>}
                {orderStatus === 'shipped' && <button onClick={() => changeStatus('completed')} className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-emerald-700 shadow-sm shadow-emerald-500/30">Completar</button>}
            </HasPermission>
            <HasPermission required="cancel.order">
                {(orderStatus === 'pending' || orderStatus === 'processing') && <button onClick={cancelOrder} className="bg-white border border-rose-300 text-rose-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-rose-50 shadow-sm">Cancelar</button>}
            </HasPermission>
        </div>
      </div>

      {/* SEGMENTED CONTROL TABS */}
      <nav className="inline-flex p-1.5 space-x-2 bg-white border border-slate-300 rounded-xl overflow-x-auto shadow-sm" aria-label="Tabs">
        <button onClick={() => setActiveTab('items')} className={getTabClass('items')}>
            <DocumentTextIcon className="h-5 w-5" /> Estado de Cuenta
        </button>
        <HasPermission required="view.payments">
            <button onClick={() => setActiveTab('payments')} className={getTabClass('payments')}>
                <BanknotesIcon className="h-5 w-5" /> Pagos y Abonos
            </button>
        </HasPermission>
        <button onClick={() => setActiveTab('returns')} className={getTabClass('returns')}>
            <ArrowUturnLeftIcon className="h-5 w-5" /> Devoluciones
        </button>
      </nav>

      {/* ================= PESTAÑA 1: PRODUCTOS / ESTADO DE CUENTA ================= */}
      {activeTab === 'items' && (
        <div className="space-y-8 animate-fadeIn">
            
            {/* 1.1 ORDEN ORIGINAL */}
            <div className="bg-white/90 backdrop-blur-xl shadow-xl shadow-slate-200/40 rounded-3xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
                        <ShoppingCartIcon className="h-5 w-5 text-emerald-600"/> Pedido Original
                    </h3>
                    <span className="text-lg font-black text-slate-900">${totalOrder.toFixed(2)}</span>
                </div>
                <table className="min-w-full text-left border-collapse">
                    <thead className="bg-white">
                        <tr>
                            <th className="px-6 py-3 text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Producto</th>
                            <th className="px-6 py-3 text-center text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Cant.</th>
                            <th className="px-6 py-3 text-right text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Subtotal</th>
                            <th className="px-6 py-3 border-b border-slate-100"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-4">
                                <div className="font-bold text-slate-900 text-sm">{item.product_name}</div>
                                <div className="text-xs text-slate-400 font-mono mt-0.5">{item.sku}</div>
                            </td>
                            <td className="px-6 py-4 text-center font-bold text-slate-700">{item.quantity}</td>
                            <td className="px-6 py-4 text-right font-extrabold text-slate-900">${item.subtotal}</td>
                            <td className="px-6 py-4 text-right">
                                {(orderStatus === 'pending' || orderStatus === 'processing') && (
                                    <HasPermission required="edit.order.content">
                                        <button onClick={() => deleteItem(item.id)} className="text-slate-300 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"><TrashIcon className="h-5 w-5" /></button>
                                    </HasPermission>
                                )}
                            </td>
                        </tr>
                        ))}
                    </tbody>
                </table>
                
                {(orderStatus === 'pending' || orderStatus === 'processing') && (
                    <HasPermission required="edit.order.content">
                        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row gap-3 items-center">
                            <div className="relative flex-grow w-full">
                                <input 
                                    type="text" placeholder="Buscar producto para agregar..." 
                                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500/30 outline-none"
                                    value={productSearch} onChange={e => { setProductSearch(e.target.value); setShowProductList(true); }}
                                    onBlur={() => setTimeout(() => setShowProductList(false), 200)}
                                />
                                {showProductList && products.length > 0 && (
                                    <ul className="absolute z-20 bg-white border border-slate-200 mt-2 max-h-40 overflow-y-auto shadow-xl rounded-xl bottom-12 w-full">
                                        {products.map(p => (
                                            <li key={p.id} onClick={() => { setSelectedProduct(p); setProductSearch(p.name); }} className="p-3 hover:bg-emerald-50 cursor-pointer text-sm font-bold text-slate-700 border-b border-slate-100">
                                                {p.name} <span className="text-emerald-600 ml-2">${p.price}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <input type="number" min="1" value={newItemQty} onChange={e => setNewItemQty(parseInt(e.target.value)||1)} className="w-20 p-2.5 border border-slate-300 bg-white rounded-xl text-sm font-bold text-center outline-none" />
                            <button onClick={handleAddItem} disabled={!selectedProduct} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-sm disabled:bg-slate-300 w-full sm:w-auto transition-colors">Agregar</button>
                        </div>
                    </HasPermission>
                )}
            </div>

            {/* 1.2 PRODUCTOS DEVUELTOS */}
            {returnedItemsList.length > 0 && (
                <div className="bg-rose-50/50 shadow-sm rounded-3xl border border-rose-200 overflow-hidden">
                    <div className="bg-rose-100/50 px-6 py-4 border-b border-rose-200 flex justify-between items-center">
                        <h3 className="font-extrabold text-rose-800 flex items-center gap-2">
                            <ArchiveBoxXMarkIcon className="h-5 w-5"/> Devoluciones de Mercancía
                        </h3>
                        <span className="text-lg font-black text-rose-800">-${totalItemRefunds.toFixed(2)}</span>
                    </div>
                    <table className="min-w-full text-left">
                        <thead className="bg-rose-50/50">
                            <tr>
                                <th className="px-6 py-3 text-xs font-black text-rose-500 uppercase tracking-widest border-b border-rose-100">Producto Devuelto</th>
                                <th className="px-6 py-3 text-center text-xs font-black text-rose-500 uppercase tracking-widest border-b border-rose-100">Cant.</th>
                                <th className="px-6 py-3 text-right text-xs font-black text-rose-500 uppercase tracking-widest border-b border-rose-100">Abonado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-rose-100/50">
                            {returnedItemsList.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="px-6 py-4 font-bold text-rose-900 text-sm">{item.product_name}</td>
                                    <td className="px-6 py-4 text-center font-bold text-rose-700">{item.quantity}</td>
                                    <td className="px-6 py-4 text-right font-black text-rose-900">-${item.subtotal_refunded}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* 1.3 AJUSTES MONETARIOS */}
            {totalMoneyRefunds > 0 && (
                <div className="bg-amber-50 shadow-sm rounded-2xl border border-amber-200 p-5 flex justify-between items-center">
                    <div className="flex items-center gap-3 text-amber-800 font-extrabold">
                        <div className="p-2 bg-amber-100 rounded-lg"><CurrencyDollarIcon className="h-5 w-5"/></div>
                        Ajustes / Reembolsos Manuales
                    </div>
                    <span className="font-black text-rose-600 text-xl">-${totalMoneyRefunds.toFixed(2)}</span>
                </div>
            )}

            {/* 1.4 RESUMEN FINAL */}
            <div className="flex justify-end mt-8">
                <div className="w-full md:w-1/2 bg-slate-800 p-8 rounded-3xl shadow-xl text-slate-100">
                    <div className="flex justify-between font-bold text-slate-300 mb-2">
                        <span>Total Orden Original:</span>
                        <span>${totalOrder.toFixed(2)}</span>
                    </div>
                    {(totalItemRefunds > 0 || totalMoneyRefunds > 0) && (
                        <div className="flex justify-between font-bold text-rose-400 mb-2">
                            <span>(-) Devoluciones/Ajustes:</span>
                            <span>-${(totalItemRefunds + totalMoneyRefunds).toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between font-black text-xl border-t border-slate-600 pt-4 mb-4 text-white">
                        <span>Neto a Pagar:</span>
                        <span>${netTotal.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between font-bold text-emerald-400 mb-2 border-t border-slate-700 pt-4">
                        <span>(-) Abonos Recibidos:</span>
                        <span>-${totalPaid.toFixed(2)}</span>
                    </div>

                    <div className={`flex justify-between text-2xl font-black border-t-2 border-slate-600 pt-4 mt-2 ${balanceDue > 0.01 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        <span>{balanceDue > 0.01 ? 'SALDO PENDIENTE' : 'LIQUIDADO'}</span>
                        <span>${Math.max(0, balanceDue).toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* ================= PESTAÑA 2: PAGOS ================= */}
      {activeTab === 'payments' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fadeIn">
            <div className="md:col-span-1">
                <HasPermission required="add.payment">
                    <div className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 sticky top-4">
                        <div className="mb-6 pb-6 border-b border-slate-100 text-center">
                            <p className="text-xs text-slate-400 uppercase font-black tracking-widest">Saldo Pendiente</p>
                            <p className={`text-4xl font-black mt-2 ${balanceDue > 0.01 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                ${Math.max(0, balanceDue).toFixed(2)}
                            </p>
                        </div>

                        <h3 className="text-lg font-extrabold text-slate-800 mb-5 flex items-center gap-2">
                            <CurrencyDollarIcon className="h-6 w-6 text-emerald-500"/> Registrar Abono
                        </h3>
                        <form onSubmit={handleCreatePayment} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Monto a Abonar ($)</label>
                                <input 
                                    type="number" step="0.01" required min="0.01" max={balanceDue + 0.01}
                                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-lg font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500/30 outline-none"
                                    value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Método</label>
                                <select 
                                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold focus:bg-white outline-none"
                                    value={paymentForm.method} onChange={e => setPaymentForm({...paymentForm, method: e.target.value})}
                                >
                                    <option value="cash">Efectivo</option>
                                    <option value="card">Tarjeta</option>
                                    <option value="transfer">Transferencia</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Notas</label>
                                <input 
                                    type="text" placeholder="Ref. o comentario"
                                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white outline-none"
                                    value={paymentForm.notes} onChange={e => setPaymentForm({...paymentForm, notes: e.target.value})}
                                />
                            </div>
                            <button 
                                type="submit" disabled={isPaying || balanceDue <= 0.01}
                                className="mt-4 w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold hover:bg-emerald-500 shadow-lg shadow-emerald-500/30 disabled:bg-slate-300 disabled:shadow-none transition-all text-lg"
                            >
                                {balanceDue <= 0.01 ? 'Liquidado' : (isPaying ? 'Procesando...' : 'Abonar a la Cuenta')}
                            </button>
                        </form>
                    </div>
                </HasPermission>
            </div>

            <div className="md:col-span-2 bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/80">
                    <h3 className="font-extrabold text-slate-800">Historial de Transacciones</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                        <thead className="bg-white">
                            <tr>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Fecha</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Método</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Recibido Por</th>
                                <th className="px-6 py-4 text-right text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Monto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {payments.length === 0 ? (
                                <tr><td colSpan="4" className="p-16 text-center text-slate-400 font-medium">No hay pagos registrados en esta orden.</td></tr>
                            ) : (
                                payments.map(pay => (
                                    <tr key={pay.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-bold text-slate-700">
                                            {new Date(pay.payment_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm capitalize flex items-center gap-2 font-bold text-slate-700">
                                            {pay.method === 'card' ? <CreditCardIcon className="h-5 w-5 text-blue-500"/> : <BanknotesIcon className="h-5 w-5 text-emerald-500"/>}
                                            {pay.method}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-500">{pay.received_by || 'Sistema'}</td>
                                        <td className="px-6 py-4 text-sm text-right font-black text-emerald-600">${pay.amount}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {/* ================= PESTAÑA 3: DEVOLUCIONES ================= */}
      {activeTab === 'returns' && (
        <div className="bg-white/90 backdrop-blur-xl shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-200 overflow-hidden animate-fadeIn">
            <table className="min-w-full text-left">
                <thead className="bg-slate-50/90 border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">ID RMA</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Fecha</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Motivo</th>
                        <th className="px-6 py-4 text-center text-xs font-black text-slate-500 uppercase tracking-widest">Estado</th>
                        <th className="px-6 py-4 text-right text-xs font-black text-slate-500 uppercase tracking-widest">Monto</th>
                        <th className="px-6 py-4 text-right text-xs font-black text-slate-500 uppercase tracking-widest">Acción</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                    {returns.length === 0 ? (
                        <tr><td colSpan="6" className="p-16 text-center text-slate-400 font-bold text-lg">No hay devoluciones asociadas.</td></tr>
                    ) : (
                        returns.map(rma => (
                            <tr key={rma.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-4 font-black text-slate-800 text-sm">#{rma.id}</td>
                                <td className="px-6 py-4 text-sm font-bold text-slate-500">{new Date(rma.created_at).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-sm font-medium text-slate-600 truncate max-w-xs">{rma.reason}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                                        rma.status === 'completed' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 
                                        rma.status === 'cancelled' ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-amber-100 text-amber-800 border-amber-300'
                                    }`}>
                                        {rma.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right font-black text-slate-900">
                                    {rma.total_refunded ? `$${rma.total_refunded}` : 'Bienes'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => setSelectedReturnId(rma.id)} className="text-blue-600 hover:text-blue-800 bg-white border border-slate-200 hover:border-blue-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ml-auto flex items-center gap-1">
                                        <EyeIcon className="h-4 w-4" /> Ver
                                    </button>
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