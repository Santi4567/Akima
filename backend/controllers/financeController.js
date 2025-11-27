// controllers/financeController.js
const { getConnection } = require('../config/database');
const { checkPermission, PERMISSIONS } = require('../utils/permissions');

const getFinanceDashboard = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();

        // 1. Total Vendido (Suma de todas las órdenes no canceladas)
        const [sales] = await connection.execute(
            "SELECT SUM(total_amount) as total FROM orders WHERE status != 'cancelled'"
        );

        // 2. Total Cobrado (Suma de todos los pagos registrados)
        const [income] = await connection.execute(
            "SELECT SUM(amount) as total FROM payments"
        );

        // 3. Total Reembolsado (Suma de devoluciones completadas)
        const [refunds] = await connection.execute(
            "SELECT SUM(total_refunded) as total FROM returns WHERE status = 'completed'"
        );

        const totalSales = parseFloat(sales[0].total || 0);
        const totalIncome = parseFloat(income[0].total || 0);
        const totalRefunds = parseFloat(refunds[0].total || 0);

        res.json({
            success: true,
            data: {
                gross_sales: totalSales,           // Cuánto vendiste en papel
                net_income: totalIncome,           // Cuánto dinero entró realmente
                accounts_receivable: totalSales - totalIncome, // Cuánto te deben (Cartera vencida)
                total_refunds: totalRefunds        // Cuánto dinero devolviste
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * [PROTEGIDO] Top Productos Más Vendidos
 */
const getTopSellingProducts = async (req, res) => {
    let connection;
    try {
        if (!checkPermission(req.user.rol, PERMISSIONS.VIEW_ALL_ORDER)) {
            return res.status(403).json({ success: false, message: 'Acceso denegado.' });
        }

        connection = await getConnection();

        // Consulta: Sumar cantidad por producto, ignorando órdenes canceladas
        const sql = `
            SELECT 
                oi.product_name, 
                SUM(oi.quantity) as total_sold,
                SUM(oi.quantity * oi.unit_price) as total_revenue
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE o.status != 'cancelled'
            GROUP BY oi.product_id, oi.product_name
            ORDER BY total_sold DESC
            LIMIT 10
        `;

        const [products] = await connection.execute(sql);
        res.json({ success: true, data: products });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * [PROTEGIDO] Productos Menos Vendidos
 * (Muestra productos que se han vendido poco, pero al menos una vez)
 */
const getLeastSellingProducts = async (req, res) => {
    let connection;
    try {
        if (!checkPermission(req.user.rol, PERMISSIONS.VIEW_ALL_ORDER)) {
            return res.status(403).json({ success: false, message: 'Acceso denegado.' });
        }

        connection = await getConnection();

        const sql = `
            SELECT 
                oi.product_name, 
                SUM(oi.quantity) as total_sold
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE o.status != 'cancelled'
            GROUP BY oi.product_id, oi.product_name
            ORDER BY total_sold ASC
            LIMIT 10
        `;

        const [products] = await connection.execute(sql);
        res.json({ success: true, data: products });

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
    getLeastSellingProducts
};
