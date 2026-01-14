import { useState, useEffect, useCallback } from 'react';
import { 
  CurrencyDollarIcon, 
  CreditCardIcon, 
  BanknotesIcon, 
  ShoppingBagIcon, 
  TicketIcon, 
  ArrowPathIcon,
  ArchiveBoxXMarkIcon,
  StarIcon,
  CalendarDaysIcon, // Icono para el selector de fecha
  GlobeAmericasIcon // Icono para el botón "Todo"
} from '@heroicons/react/24/solid';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { Notification } from '../Notification';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const FinanceDashboard = () => {
  // --- ESTADOS ---
  const [period, setPeriod] = useState('month'); 
  const [customDate, setCustomDate] = useState(''); // Estado para el input de fecha
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ type: '', message: '' });

  // --- DATOS ---
  const [metrics, setMetrics] = useState(null); 
  const [salesChart, setSalesChart] = useState([]); 
  const [topProducts, setTopProducts] = useState([]); 
  const [leastProducts, setLeastProducts] = useState([]); 
  const [bestClients, setBestClients] = useState([]); 

  // --- CARGA DE DATOS ---
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = { credentials: 'include' };
      
      // Construimos el query param. 
      // Si period es 'custom', usamos el estado customDate (aunque en este flujo, period toma el valor de la fecha)
      const queryParam = `?period=${period}`;

      const [dashRes, chartRes, topRes, leastRes, clientsRes] = await Promise.all([
        fetch(`${API_URL}/api/finance/dashboard${queryParam}`, headers),
        fetch(`${API_URL}/api/finance/reports/sales-chart${queryParam}`, headers),
        fetch(`${API_URL}/api/finance/reports/top-products${queryParam}`, headers),
        fetch(`${API_URL}/api/finance/reports/least-sold${queryParam}`, headers),
        fetch(`${API_URL}/api/clients/reports/best${queryParam}`, headers)
      ]);

      const dash = await dashRes.json();
      const chart = await chartRes.json();
      const top = await topRes.json();
      const least = await leastRes.json();
      const clients = await clientsRes.json();

      if (dash.success) setMetrics(dash.data);
      if (chart.success) setSalesChart(chart.data);
      if (top.success) setTopProducts(top.data);
      if (least.success) setLeastProducts(least.data);
      if (clients.success) setBestClients(clients.data);

    } catch (error) {
      console.error(error);
      setNotification({ type: 'error', message: 'Error cargando reportes financieros.' });
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Handler para fecha específica
  const handleDateChange = (e) => {
    const date = e.target.value;
    setCustomDate(date);
    if(date) setPeriod(date); // Esto envía ?period=YYYY-MM-DD
  };

  // Helper Moneda
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount || 0);
  };

  // Componente Tarjeta KPI
  const KpiCard = ({ title, value, icon: Icon, color, subValue }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-10">
      <Notification type={notification.type} message={notification.message} onClose={() => setNotification({type:'', message:''})} />

      {/* 1. HEADER Y FILTROS */}
      <div className="flex flex-col xl:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg border shadow-sm">
        <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <BanknotesIcon className="h-8 w-8 text-green-600"/> Dashboard Financiero
            </h1>
            <p className="text-sm text-gray-500">
                Mostrando: <span className="font-bold text-gray-700 uppercase">{period === 'all_time' ? 'Histórico Total' : period}</span>
            </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 bg-gray-100 p-1 rounded-lg">
            {/* Botones de Periodo */}
            {[
                { id: 'today', label: 'Hoy' },
                { id: 'week', label: 'Semana' },
                { id: 'month', label: 'Mes' },
                { id: 'year', label: 'Año' },
                { id: 'all_time', label: 'Todo', icon: GlobeAmericasIcon } // <-- Botón Nuevo
            ].map((btn) => (
                <button
                    key={btn.id}
                    onClick={() => { setPeriod(btn.id); setCustomDate(''); }}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-1 ${
                        period === btn.id 
                        ? 'bg-white text-green-700 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    {btn.icon && <btn.icon className="h-4 w-4"/>}
                    {btn.label}
                </button>
            ))}

            {/* Separador */}
            <div className="w-px h-6 bg-gray-300 mx-1"></div>

            {/* Input Fecha Específica */}
            <div className="relative flex items-center">
                <CalendarDaysIcon className="h-5 w-5 text-gray-400 absolute left-2 pointer-events-none"/>
                <input 
                    type="date"
                    className="pl-8 pr-2 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                    value={customDate}
                    onChange={handleDateChange}
                />
            </div>

            <button onClick={fetchAllData} className="p-2 text-gray-500 hover:text-green-600" title="Recargar datos">
                <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
        </div>
      </div>

      {/* 2. TARJETAS KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
            title="Ventas Brutas" 
            value={formatMoney(metrics?.gross_sales)} 
            icon={ShoppingBagIcon} 
            color="bg-blue-500"
            subValue="Total facturado"
        />
        <KpiCard 
            title="Ingreso Neto (Cobrado)" 
            value={formatMoney(metrics?.net_income)} 
            icon={CurrencyDollarIcon} 
            color="bg-green-600"
            subValue="Dinero real en caja"
        />
        <KpiCard 
            title="Por Cobrar (Deuda)" 
            value={formatMoney(metrics?.pending_balance)} 
            icon={CreditCardIcon} 
            color="bg-orange-400"
            subValue="Crédito a clientes"
        />
        <KpiCard 
            title="Ticket Promedio" 
            value={formatMoney(metrics?.average_ticket)} 
            icon={TicketIcon} 
            color="bg-purple-500"
            subValue={`${metrics?.total_orders || 0} órdenes`}
        />
      </div>

      {/* 3. GRÁFICA DE VENTAS */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <ArrowPathIcon className="h-5 w-5 text-gray-400"/> Tendencia de Ventas
        </h3>
        <div className="h-[300px] w-full">
            {salesChart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesChart} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                            dataKey="date_label" 
                            tick={{fontSize: 12}} 
                            tickFormatter={(value) => {
                                // Formateo inteligente del eje X
                                const date = new Date(value);
                                if (period === 'year' || period === 'all_time') {
                                    // Para año o histórico, mostramos Mes/Año o solo Mes
                                    return date.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' });
                                }
                                // Para días (hoy, semana, mes)
                                return date.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' });
                            }}
                        />
                        <YAxis tickFormatter={(value) => `$${value/1000}k`} />
                        <Tooltip 
                            formatter={(value) => formatMoney(value)}
                            labelStyle={{ color: '#374151' }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="total_sales" name="Ventas ($)" stroke="#16a34a" strokeWidth={3} activeDot={{ r: 8 }} />
                    </LineChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex items-center justify-center text-gray-400 italic bg-gray-50 rounded-lg border border-dashed">
                    No hay suficientes datos de ventas para graficar en este periodo.
                </div>
            )}
        </div>
      </div>

      {/* 4. TABLAS DE PRODUCTOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Productos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-green-50 px-6 py-4 border-b border-green-100">
                <h3 className="font-bold text-green-800 flex items-center gap-2">
                    <ShoppingBagIcon className="h-5 w-5"/> Más Vendidos
                </h3>
            </div>
            <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-white">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Producto</th>
                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Cant.</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Total</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {topProducts.map((p, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-6 py-3 text-sm text-gray-900 font-medium truncate max-w-[150px]" title={p.product_name}>{p.product_name}</td>
                            <td className="px-6 py-3 text-center text-sm text-gray-600">{p.total_sold}</td>
                            <td className="px-6 py-3 text-right text-sm font-bold text-green-600">{formatMoney(p.total_revenue)}</td>
                        </tr>
                    ))}
                    {topProducts.length === 0 && <tr><td colSpan="3" className="p-4 text-center text-gray-400">Sin datos</td></tr>}
                </tbody>
            </table>
        </div>

        {/* Menos Vendidos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-red-50 px-6 py-4 border-b border-red-100">
                <h3 className="font-bold text-red-800 flex items-center gap-2">
                    <ArchiveBoxXMarkIcon className="h-5 w-5"/> Menos Vendidos
                </h3>
            </div>
            <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-white">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Producto</th>
                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Cant.</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Total</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {leastProducts.map((p, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-6 py-3 text-sm text-gray-900 font-medium truncate max-w-[150px]" title={p.product_name}>{p.product_name}</td>
                            <td className="px-6 py-3 text-center text-sm text-gray-600">{p.total_sold}</td>
                            <td className="px-6 py-3 text-right text-sm font-bold text-gray-400">{formatMoney(p.total_revenue)}</td>
                        </tr>
                    ))}
                    {leastProducts.length === 0 && <tr><td colSpan="3" className="p-4 text-center text-gray-400">Sin datos</td></tr>}
                </tbody>
            </table>
        </div>
      </div>

      {/* 5. MEJORES CLIENTES (VIP) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-yellow-50 px-6 py-4 border-b border-yellow-100">
            <h3 className="text-lg font-bold text-yellow-800 flex items-center gap-2">
                <StarIcon className="h-5 w-5" /> Mejores Clientes (Top Compradores)
            </h3>
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-white">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Cliente</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Contacto</th>
                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Pedidos</th>
                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase" title="Tiempo promedio entre orden creada y pagada">Pago (Hrs)</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Última Compra</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Total Gastado</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {bestClients.map((client) => (
                        <tr key={client.id} className="hover:bg-yellow-50 transition-colors">
                            <td className="px-6 py-4">
                                <div className="text-sm font-bold text-gray-900">{client.client_name}</div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-xs text-gray-500">{client.email}</div>
                                <div className="text-xs text-gray-500">{client.phone}</div>
                            </td>
                            <td className="px-6 py-4 text-center">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {client.total_orders}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-center text-sm text-gray-600">
                                {client.avg_hours_to_pay ? parseFloat(client.avg_hours_to_pay).toFixed(1) : '-'} hrs
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                                {client.last_purchase_date ? new Date(client.last_purchase_date).toLocaleDateString() : '-'}
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-bold text-green-600">
                                {formatMoney(client.total_spent)}
                            </td>
                        </tr>
                    ))}
                    {bestClients.length === 0 && (
                        <tr><td colSpan="6" className="p-8 text-center text-gray-500 italic">No hay datos de clientes para este periodo.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

    </div>
  );
};