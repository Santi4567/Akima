import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom'; 
import { 
  CurrencyDollarIcon, 
  CreditCardIcon, 
  BanknotesIcon, 
  ShoppingBagIcon, 
  TicketIcon, 
  ArrowPathIcon,
  ArchiveBoxXMarkIcon,
  StarIcon,
  CalendarDaysIcon, 
  GlobeAmericasIcon,
  ClockIcon, 
  ArrowTrendingUpIcon,
  BuildingLibraryIcon 
} from '@heroicons/react/24/solid';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts';
import { Notification } from '../Notification';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const FinanceDashboard = () => {
  const [period, setPeriod] = useState('month'); 
  const [customDate, setCustomDate] = useState(''); 
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ type: '', message: '' });

  // Datos
  const [metrics, setMetrics] = useState(null); 
  const [mixedChartData, setMixedChartData] = useState([]); 
  const [topProducts, setTopProducts] = useState([]); 
  const [leastProducts, setLeastProducts] = useState([]); 
  const [bestClients, setBestClients] = useState([]); 
  
  const [debts, setDebts] = useState([]); 
  const [income, setIncome] = useState([]); 

  // --- CARGA Y PROCESAMIENTO DE DATOS ---
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = { credentials: 'include' };
      const queryParam = `?period=${period}`;

      const responses = await Promise.all([
        fetch(`${API_URL}/api/finance/dashboard${queryParam}`, headers),
        fetch(`${API_URL}/api/finance/reports/sales-chart${queryParam}`, headers),
        fetch(`${API_URL}/api/finance/reports/top-products${queryParam}`, headers),
        fetch(`${API_URL}/api/finance/reports/least-sold${queryParam}`, headers),
        fetch(`${API_URL}/api/clients/reports/best${queryParam}`, headers),
        fetch(`${API_URL}/api/finance/reports/debts${queryParam}`, headers),
        fetch(`${API_URL}/api/finance/reports/income${queryParam}`, headers)
      ]);

      const data = await Promise.all(responses.map(res => res.json()));
      const [dash, chart, top, least, clients, debtsData, incomeData] = data;

      if (dash.success) setMetrics(dash.data);
      if (top.success) setTopProducts(top.data);
      if (least.success) setLeastProducts(least.data);
      if (clients.success) setBestClients(clients.data);
      
      let rawDebts = [];
      let rawIncome = [];

      if (debtsData.success) {
        setDebts(debtsData.data);
        rawDebts = debtsData.data;
      }
      if (incomeData.success) {
        setIncome(incomeData.data);
        rawIncome = incomeData.data;
      }

      // --- FUSIÓN DE DATOS PARA LA GRÁFICA ---
      if (chart.success) {
        const baseChart = chart.data || [];
        const mergedMap = {};

        // 1. Inicializar con ventas (Verde)
        baseChart.forEach(item => {
            if (!item.date_label) return; 
            const dateKey = item.date_label.substring(0, 10);
            mergedMap[dateKey] = {
                date: dateKey,
                sales: parseFloat(item.total_sales || 0),
                income: 0,
                debt: 0
            };
        });

        // 2. Sumar Ingresos (Azul) - Usando payment_date
        rawIncome.forEach(inc => {
            if (!inc.payment_date) return; 
            const dateKey = inc.payment_date.substring(0, 10);
            if (!mergedMap[dateKey]) {
                mergedMap[dateKey] = { date: dateKey, sales: 0, income: 0, debt: 0 };
            }
            mergedMap[dateKey].income += parseFloat(inc.amount || 0);
        });

        // 3. Sumar Deudas (Naranja) - Usando order_date
        rawDebts.forEach(d => {
            if (!d.order_date) return; // Validación clave para evitar el error de substring
            const dateKey = d.order_date.substring(0, 10); 
            if (!mergedMap[dateKey]) {
                mergedMap[dateKey] = { date: dateKey, sales: 0, income: 0, debt: 0 };
            }
            mergedMap[dateKey].debt += parseFloat(d.pending_balance || 0);
        });

        // Ordenar por fecha cronológica
        const finalChartData = Object.values(mergedMap).sort((a, b) => new Date(a.date) - new Date(b.date));
        setMixedChartData(finalChartData);
      }

    } catch (error) {
      console.error(error);
      setNotification({ type: 'error', message: 'Error cargando datos.' });
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleDateChange = (e) => {
    const date = e.target.value;
    setCustomDate(date);
    if(date) setPeriod(date); 
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount || 0);
  };

  const renderPaymentMethod = (method) => {
    switch(method) {
        case 'cash': return <span className="flex items-center gap-1 text-green-700 font-medium"><BanknotesIcon className="h-4 w-4"/> Efectivo</span>;
        case 'card': return <span className="flex items-center gap-1 text-blue-700 font-medium"><CreditCardIcon className="h-4 w-4"/> Tarjeta</span>;
        case 'transfer': return <span className="flex items-center gap-1 text-purple-700 font-medium"><BuildingLibraryIcon className="h-4 w-4"/> Transf.</span>;
        default: return <span className="capitalize text-gray-600">{method}</span>;
    }
  };

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

      {/* HEADER */}
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
            {[
                { id: 'today', label: 'Hoy' },
                { id: 'week', label: 'Semana' },
                { id: 'month', label: 'Mes' },
                { id: 'year', label: 'Año' },
                { id: 'all_time', label: 'Todo', icon: GlobeAmericasIcon }
            ].map((btn) => (
                <button
                    key={btn.id}
                    onClick={() => { setPeriod(btn.id); setCustomDate(''); }}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-1 ${
                        period === btn.id ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    {btn.icon && <btn.icon className="h-4 w-4"/>}
                    {btn.label}
                </button>
            ))}
            <div className="w-px h-6 bg-gray-300 mx-1"></div>
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

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Ventas Brutas" value={formatMoney(metrics?.gross_sales)} icon={ShoppingBagIcon} color="bg-blue-500" subValue="Total facturado" />
        <KpiCard title="Ingreso Neto (Cobrado)" value={formatMoney(metrics?.net_income)} icon={CurrencyDollarIcon} color="bg-green-600" subValue="Dinero real en caja" />
        <KpiCard title="Por Cobrar (Deuda)" value={formatMoney(metrics?.pending_balance)} icon={CreditCardIcon} color="bg-orange-400" subValue="Crédito a clientes" />
        <KpiCard title="Ticket Promedio" value={formatMoney(metrics?.average_ticket)} icon={TicketIcon} color="bg-purple-500" subValue={`${metrics?.total_orders || 0} órdenes`} />
      </div>

      {/* GRÁFICA COMPARATIVA */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <ArrowPathIcon className="h-5 w-5 text-gray-400"/> Flujo de Dinero: Ventas vs Cobros vs Deuda
        </h3>
        <div className="h-[350px] w-full">
            {mixedChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mixedChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#16a34a" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis 
                            dataKey="date" 
                            tick={{fontSize: 12}} 
                            tickFormatter={(value) => {
                                const date = new Date(value);
                                if (period === 'year' || period === 'all_time') return date.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' });
                                return date.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' });
                            }}
                        />
                        <YAxis tickFormatter={(value) => `$${value/1000}k`} />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <Tooltip formatter={(value) => formatMoney(value)} labelStyle={{ color: '#374151' }} />
                        <Legend verticalAlign="top" height={36}/>
                        <Area type="monotone" dataKey="sales" name="Ventas (Facturado)" stroke="#16a34a" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} />
                        <Area type="monotone" dataKey="income" name="Cobros (Dinero Real)" stroke="#2563eb" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
                        <Area type="monotone" dataKey="debt" name="Deuda Generada" stroke="#f97316" fill="none" strokeWidth={2} strokeDasharray="5 5" />
                    </AreaChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex items-center justify-center text-gray-400 italic bg-gray-50 rounded-lg border border-dashed">
                    No hay suficientes datos para graficar en este periodo.
                </div>
            )}
        </div>
      </div>

      {/* TABLAS DE PRODUCTOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Productos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-green-50 px-6 py-4 border-b border-green-100">
                <h3 className="font-bold text-green-800 flex items-center gap-2"><ShoppingBagIcon className="h-5 w-5"/> Más Vendidos</h3>
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
                            <td className="px-6 py-3 text-sm text-gray-900 truncate max-w-[150px]" title={p.product_name}>{p.product_name}</td>
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
                <h3 className="font-bold text-red-800 flex items-center gap-2"><ArchiveBoxXMarkIcon className="h-5 w-5"/> Menos Vendidos</h3>
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
                            <td className="px-6 py-3 text-sm text-gray-900 truncate max-w-[150px]" title={p.product_name}>{p.product_name}</td>
                            <td className="px-6 py-3 text-center text-sm text-gray-600">{p.total_sold}</td>
                            <td className="px-6 py-3 text-right text-sm font-bold text-gray-400">{formatMoney(p.total_revenue)}</td>
                        </tr>
                    ))}
                    {leastProducts.length === 0 && <tr><td colSpan="3" className="p-4 text-center text-gray-400">Sin datos</td></tr>}
                </tbody>
            </table>
        </div>
      </div>

      {/* MEJORES CLIENTES */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-yellow-50 px-6 py-4 border-b border-yellow-100">
            <h3 className="text-lg font-bold text-yellow-800 flex items-center gap-2"><StarIcon className="h-5 w-5" /> Mejores Clientes</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-white">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Cliente</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Contacto</th>
                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Pedidos</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Gastado</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {bestClients.map((client) => (
                        <tr key={client.id} className="hover:bg-yellow-50">
                            <td className="px-6 py-4 text-sm font-bold text-gray-900">{client.client_name}</td>
                            <td className="px-6 py-4 text-xs text-gray-500">{client.email}<br/>{client.phone}</td>
                            <td className="px-6 py-4 text-center"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{client.total_orders}</span></td>
                            <td className="px-6 py-4 text-right text-sm font-bold text-green-600">{formatMoney(client.total_spent)}</td>
                        </tr>
                    ))}
                    {bestClients.length === 0 && <tr><td colSpan="4" className="p-6 text-center text-gray-500 italic">Sin datos.</td></tr>}
                </tbody>
            </table>
        </div>
      </div>

      {/* --- SECCIÓN FINAL: DEUDAS Y ENTRADAS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* TABLA DE DEUDAS */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-orange-50 px-6 py-4 border-b border-orange-100">
                <h3 className="font-bold text-orange-800 flex items-center gap-2"><ClockIcon className="h-5 w-5"/> Cuentas por Cobrar (Deuda)</h3>
            </div>
            <div className="overflow-x-auto max-h-96">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-white sticky top-0">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Orden</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Cliente</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Pendiente</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {debts.map((d, idx) => (
                            <tr key={idx} className="hover:bg-orange-50">
                                <td className="px-6 py-3 text-sm font-medium text-gray-900">
                                    <Link to="/ordenes" className="hover:text-blue-600 hover:underline">#{d.order_id}</Link> 
                                    <br/><span className="text-xs text-gray-400">{d.order_date ? new Date(d.order_date).toLocaleDateString() : '-'}</span>
                                </td>
                                <td className="px-6 py-3 text-sm text-gray-600">{d.client_name}</td>
                                <td className="px-6 py-3 text-right text-sm font-bold text-red-600">{formatMoney(d.pending_balance)}</td>
                            </tr>
                        ))}
                        {debts.length === 0 && <tr><td colSpan="3" className="p-6 text-center text-gray-400">¡Felicidades! No hay deudas pendientes.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>

        {/* TABLA DE ENTRADAS */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
                <h3 className="font-bold text-blue-800 flex items-center gap-2"><ArrowTrendingUpIcon className="h-5 w-5"/> Entradas de Dinero (Pagos)</h3>
            </div>
            <div className="overflow-x-auto max-h-96">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-white sticky top-0">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Fecha</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Ref / Orden</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Método</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Monto</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {income.map((inc, idx) => (
                            <tr key={idx} className="hover:bg-blue-50">
                                <td className="px-6 py-3 text-sm text-gray-500">{inc.payment_date ? new Date(inc.payment_date).toLocaleDateString() : '-'}</td>
                                <td className="px-6 py-3 text-sm text-gray-900 font-medium">
                                    <Link to="/ordenes" className="hover:text-blue-600 hover:underline">#{inc.order_id}</Link>
                                    <div className="text-xs text-gray-400">{inc.client_name}</div>
                                </td>
                                <td className="px-6 py-3 text-sm text-gray-600">{renderPaymentMethod(inc.method)}</td>
                                <td className="px-6 py-3 text-right text-sm font-bold text-green-600">+{formatMoney(inc.amount)}</td>
                            </tr>
                        ))}
                        {income.length === 0 && <tr><td colSpan="4" className="p-6 text-center text-gray-400">Sin ingresos registrados en este periodo.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>

      </div>
    </div>
  );
};