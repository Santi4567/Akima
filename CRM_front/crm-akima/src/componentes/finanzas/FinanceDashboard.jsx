import { useState, useEffect } from 'react';
import { 
  CurrencyDollarIcon, 
  CreditCardIcon, 
  ExclamationCircleIcon, 
  ArchiveBoxIcon,
  StarIcon // Nuevo icono para los clientes VIP
} from '@heroicons/react/24/solid';
import { Notification } from '../Notification';

const API_URL = import.meta.env.VITE_API_URL;

export const FinanceDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [leastProducts, setLeastProducts] = useState([]);
  
  // --- NUEVO ESTADO: Mejores Clientes ---
  const [bestClients, setBestClients] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState({ type: '', message: '' });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Agregamos la cuarta petición al Promise.all
        const [dashRes, topRes, leastRes, clientsRes] = await Promise.all([
            fetch(`${API_URL}/api/finance/dashboard`, { credentials: 'include' }),
            fetch(`${API_URL}/api/finance/reports/top-products`, { credentials: 'include' }),
            fetch(`${API_URL}/api/finance/reports/least-sold`, { credentials: 'include' }),
            // Nuevo Endpoint
            fetch(`${API_URL}/api/clients/reports/best`, { credentials: 'include' }) 
        ]);

        const dashData = await dashRes.json();
        const topData = await topRes.json();
        const leastData = await leastRes.json();
        const clientsData = await clientsRes.json();

        if (dashData.success) setMetrics(dashData.data);
        if (topData.success) setTopProducts(topData.data);
        if (leastData.success) setLeastProducts(leastData.data);
        
        // Guardar mejores clientes
        if (clientsData.success) setBestClients(clientsData.data);

      } catch (error) {
        setNotification({ type: 'error', message: 'Error cargando reportes financieros.' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Helper para moneda
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount || 0);
  };

  if (isLoading) return <div className="p-10 text-center text-gray-500">Calculando finanzas...</div>;

  return (
    <div className="space-y-8">
      <Notification type={notification.type} message={notification.message} onClose={() => setNotification({type:'', message:''})} />

      {/* --- SECCIÓN 1: TARJETAS KPI --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Ventas Brutas */}
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500 font-bold uppercase">Ventas Totales</p>
                    <p className="text-2xl font-bold text-gray-800">{formatMoney(metrics?.gross_sales)}</p>
                </div>
                <ArchiveBoxIcon className="h-10 w-10 text-blue-100 text-opacity-80" />
            </div>
        </div>

        {/* Ingreso Neto */}
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500 font-bold uppercase">Dinero en Caja (Neto)</p>
                    <p className="text-2xl font-bold text-green-600">{formatMoney(metrics?.net_income)}</p>
                </div>
                <CurrencyDollarIcon className="h-10 w-10 text-green-100 text-opacity-80" />
            </div>
        </div>

        {/* Cuentas por Cobrar */}
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500 font-bold uppercase">Por Cobrar (Deuda)</p>
                    <p className="text-2xl font-bold text-yellow-600">{formatMoney(metrics?.accounts_receivable)}</p>
                </div>
                <CreditCardIcon className="h-10 w-10 text-yellow-100 text-opacity-80" />
            </div>
        </div>

        {/* Reembolsos */}
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500 font-bold uppercase">Reembolsado</p>
                    <p className="text-2xl font-bold text-red-600">{formatMoney(metrics?.total_refunds)}</p>
                </div>
                <ExclamationCircleIcon className="h-10 w-10 text-red-100 text-opacity-80" />
            </div>
        </div>
      </div>

      {/* --- SECCIÓN 2: TABLAS DE PRODUCTOS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* TOP PRODUCTOS */}
        <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-800">🔥 Productos Más Vendidos</h3>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Vendidos</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ingresos</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {topProducts.map((prod, idx) => (
                        <tr key={idx}>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{prod.product_name}</td>
                            <td className="px-6 py-4 text-sm text-gray-500 text-center">{prod.total_sold}</td>
                            <td className="px-6 py-4 text-sm text-green-600 font-bold text-right">{formatMoney(prod.total_revenue)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* MENOS VENDIDOS */}
        <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-800">❄️ Productos con Menor Movimiento</h3>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Vendidos</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {leastProducts.map((prod, idx) => (
                        <tr key={idx}>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{prod.product_name}</td>
                            <td className="px-6 py-4 text-sm text-gray-500 text-center">{prod.total_sold}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      {/* --- SECCIÓN 3: MEJORES CLIENTES (NUEVO) --- */}
      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <StarIcon className="h-5 w-5 text-yellow-500" /> Mejores Clientes (Top Compradores)
            </h3>
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Pedidos</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Prom. Pago (Horas)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Última Compra</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Gastado</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {bestClients.map((client) => (
                        <tr key={client.id} className="hover:bg-yellow-50 transition-colors">
                            <td className="px-6 py-4">
                                <div className="text-sm font-bold text-gray-900">{client.client_name}</div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-xs text-gray-500">{client.email}</div>
                                <div className="text-xs text-gray-500">{client.phone}</div>
                            </td>
                            <td className="px-6 py-4 text-center text-sm text-gray-700">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {client.total_orders}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-center text-sm text-gray-600">
                                {parseFloat(client.avg_hours_to_pay).toFixed(1)} hrs
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                                {new Date(client.last_purchase_date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-bold text-green-600">
                                {formatMoney(client.total_spent)}
                            </td>
                        </tr>
                    ))}
                    {bestClients.length === 0 && (
                        <tr><td colSpan="6" className="p-6 text-center text-gray-500">No hay datos de clientes aún.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

    </div>
  );
};