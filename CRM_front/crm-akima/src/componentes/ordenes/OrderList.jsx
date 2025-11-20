import { useState, useEffect, useCallback } from 'react';
import { PlusIcon, MagnifyingGlassIcon, EyeIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../../context/AuthContext';
import { HasPermission } from '../HasPermission';
import { Notification } from '../Notification';
import { PERMISSIONS } from '../../config/permissions';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const ORDERS_ENDPOINT = `${API_URL}/api/orders`;

export const OrderList = ({ onViewDetails, onCreateNew }) => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState({ type: '', message: '' });
  const { hasAnyPermission } = useAuth();

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(ORDERS_ENDPOINT, { credentials: 'include' });
      const data = await response.json();
      
      if (data.success) {
        setOrders(data.data);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      setNotification({ type: 'error', message: error.message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasAnyPermission(PERMISSIONS.ORDERS)) { // Asegúrate de tener este permiso en config
      fetchOrders();
    } else {
      setIsLoading(false);
    }
  }, [fetchOrders, hasAnyPermission]);

  // Helper para color de estado
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800'; // pending
    }
  };

  return (
    <div className="space-y-6">
      <Notification type={notification.type} message={notification.message} onClose={() => setNotification({type:'', message:''})} />

      <div className="flex justify-between items-center pb-2">
        <h1 className="text-3xl font-bold text-gray-900">Órdenes de Venta</h1>
        <HasPermission required="add.order">
          <button onClick={onCreateNew} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-700">
            <PlusIcon className="h-5 w-5" /> Nueva Orden
          </button>
        </HasPermission>
      </div>

      <div className="bg-white shadow-xl rounded-lg overflow-hidden">
        <div className="overflow-y-auto h-[60vh]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Vendedor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan="6" className="p-6 text-center">Cargando...</td></tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">#{order.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{order.client_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{order.user_name}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">${order.total_amount}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => onViewDetails(order)}
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1 text-sm font-medium"
                      >
                        <EyeIcon className="h-4 w-4" /> Más detalles
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