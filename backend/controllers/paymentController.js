// Crear nuevo archivo: controllers/paymentController.js

const { getConnection } = require('../config/database');
const { sanitizeInput, containsSQLInjection } = require('../utils/sanitizer');

/**
 * [PROTEGIDO] Registrar un nuevo pago
 */
const createPayment = async (req, res) => {
    const { order_id, amount, method, reference, notes } = req.body;
    const currentUser = req.user; // El vendedor/cajero que recibe el dinero

    let connection;
    try {
        // 1. Sanitización
        const sanitizedRef = reference ? sanitizeInput(reference) : null;
        const sanitizedNotes = notes ? sanitizeInput(notes) : null;

        if ((sanitizedRef && containsSQLInjection(sanitizedRef)) || (sanitizedNotes && containsSQLInjection(sanitizedNotes))) {
            return res.status(400).json({ success: false, error: 'INPUT_MALICIOSO' });
        }

        connection = await getConnection();
        await connection.beginTransaction();

        // 2. Validar la Orden y Calcular Deuda
        // Traemos el total de la orden Y la suma de lo que ya han pagado
        const [orderData] = await connection.execute(
            `SELECT o.id, o.total_amount, o.status,
             COALESCE(SUM(p.amount), 0) as total_paid
             FROM orders o
             LEFT JOIN payments p ON o.id = p.order_id
             WHERE o.id = ?
             GROUP BY o.id`,
            [order_id]
        );

        if (orderData.length === 0) {
            return res.status(404).json({ success: false, message: 'La orden no existe.' });
        }

        const order = orderData[0];
        const currentDebt = parseFloat(order.total_amount) - parseFloat(order.total_paid);

        // Regla: No puedes pagar una orden cancelada
        if (order.status === 'cancelled') {
            return res.status(409).json({ success: false, message: 'No se pueden registrar pagos a una orden cancelada.' });
        }

        // Regla: Advertencia de sobrepago (Opcional: puedes bloquearlo o solo avisar)
        // Aquí lo bloqueamos para mantener integridad contable estricta
        if (amount > currentDebt) {
            // Pequeña tolerancia por decimales
            if ((amount - currentDebt) > 0.01) {
                return res.status(409).json({ 
                    success: false, 
                    error: 'SOBREPAGO', 
                    message: `El monto ingresado (${amount}) excede la deuda pendiente (${currentDebt.toFixed(2)}).` 
                });
            }
        }

        // 3. Insertar el Pago
        const [result] = await connection.execute(
            'INSERT INTO payments (order_id, user_id, amount, method, reference, notes) VALUES (?, ?, ?, ?, ?, ?)',
            [order_id, currentUser.userId, amount, method, sanitizedRef, sanitizedNotes]
        );

        // 4. (Opcional) Automatización de Estado
        // Si ya pagó todo, podríamos marcar la orden como 'completed' si ya estaba 'shipped'
        // Por ahora, solo registramos el pago.

        await connection.commit();

        res.status(201).json({ 
            success: true, 
            message: 'Pago registrado exitosamente.',
            data: { 
                payment_id: result.insertId, 
                new_balance: (currentDebt - amount).toFixed(2) 
            } 
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error al registrar pago:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * [PROTEGIDO] Ver pagos de una orden
 */
const getPaymentsByOrder = async (req, res) => {
    const { orderId } = req.params;
    let connection;
    try {
        connection = await getConnection();
        // Validar existencia de orden (y permisos si fuera necesario)
        
        const [payments] = await connection.execute(
            `SELECT p.*, u.Nombre as received_by 
             FROM payments p
             JOIN users u ON p.user_id = u.ID
             WHERE p.order_id = ? 
             ORDER BY p.payment_date DESC`,
            [orderId]
        );

        res.status(200).json({ success: true, data: payments });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};
/**
 * [PROTEGIDO] Obtener historial global de pagos
 * URL: GET /api/payments
 * Lógica:
 * - Admin/Gerente/Adminstracion: Ven TODOS los pagos.
 * - Vendedor: Ve solo los pagos que ÉL registró (su corte de caja).
 */
const getAllPayments = async (req, res) => {
    let connection;
    try {
        const currentUser = req.user;
        let query;
        let queryParams = [];

        // Consulta Base: Unimos Pagos -> Usuarios (Cobrador) -> Ordenes -> Clientes (Pagador)
        const baseQuery = `
            SELECT 
                p.id, 
                p.amount, 
                p.method, 
                p.payment_date, 
                p.reference, 
                p.notes,
                p.order_id,
                u.Nombre AS received_by_name,
                CONCAT(c.first_name, ' ', c.last_name) AS client_name
            FROM payments p
            INNER JOIN users u ON p.user_id = u.ID
            INNER JOIN orders o ON p.order_id = o.id
            INNER JOIN clients c ON o.client_id = c.id
        `;

        // Definimos roles con acceso total (Finanzas)
        const rolesWithFullAccess = ['admin', 'gerente', 'administracion'];

        if (rolesWithFullAccess.includes(currentUser.rol)) {
            // Caso A: Ver Todo (Ordenado por fecha más reciente)
            query = `${baseQuery} ORDER BY p.payment_date DESC`;
        } else {
            // Caso B: Ver solo lo que YO cobré (Mi historial)
            query = `${baseQuery} WHERE p.user_id = ? ORDER BY p.payment_date DESC`;
            queryParams.push(currentUser.userId);
        }

        connection = await getConnection();
        const [payments] = await connection.execute(query, queryParams);
        
        res.status(200).json({ success: true, data: payments });

    } catch (error) {
        console.error('Error al obtener pagos:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = { 
    createPayment, 
    getPaymentsByOrder,
    getAllPayments
};