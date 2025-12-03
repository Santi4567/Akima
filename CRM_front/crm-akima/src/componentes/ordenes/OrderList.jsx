// src/componentes/ordenes/OrderList.jsx

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
  const [searchTerm, setSearchTerm] = useState(''); // Estado para el input de búsqueda
  const [notification, setNotification] = useState({ type: '', message: '' });
  const { hasAnyPermission } = useAuth();

  // --- 1. CARGA DE DATOS (Con soporte de búsqueda) ---
  const fetchOrders = useCallback(async (query = '') => {
    setIsLoading(true);
    try {
      // Si hay texto en el buscador, usamos el endpoint de búsqueda
      // Si no, usamos el endpoint general
      const url = query 
        ? `${ORDERS_ENDPOINT}/search?q=${query}` 
        : ORDERS_ENDPOINT;

      const response = await fetch(url, { credentials: 'include' });
      const data = await response.json();
      
      if (data.success) {
        setOrders(data.data);
      } else {
        // Si no hay resultados en la búsqueda, limpiamos la lista
        setOrders([]); 
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Error de conexión al cargar órdenes.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // --- 2. EFECTO DEBOUNCE (Búsqueda en vivo) ---
  useEffect(() => {
    if (hasAnyPermission(PERMISSIONS.ORDERS)) {
      // Creamos un temporizador para no llamar al API con cada letra
      const timer = setTimeout(() => {
        fetchOrders(searchTerm);
      }, 350); // 350ms de espera

      return () => clearTimeout(timer); // Limpieza si el usuario sigue escribiendo
    } else {
      setIsLoading(false);
    }
  }, [searchTerm, fetchOrders, hasAnyPermission]);

  // Helper para color de estado
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-orange-100 text-orange-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800'; // pending
    }
  };

  return (
    <div className="space-y-6">
      <Notification type={notification.type} message={notification.message} onClose={() => setNotification({type:'', message:''})} />

      {/* Cabecera y Botón Nuevo */}
      <div className="flex justify-between items-center pb-2">
        <h1 className="text-3xl font-bold text-gray-900">Órdenes de Venta</h1>
        <HasPermission required="add.order">
          <button onClick={onCreateNew} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-700">
            <PlusIcon className="h-5 w-5" /> Nueva Orden
          </button>
        </HasPermission>
      </div>

      {/* --- BARRA DE BÚSQUEDA --- */}
      <div className="relative w-full max-w-xl">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="search"
          placeholder="Buscar por ID, Cliente o Vendedor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 pl-10 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Tabla de Resultados */}
      <div className="bg-white shadow-xl rounded-lg overflow-hidden border border-gray-200">
        <div className="overflow-y-auto h-[60vh]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100 sticky top-0 z-10">
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
                <tr><td colSpan="6" className="p-6 text-center text-gray-500 animate-pulse">Cargando órdenes...</td></tr>
              ) : orders.length === 0 ? (
                <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-500">
                        {searchTerm ? `No se encontraron resultados para "${searchTerm}"` : 'No hay órdenes registradas.'}
                    </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">#{order.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{order.client_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{order.user_name}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">${order.total_amount}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => onViewDetails(order)}
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1 text-sm font-medium transition-colors"
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