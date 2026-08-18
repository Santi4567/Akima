import { useState, useEffect, useCallback } from 'react';
import { PlusIcon, EyeIcon, ArrowUturnLeftIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../../context/AuthContext';
import { HasPermission } from '../HasPermission';
import { Notification } from '../Notification';

const API_URL = import.meta.env.VITE_API_URL;

export const ReturnsList = ({ onCreate, onViewDetails }) => {
  const [returns, setReturns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState({ type: '', message: '' });
  const { hasPermission } = useAuth();

  const fetchReturns = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/returns`, { credentials: 'include' });
      const data = await response.json();
      if (data.success) setReturns(data.data);
      else setReturns([]);
    } catch (error) {
      setNotification({ type: 'error', message: 'No se pudieron cargar las devoluciones.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchReturns(); }, [fetchReturns]);

  const formatDate = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'cancelled': return 'bg-rose-100 text-rose-800 border-rose-300';
      default: return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <Notification type={notification.type} message={notification.message} onClose={() => setNotification({type:'', message:''})} />

      {/* Cabecera Rosa/Rojo (Identidad visual de RMA/Devoluciones) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
        <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                <div className="p-2 bg-rose-100 rounded-xl border border-rose-200 shadow-sm">
                    <ArrowUturnLeftIcon className="h-7 w-7 text-rose-600" />
                </div>
                Gestión de Devoluciones
            </h1>
            <p className="text-sm text-slate-500 mt-2 font-medium">Historial general de garantías, retornos y reembolsos (RMA)</p>
        </div>
        <HasPermission required="issue.refund"> 
          <button onClick={onCreate} className="flex items-center gap-2 bg-rose-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-rose-500/30 hover:bg-rose-700 hover:-translate-y-0.5 transition-all active:translate-y-0">
            <PlusIcon className="h-5 w-5" /> Registrar Devolución
          </button>
        </HasPermission>
      </div>

      <div className="bg-white/90 backdrop-blur-xl shadow-xl shadow-slate-200/40 rounded-3xl border border-slate-200 overflow-hidden">
        <div className="overflow-y-auto max-h-[60vh]">
          <table className="min-w-full text-left border-collapse">
            <thead className="bg-slate-50/90 backdrop-blur-md sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">RMA / Fecha</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Orden Orig.</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Cliente</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Monto Ref.</th>
                <th className="px-6 py-4 text-center text-xs font-black text-slate-500 uppercase tracking-widest">Estado</th>
                <th className="px-6 py-4 text-right text-xs font-black text-slate-500 uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                <tr><td colSpan="6" className="p-16 text-center text-slate-400 font-medium"><ArrowPathIcon className="h-8 w-8 animate-spin mx-auto mb-3 text-rose-500" />Cargando RMA...</td></tr>
              ) : returns.length === 0 ? (
                <tr><td colSpan="6" className="p-16 text-center text-slate-400 font-bold text-lg">No hay devoluciones registradas en el sistema.</td></tr>
              ) : (
                returns.map((rma) => (
                  <tr key={rma.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-black text-slate-900">RMA #{rma.id}</div>
                        <div className="text-xs font-bold text-slate-500 mt-0.5">{formatDate(rma.created_at)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex bg-slate-100 border border-slate-200 text-slate-800 font-bold px-2.5 py-1 rounded-lg text-xs">
                            Ord #{rma.order_id}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800">
                        {rma.client_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-rose-600">
                        ${rma.total_refunded}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-3 py-1 inline-flex text-xs font-extrabold rounded-full border capitalize ${getStatusColor(rma.status)}`}>
                        {rma.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button onClick={() => onViewDetails(rma)} className="text-blue-600 hover:text-blue-800 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 px-3 py-1.5 rounded-lg flex items-center justify-center gap-2 ml-auto text-xs font-bold transition-all shadow-sm">
                          <EyeIcon className="h-4 w-4" /> Detalles
                        </button>
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