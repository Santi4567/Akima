// controllers/financeController.js
const { getConnection } = require('../config/database');
const { checkPermission, PERMISSIONS } = require('../utils/permissions');

//Helper para calcular rangos de fecha
const getDateRange = (period) => {
    // 1. DETECCIÓN DE FECHA ESPECÍFICA (Formato YYYY-MM-DD)
    // Expresión regular para validar formato: 2026-01-15
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (period && dateRegex.test(period)) {
        // Desglosamos manualmente para evitar problemas de zona horaria (UTC)
        const [year, month, day] = period.split('-').map(Number);

        // Creamos la fecha usando la hora local del servidor
        // Mes en JS es 0-indexado (Enero = 0)
        const start = new Date(year, month - 1, day, 0, 0, 0, 0);
        const end = new Date(year, month - 1, day, 23, 59, 59, 999);

        return { start, end };
    }

    // 2. DETECCIÓN DE PRESETS (today, week, month...)
    const end = new Date();
    const start = new Date();
    
    // Por defecto el fin es "ahora mismo" o "fin del día de hoy"
    end.setHours(23, 59, 59, 999); 

    switch (period) {
        case 'today':
            start.setHours(0, 0, 0, 0);
            break;
        case 'yesterday': // <--- Agregué este de regalo, siempre es útil
            start.setDate(start.getDate() - 1);
            start.setHours(0, 0, 0, 0);
            
            end.setDate(end.getDate() - 1); // El fin también debe ser ayer
            end.setHours(23, 59, 59, 999);
            break;
        case 'week':
            start.setDate(start.getDate() - 7);
            start.setHours(0, 0, 0, 0);
            break;
        case 'month':
            start.setDate(1); // Día 1 del mes actual
            start.setHours(0, 0, 0, 0);
            break;
        case 'year':
            start.setMonth(0, 1); // 1 de Enero del año actual
            start.setHours(0, 0, 0, 0);
            break;
        default:
            // All Time (Desde 2020)
            start.setFullYear(2020, 0, 1); 
            break;
    }

    return { start, end };
};

/**
 * [PROTEGIDO] Dashboard Financiero con Filtros
 * Query params: ?period=today | week | month | year
 */
