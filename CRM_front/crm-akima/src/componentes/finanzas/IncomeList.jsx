import { useState, useEffect } from 'react';
import { BanknotesIcon, CreditCardIcon, UserIcon } from '@heroicons/react/24/solid';
import { Notification } from '../Notification';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const IncomeList = () => {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState({ type: '', message: '' });

  useEffect(() => {
    const fetchPayments = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/payments`, { credentials: 'include' });
        const data = await res.json();
        if (data.success) setPayments(data.data);
      } catch (error) {
        setNotification({ type: 'error', message: 'Error cargando historial de pagos.' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchPayments();
  }, []);

  return (
    <div className="space-y-6">
      <Notification type={notification.type} message={notification.message} onClose={() => setNotification({type:'', message:''})} />
      
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Historial de Ingresos</h2>
        <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full">
            {payments.length} Transacciones
        </span>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        <div className="overflow-y-auto h-[60vh]">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID / Fecha</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orden</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Método</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cobrado Por</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {isLoading ? <tr><td colSpan="5" className="p-6 text-center">Cargando...</td></tr> : 
                     payments.map(pay => (
                        <tr key={pay.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900">
                                <span className="font-bold">#{pay.id}</span> <br/>
                                <span className="text-xs text-gray-500">{new Date(pay.payment_date).toLocaleDateString()}</span>
                            </td>
                            <td className="px-6 py-4 text-sm text-blue-600 font-medium">Orden #{pay.order_id}</td>
                            <td className="px-6 py-4 text-sm capitalize flex items-center gap-2">
                                {pay.method === 'card' ? <CreditCardIcon className="h-4 w-4 text-blue-500"/> : <BanknotesIcon className="h-4 w-4 text-green-600"/>}
                                {pay.method}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                    <UserIcon className="h-3 w-3"/> {pay.received_by || 'Sistema'}
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-bold text-green-700">
                                +${pay.amount}
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