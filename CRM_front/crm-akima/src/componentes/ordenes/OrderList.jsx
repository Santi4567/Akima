// src/componentes/ordenes/OrderList.jsx

import { useState, useEffect, useCallback } from 'react';
import { PlusIcon, MagnifyingGlassIcon, EyeIcon, ClipboardDocumentCheckIcon, ArrowPathIcon, CalendarDaysIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../../context/AuthContext';
import { HasPermission } from '../HasPermission';
import { Notification } from '../Notification';
import { PERMISSIONS } from '../../config/permissions';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const ORDERS_ENDPOINT = `${API_URL}/api/orders`;

export const OrderList = ({ onViewDetails, onCreateNew }) => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(''); 
  const [notification, setNotification] = useState({ type: '', message: '' });
  const { hasAnyPermission } = useAuth();

  const fetchOrders = useCallback(async (query = '') => {
    setIsLoading(true);
    try {
      const url = query ? `${ORDERS_ENDPOINT}/search?q=${query}` : ORDERS_ENDPOINT;
      const response = await fetch(url, { credentials: 'include' });
      const data = await response.json();
      if (data.success) setOrders(data.data);
      else setOrders([]); 
    } catch (error) {
      setNotification({ type: 'error', message: 'Error de conexión al cargar órdenes.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasAnyPermission(PERMISSIONS.ORDERS)) {
      const timer = setTimeout(() => fetchOrders(searchTerm), 350);
      return () => clearTimeout(timer);
    } else setIsLoading(false);
  }, [searchTerm, fetchOrders, hasAnyPermission]);

  // Helper para dar formato a la fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    const d = new Date(dateString);
    return {
        date: d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'shipped': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'processing': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'cancelled': return 'bg-rose-100 text-rose-800 border-rose-300';
      default: return 'bg-slate-100 text-slate-700 border-slate-300'; 
    }
  };

  const getStatusDot = (status) => {
    switch (status) {
      case 'completed': return 'text-emerald-500';
      case 'shipped': return 'text-blue-500';
      case 'processing': return 'text-amber-500';
      case 'cancelled': return 'text-rose-500';
      default: return 'text-slate-400'; 
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <Notification type={notification.type} message={notification.message} onClose={() => setNotification({type:'', message:''})} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
        <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-xl border border-emerald-200 shadow-sm">
                    <ClipboardDocumentCheckIcon className="h-7 w-7 text-emerald-600" />
                </div>
                Órdenes de Venta
            </h1>
            <p className="text-sm text-slate-500 mt-2 font-medium">Gestiona los pedidos, envíos y cobros de tus clientes</p>
        </div>
        <HasPermission required="add.order">
          <button onClick={onCreateNew} className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-500/30 hover:bg-emerald-700 hover:-translate-y-0.5 transition-all active:translate-y-0">
            <PlusIcon className="h-5 w-5" /> Nuevo Pedido
          </button>
        </HasPermission>
      </div>

      <div className="relative w-full md:max-w-md">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
          <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="search" placeholder="Buscar por ID, Cliente o Vendedor..." value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 pl-11 bg-white/80 backdrop-blur-sm border border-slate-300 text-slate-900 placeholder-slate-400 rounded-xl shadow-sm text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all outline-none"
        />
      </div>

      <div className="bg-white/90 backdrop-blur-xl shadow-xl shadow-slate-200/40 rounded-3xl border border-slate-200 overflow-hidden">
        <div className="overflow-y-auto max-h-[60vh]">
          <table className="min-w-full text-left border-collapse">
            <thead className="bg-slate-50/90 backdrop-blur-md sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">ID Pedido</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Fecha</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Cliente</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Monto Total</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Estado</th>
                <th className="px-6 py-4 text-right text-xs font-black text-slate-500 uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan="6" className="p-16 text-center text-slate-400 font-medium"><ArrowPathIcon className="h-8 w-8 animate-spin mx-auto mb-3 text-emerald-500" />Cargando órdenes...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan="6" className="p-16 text-center text-slate-400 font-bold text-lg">{searchTerm ? `No se encontraron resultados para "${searchTerm}"` : 'No hay órdenes registradas.'}</td></tr>
              ) : (
                orders.map((order) => {
                  const formattedDate = formatDate(order.created_at);
                  return (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                          <div className="inline-flex bg-slate-100 border border-slate-200 text-slate-800 font-black px-3 py-1.5 rounded-lg text-sm">
                              #{order.id}
                          </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm font-bold text-slate-800 mb-0.5">
                              <CalendarDaysIcon className="h-4 w-4 mr-1.5 text-slate-400" />
                              {formattedDate.date}
                          </div>
                          <div className="text-xs font-semibold text-slate-400 ml-5.5">
                              {formattedDate.time}
                          </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-extrabold text-slate-900 text-sm">{order.client_name}</div>
                          <div className="text-xs font-medium text-slate-500 mt-0.5">Vendedor: {order.user_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-base font-black text-emerald-700">
                              ${parseFloat(order.total_amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold border capitalize ${getStatusStyle(order.status)}`}>
                          <svg className={`mr-1.5 h-2 w-2 ${getStatusDot(order.status)}`} fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" /></svg>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button 
                          onClick={() => onViewDetails(order)}
                          className="text-emerald-600 hover:text-emerald-800 bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 px-3 py-1.5 rounded-lg flex items-center justify-center gap-2 ml-auto text-xs font-bold transition-all shadow-sm"
                        >
                          <EyeIcon className="h-4 w-4" /> Expediente
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};