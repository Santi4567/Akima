import { useState, useEffect } from 'react';
import { ArrowTrendingDownIcon } from '@heroicons/react/24/solid';
import { Notification } from '../Notification';

const API_URL = import.meta.env.VITE_API_URL;

export const ExpensesList = () => {
  const [returns, setReturns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState({ type: '', message: '' });

  useEffect(() => {
    const fetchReturns = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/returns`, { credentials: 'include' });
        const data = await res.json();
        if (data.success) setReturns(data.data);
      } catch (error) {
        setNotification({ type: 'error', message: 'Error cargando historial de egresos.' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchReturns();
  }, []);

  return (
    <div className="space-y-6">
      <Notification type={notification.type} message={notification.message} onClose={() => setNotification({type:'', message:''})} />
      
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Historial de Egresos / Devoluciones</h2>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        <div className="overflow-y-auto h-[60vh]">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">RMA #</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orden</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motivo</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto Ajustado</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {isLoading ? <tr><td colSpan="5" className="p-6 text-center">Cargando...</td></tr> : 
                     returns.map(rma => (
                        <tr key={rma.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-bold text-gray-900">
                                #{rma.id} <br/>
                                <span className="text-xs text-gray-500 font-normal">{new Date(rma.created_at).toLocaleDateString()}</span>
                            </td>
                            <td className="px-6 py-4 text-sm text-blue-600">#{rma.order_id}</td>
                            <td className="px-6 py-4 text-sm text-gray-600 truncate max-w-xs">{rma.reason}</td>
                            <td className="px-6 py-4 text-center">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                                    rma.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    rma.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {rma.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-bold text-red-600">
                                {rma.total_refunded ? `-$${rma.total_refunded}` : 'Inventario'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};