const getFinanceDashboard = async (req, res) => {
    let connection;
    try {
        const { period } = req.query; // Recibimos el filtro desde el frontend
        const { start, end } = getDateRange(period); // Calculamos las fechas

        connection = await getConnection();

        // 1. Total Vendido (En el rango de fechas)
        const [sales] = await connection.execute(
            "SELECT SUM(total_amount) as total FROM orders WHERE status != 'cancelled' AND created_at BETWEEN ? AND ?",
            [start, end]
        );

        // 2. Total Cobrado (Pagos recibidos en ese rango)
        // OJO: Usamos payment_date si existe, si no, created_at de la tabla payments
        const [income] = await connection.execute(
            "SELECT SUM(amount) as total FROM payments WHERE payment_date BETWEEN ? AND ?",
            [start, end]
        );

        // 3. Total Reembolsado (En ese rango)
        const [refunds] = await connection.execute(
            "SELECT SUM(total_refunded) as total FROM returns WHERE status = 'completed' AND created_at BETWEEN ? AND ?",
            [start, end]
        );

        // 4. Conteo de Órdenes (Para saber volumen de trabajo)
        const [ordersCount] = await connection.execute(
            "SELECT COUNT(*) as total FROM orders WHERE status != 'cancelled' AND created_at BETWEEN ? AND ?",
            [start, end]
        );

        const totalSales = parseFloat(sales[0].total || 0);
        const totalIncome = parseFloat(income[0].total || 0);
        const totalRefunds = parseFloat(refunds[0].total || 0);
        const countOrders = parseInt(ordersCount[0].total || 0);

        res.json({
            success: true,
            period_applied: period || 'all_time',
            date_range: { start, end },
            data: {
                gross_sales: totalSales,           // Ventas generadas en este periodo
                net_income: totalIncome,           // Dinero que entró al banco en este periodo
                pending_balance: totalSales - totalIncome, // Diferencia del periodo (Cuidado: puede ser engañoso si pagan deudas viejas)
                total_refunds: totalRefunds,
                total_orders: countOrders,         // Cuántos pedidos se hicieron
                average_ticket: countOrders > 0 ? (totalSales / countOrders).toFixed(2) : 0 // Ticket promedio
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * [PROTEGIDO] Top Productos Más Vendidos (Filtrable)
 * Query params: ?period=today | month | year
 */
const getTopSellingProducts = async (req, res) => {
    let connection;
    try {
        const { period } = req.query;
        const { start, end } = getDateRange(period);

        if (!checkPermission(req.user.rol, PERMISSIONS.VIEW_ALL_ORDERS)) {
            return res.status(403).json({ success: false, message: 'Acceso denegado.' });
        }

        connection = await getConnection();

        const sql = `
            SELECT 
                oi.product_name, 
                SUM(oi.quantity) as total_sold,
                SUM(oi.quantity * oi.unit_price) as total_revenue
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE o.status != 'cancelled' 
            AND o.created_at BETWEEN ? AND ?  -- Filtro de fecha agregado
            GROUP BY oi.product_id, oi.product_name
            ORDER BY total_sold DESC
            LIMIT 10
        `;

        const [products] = await connection.execute(sql, [start, end]);
        res.json({ success: true, period: period || 'all_time', data: products });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * [NUEVO] Datos para Gráfica de Ventas
 * Devuelve las ventas agrupadas por día o mes para pintar gráficas lineales.
 * Query params: ?period=month (agrupa por días) | year (agrupa por meses)
 */
const getSalesOverTime = async (req, res) => {
    let connection;
    try {
        const { period } = req.query; // 'month' (ver días del mes) o 'year' (ver meses del año)
        const { start, end } = getDateRange(period || 'month'); // Default mes actual
        
        // Definir cómo agrupar SQL según el periodo
        let groupByFormat;
        if (period === 'year') {
            groupByFormat = '%Y-%m'; // Agrupar por Mes (2025-01, 2025-02)
        } else {
            groupByFormat = '%Y-%m-%d'; // Agrupar por Día (2025-01-01) - Default para month/week
        }

        connection = await getConnection();

        const sql = `
            SELECT 
                DATE_FORMAT(created_at, ?) as date_label,
                SUM(total_amount) as total_sales,
                COUNT(*) as order_count
            FROM orders
            WHERE status != 'cancelled'
            AND created_at BETWEEN ? AND ?
            GROUP BY date_label
            ORDER BY date_label ASC
        `;

        const [data] = await connection.execute(sql, [groupByFormat, start, end]);

        res.json({ success: true, data });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * [PROTEGIDO] Productos Menos Vendidos (Filtrable)
 * Query params: ?period=today | month | year
 */
const getLeastSellingProducts = async (req, res) => {
    let connection;
    try {
        const { period } = req.query;
        // 1. Usamos el mismo helper de fechas
        const { start, end } = getDateRange(period);

        // (Opcional si ya proteges la ruta con requireAdminRole, esto sobra, pero no estorba)
        if (!checkPermission(req.user.rol, PERMISSIONS.VIEW_ALL_ORDERS)) {
            return res.status(403).json({ success: false, message: 'Acceso denegado.' });
        }

        connection = await getConnection();

        // 2. SQL idéntico pero con filtro de fechas y orden ASC (Ascendente)
        const sql = `
            SELECT 
                oi.product_name, 
                SUM(oi.quantity) as total_sold,
                SUM(oi.quantity * oi.unit_price) as total_revenue
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE o.status != 'cancelled' 
            AND o.created_at BETWEEN ? AND ?  -- <--- Filtro de Tiempo
            GROUP BY oi.product_id, oi.product_name
            ORDER BY total_sold ASC             -- <--- ASC: De menor a mayor
            LIMIT 10
        `;

        const [products] = await connection.execute(sql, [start, end]);
        res.json({ success: true, period: period || 'all_time', data: products });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = {
    getFinanceDashboard,
    getTopSellingProducts,
     getLeastSellingProducts, 
    getSalesOverTime // <--- Nuevo export
};