import { useState, useEffect } from 'react';
import { ArrowLeftIcon, CubeIcon, CurrencyDollarIcon, UserIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { Notification } from '../Notification';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const ReturnDetails = ({ returnId, onClose }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ type: '', message: '' });

  // Cargar Detalles
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await fetch(`${API_URL}/api/returns/${returnId}`, { credentials: 'include' });
        const data = await res.json();
        
        if (data.success) {
          setDetails(data.data);
        } else {
          setNotification({ type: 'error', message: data.message || 'Error al cargar detalles.' });
        }
      } catch (error) {
        setNotification({ type: 'error', message: 'Error de conexión.' });
      } finally {
        setLoading(false);
      }
    };

    if (returnId) fetchDetails();
  }, [returnId]);

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando detalles...</div>;
  if (!details) return <div className="p-8 text-center text-red-500">No se encontró la información.</div>;

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
    <div className="max-w-4xl mx-auto space-y-6">
      <Notification type={notification.type} message={notification.message} onClose={() => setNotification({type:'', message:''})} />

      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Devolución #{details.id}</h1>
            <p className="text-sm text-gray-500">Orden Original: <span className="font-mono font-bold">#{details.order_id}</span></p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-bold uppercase ${getStatusColor(details.status)}`}>
          {details.status}
        </span>
      </div>

      {/* Tarjetas de Información */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card Cliente */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-bold text-gray-500 mb-3 flex items-center gap-2">
                <UserIcon className="h-4 w-4"/> Datos del Cliente
            </h3>
            <p className="text-lg font-bold text-gray-800">{details.client_name}</p>
            {details.client_email && (
                <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                    <EnvelopeIcon className="h-3 w-3"/> {details.client_email}
                </p>
            )}
        </div>

        {/* Card Staff y Razón */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-500">Atendido Por</h3>
                <span className="text-sm font-medium text-blue-600">{details.user_name}</span>
            </div>
            <div className="border-t pt-3">
                <h3 className="text-sm font-bold text-gray-500 mb-1">Motivo del Reembolso</h3>
                <p className="text-gray-800 bg-gray-50 p-2 rounded italic text-sm">"{details.reason}"</p>
            </div>
        </div>
      </div>

      {/* Tabla de Items o Info Monetaria */}
      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        <div className="bg-gray-50 px-6 py-3 border-b">
            <h3 className="text-gray-700 font-bold flex items-center gap-2">
                {details.items && details.items.length > 0 ? <CubeIcon className="h-5 w-5"/> : <CurrencyDollarIcon className="h-5 w-5"/>}
                Desglose del Reembolso
            </h3>
        </div>

        {details.items && details.items.length > 0 ? (
            // ESCENARIO A: Tabla de Items devueltos
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Cant.</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unitario Reembolsado</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {details.items.map((item) => (
                        <tr key={item.id}>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.product_name}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{item.sku}</td>
                            <td className="px-6 py-4 text-sm text-center font-bold">{item.quantity}</td>
                            <td className="px-6 py-4 text-sm text-right text-gray-500">${item.unit_price_refunded}</td>
                            <td className="px-6 py-4 text-sm text-right font-bold text-green-600">${item.subtotal_refunded}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot className="bg-gray-50">
                    <tr>
                        <td colSpan="4" className="px-6 py-3 text-right font-bold text-gray-900">Total Reembolsado:</td>
                        <td className="px-6 py-3 text-right font-bold text-green-700 text-lg">${details.total_refunded}</td>
                    </tr>
                </tfoot>
            </table>
        ) : (
            // ESCENARIO B: Solo Dinero
            <div className="p-10 text-center">
                <div className="inline-block p-4 rounded-full bg-green-100 mb-4">
                    <CurrencyDollarIcon className="h-10 w-10 text-green-600" />
                </div>
                <p className="text-gray-500 mb-2">Se realizó un ajuste monetario directo sin retorno de mercancía física.</p>
                <p className="text-4xl font-bold text-green-600">${details.total_refunded}</p>
            </div>
        )}
      </div>
    </div>
  );
};