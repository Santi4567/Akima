import { useState, useEffect, useCallback } from 'react';
import { 
  PlusIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  EyeIcon 
} from '@heroicons/react/24/solid';
import { useAuth } from '../../context/AuthContext';
import { HasPermission } from '../HasPermission';
import { Notification } from '../Notification';

const API_URL = import.meta.env.VITE_API_URL;

export const ReturnsList = ({ onCreate, onViewDetails }) => {
  const [returns, setReturns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState({ type: '', message: '' });
  const { hasPermission } = useAuth();

  // --- 1. CARGAR DEVOLUCIONES ---
  const fetchReturns = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/returns`, { credentials: 'include' });
      const data = await response.json();
      
      if (data.success) {
        setReturns(data.data);
      } else {
        setReturns([]);
      }
    } catch (error) {
      console.error(error);
      setNotification({ type: 'error', message: 'No se pudieron cargar las devoluciones.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  // --- 2. ACTUALIZAR ESTADO ---
  const handleUpdateStatus = async (id, newStatus) => {
    const actionText = newStatus === 'completed' ? 'aprobar' : 'cancelar';
    if(!window.confirm(`¿Estás seguro de ${actionText} esta devolución?`)) return;

    try {
      const res = await fetch(`${API_URL}/api/returns/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();

      if (data.success) {
        setNotification({ type: 'success', message: 'Estado actualizado correctamente.' });
        fetchReturns(); 
      } else {
        setNotification({ type: 'error', message: data.message });
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Error de conexión.' });
    }
  };

  // Helper para fecha
  const formatDate = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  // Helper para colores
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Notification 
        type={notification.type} 
        message={notification.message} 
        onClose={() => setNotification({type:'', message:''})} 
      />

      <div className="flex justify-between items-center pb-2">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Devoluciones (RMA)</h1>
        <HasPermission required="issue.refund"> 
          <button 
            onClick={onCreate} 
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-red-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5" /> Registrar Devolución
          </button>
        </HasPermission>
      </div>

      <div className="bg-white shadow-xl rounded-lg overflow-hidden border border-gray-200">
        <div className="overflow-y-auto h-[60vh]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">ID / Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Orden</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Atendido Por</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Total</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan="7" className="p-6 text-center text-gray-500 animate-pulse">Cargando devoluciones...</td></tr>
              ) : returns.length === 0 ? (
                <tr><td colSpan="7" className="p-8 text-center text-gray-500 italic">No hay devoluciones registradas.</td></tr>
              ) : (
                returns.map((rma) => (
                  <tr key={rma.id} className="hover:bg-gray-50 transition-colors">
                    {/* ID y Fecha */}
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">#{rma.id}</div>
                        <div className="text-xs text-gray-500">{formatDate(rma.created_at)}</div>
                    </td>
                    {/* Orden Original */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                        Orden #{rma.order_id}
                    </td>
                    {/* Cliente (Nuevo dato) */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {rma.client_name}
                    </td>
                    {/* Vendedor (Nuevo dato) */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {rma.user_name}
                    </td>
                    {/* Monto Total */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">
                        ${rma.total_refunded}
                    </td>
                    {/* Estado */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(rma.status)}`}>
                        {rma.status}
                      </span>
                    </td>
                    {/* Acciones */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end items-center gap-3">
                        <button 
                          onClick={() => onViewDetails(rma)}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1 text-sm font-medium transition-colors"
                          title="Ver detalles completos"
                        >Mas detalles
                          <EyeIcon className="h-5 w-5" />
                        </button>

                        
                      </div>
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