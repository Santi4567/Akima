/**
 * [PROTEGIDO] Crear una nueva Devolución/Reembolso
 * Maneja tanto la devolución de productos (con 'items') 
 * como los reembolsos manuales (con 'total_refunded').
 *
 * VALIDACIONES CLAVE:
 * 1. El 'order_item_id' debe existir y pertenecer al 'order_id'.
 * 2. La 'quantity' a devolver no puede exceder la cantidad pedida original.
 * 3. La 'quantity' a devolver + la suma de devoluciones *válidas* (no canceladas)
 * anteriores no puede exceder la cantidad pedida original.
 */
// En controllers/returnController.js

const { getConnection } = require('../config/database');
const { sanitizeInput, containsSQLInjection } = require('../utils/sanitizer');

/**
 * [PROTEGIDO] Crear una nueva Devolución/Reembolso
 * Maneja tanto la devolución de productos (con 'items')
 * como los reembolsos manuales (con 'total_refunded').
 * Incluye validaciones robustas de cantidad y monto.
 */
const createReturn = async (req, res) => {
    // El middleware 'validateReturnPayload' ya validó la forma básica.
    const { order_id, reason, items, total_refunded, status } = req.body;
    const user_id_from_token = req.user.userId;

    let connection;
    let final_total_refunded = 0;
    // Guardaremos los items validados aquí
    let validatedItemsToInsert = [];

    // 1. Sanitizar la razón
    const sanitizedReason = sanitizeInput(reason);
    if (containsSQLInjection(sanitizedReason)) {
        return res.status(400).json({ success: false, error: 'INPUT_MALICIOSO', message: 'El campo "reason" contiene patrones no permitidos.' });
    }

    try {
        // 2. Iniciar Transacción
        connection = await getConnection();
        await connection.beginTransaction();

        // 3. Validar Pedido Original y Obtener Total
        const [orders] = await connection.execute(
            'SELECT client_id, total_amount FROM orders WHERE id = ?',
            [order_id]
        );
        if (orders.length === 0) {
            return res.status(404).json({ success: false, message: 'El pedido original no existe.' });
        }
        const client_id = orders[0].client_id;
        // ¡Ojo! Convertir a número para comparaciones seguras
        const original_order_total = parseFloat(orders[0].total_amount);

        // 4. Determinar Tipo de Reembolso y Validar Montos/Cantidades
        if (total_refunded !== undefined) {
            // ============================================
            // CASO A: Reembolso Manual (Ajuste)
            // ============================================
            final_total_refunded = parseFloat(total_refunded); // Asegurarse que es número

            // VALIDACIÓN 1: Monto solicitado > Total original
            if (final_total_refunded > original_order_total) {
                throw new Error(`El reembolso solicitado (${final_total_refunded.toFixed(2)}) excede el total original del pedido (${original_order_total.toFixed(2)}).`);
            }

            // VALIDACIÓN 2: Calcular reembolsos previos válidos (no cancelados)
            const [prevRefunds] = await connection.execute(
                `SELECT SUM(total_refunded) as totalPreviouslyRefunded
                 FROM returns
                 WHERE order_id = ? AND status != 'cancelled'`,
                [order_id]
            );
            const totalPreviouslyRefunded = parseFloat(prevRefunds[0].totalPreviouslyRefunded || 0);

            // VALIDACIÓN 3: (Previos + Actual) > Total Original
            // Usamos una pequeña tolerancia (epsilon) para evitar errores de punto flotante
            const epsilon = 0.001;
            if ((totalPreviouslyRefunded + final_total_refunded) > (original_order_total + epsilon)) {
                const maxAllowedRefund = original_order_total - totalPreviouslyRefunded;
                throw new Error(`El monto máximo que se puede reembolsar para este pedido es ${maxAllowedRefund.toFixed(2)} (ya se han reembolsado ${totalPreviouslyRefunded.toFixed(2)} válidos).`);
            }

        } else if (items) {
            // ============================================
            // CASO B: Devolución de Productos
            // ============================================
            for (const item of items) {
                const { order_item_id, quantity } = item;

                // VALIDACIÓN B.1: Item existe y pertenece al pedido
                const [orderItems] = await connection.execute(
                    'SELECT product_id, product_name, unit_price, quantity AS ordered_quantity FROM order_items WHERE id = ? AND order_id = ?',
                    [order_item_id, order_id]
                );
                if (orderItems.length === 0) {
                    throw new Error(`El item de pedido (ID: ${order_item_id}) no existe o no pertenece al pedido ${order_id}.`);
                }
                const originalItem = orderItems[0];
                const ordered_quantity = originalItem.ordered_quantity;

                // VALIDACIÓN B.2: Calcular devoluciones previas válidas para ESTE item
                const [prevItemReturns] = await connection.execute(
                    `SELECT SUM(ri.quantity) as totalReturned
                     FROM return_items ri
                     JOIN returns r ON ri.return_id = r.id
                     WHERE ri.order_item_id = ? AND r.status != 'cancelled'`,
                    [order_item_id]
                );
                const totalReturnedForItem = prevItemReturns[0].totalReturned || 0;

                // VALIDACIÓN B.3: (Devuelto + Actual) > Pedido Original del Item
                if ((Number(totalReturnedForItem) + Number(quantity)) > ordered_quantity) {
                    const remaining = ordered_quantity - totalReturnedForItem;
                    throw new Error(`Error en producto '${originalItem.product_name}': Se pidieron ${ordered_quantity}, ya se han devuelto ${totalReturnedForItem} (válidos). Solo puedes devolver ${remaining} más.`);
                }

                // Si todo bien, preparamos el item para insertar
                validatedItemsToInsert.push({
                    order_item_id: order_item_id,
                    product_id: originalItem.product_id,
                    product_name: originalItem.product_name,
                    quantity: quantity,
                    unit_price_refunded: parseFloat(originalItem.unit_price) // Asegurar número
                });

                // Sumar al total final del reembolso
                final_total_refunded += (parseFloat(originalItem.unit_price) * quantity);
            }
             // VALIDACIÓN B.4: (Opcional pero buena idea) El total calculado de items no debe exceder el total del pedido
             // (Considerando reembolsos manuales previos)
             const [prevManualRefunds] = await connection.execute(
                `SELECT SUM(total_refunded) as totalPreviouslyRefundedManual
                 FROM returns
                 WHERE order_id = ? AND status != 'cancelled' AND id NOT IN (SELECT DISTINCT return_id FROM return_items WHERE order_id = ?)`,
                 [order_id, order_id] // Consulta compleja, podría simplificarse si el modelo cambia
             );
             const totalPreviouslyRefundedManual = parseFloat(prevManualRefunds[0].totalPreviouslyRefundedManual || 0);
             if ((totalPreviouslyRefundedManual + final_total_refunded) > (original_order_total + epsilon)) {
                 throw new Error(`El reembolso total calculado (${final_total_refunded.toFixed(2)}) sumado a reembolsos manuales previos (${totalPreviouslyRefundedManual.toFixed(2)}) excede el total original del pedido (${original_order_total.toFixed(2)}).`);
             }
        }

        // 5. Insertar el Encabezado de la Devolución ('returns')
        const [returnResult] = await connection.execute(
            'INSERT INTO returns (order_id, client_id, user_id, reason, total_refunded, status) VALUES (?, ?, ?, ?, ?, ?)',
            [order_id, client_id, user_id_from_token, sanitizedReason, final_total_refunded, status || 'completed']
        );
        const newReturnId = returnResult.insertId;

        // 6. Insertar los Items de la Devolución ('return_items'), si aplica
        if (items) {
            for (const itemToInsert of validatedItemsToInsert) {
                await connection.execute(
                    'INSERT INTO return_items (return_id, order_item_id, product_id, product_name, quantity, unit_price_refunded) VALUES (?, ?, ?, ?, ?, ?)',
                    [
                        newReturnId,
                        itemToInsert.order_item_id,
                        itemToInsert.product_id,
                        itemToInsert.product_name,
                        itemToInsert.quantity,
                        itemToInsert.unit_price_refunded
                    ]
                );
            }
        }

        // 7. Confirmar la transacción
        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Devolución/Reembolso creado exitosamente.',
            data: { return_id: newReturnId, total_refunded: final_total_refunded }
        });

    } catch (error) {
        // Si algo falla, deshacemos todo
        if (connection) await connection.rollback();
        console.error('Error al crear devolución:', error);

        // Enviamos el mensaje de error específico
        res.status(400).json({ success: false, error: 'VALIDACION_NEGOCIO', message: error.message });
    } finally {
        if (connection) connection.release();
    }
};
/**
 * [PROTEGIDO] Actualizar el ESTADO de una Devolución/Reembolso
 * VALIDACIONES:
 * 1. No se puede modificar si ya está 'cancelled'.
 * 2. Si está 'completed', solo se puede cambiar a 'cancelled'.
 */
const updateReturnStatus = async (req, res) => {
    let connection;
    try {
        // 1. Sanitizar el ID de la URL
        const sanitizedId = sanitizeInput(req.params.id);
        if (isNaN(parseInt(sanitizedId, 10))) {
            return res.status(400).json({ success: false, message: 'El ID de la devolución debe ser un número.' });
        }
        
        // 2. Obtener el nuevo estado (ya validado por el middleware)
        const { status: newStatus } = req.body;

        connection = await getConnection();

        // =================================================================
        // 3. VALIDACIÓN AVANZADA: Verificar el estado actual
        // =================================================================
        const [currentStatusResult] = await connection.execute(
            'SELECT status FROM returns WHERE id = ?',
            [sanitizedId]
        );

        if (currentStatusResult.length === 0) {
            return res.status(404).json({ success: false, message: 'La devolución no fue encontrada.' });
        }

        const currentStatus = currentStatusResult[0].status;

        // Regla 1: Si ya está cancelada, no se toca.
        if (currentStatus === 'cancelled') {
            return res.status(409).json({ // 409 Conflict
                success: false, 
                error: 'DEVOLUCION_YA_CANCELADA',
                message: 'No se puede modificar una devolución que ya ha sido cancelada.' 
            });
        }
        
        // Regla 2: Si está completada, solo se puede cancelar.
        if (currentStatus === 'completed' && newStatus !== 'cancelled') {
            return res.status(409).json({ // 409 Conflict
                success: false, 
                error: 'DEVOLUCION_YA_COMPLETADA',
                message: 'Una devolución completada no puede modificarse, solo cancelarse.' 
            });
        }

        // 4. Ejecutar la actualización si pasó las validaciones
        const [result] = await connection.execute(
            'UPDATE returns SET status = ? WHERE id = ?',
            [newStatus, sanitizedId]
        );

        res.status(200).json({ 
            success: true, 
            message: `Estado de la devolución actualizado a: ${newStatus}` 
        });

    } catch (error) {
        console.error('Error al actualizar estado de devolución:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * [PROTEGIDO] Obtener LISTA de devoluciones
 * URL: GET /api/returns
 * Lógica: Admin/Gerente ven TODAS. Vendedores ven solo las SUYAS.
 */
const getReturns = async (req, res) => {
    let connection;
    try {
        const currentUser = req.user;
        let query;
        let queryParams = [];

        // Consulta base con JOINs para mostrar nombres en lugar de IDs
        const baseQuery = `
            SELECT 
                r.id, 
                r.order_id, 
                r.total_refunded, 
                r.reason, 
                r.status, 
                r.created_at,
                CONCAT(c.first_name, ' ', c.last_name) AS client_name,
                u.Nombre AS user_name
            FROM returns r
            INNER JOIN clients c ON r.client_id = c.id
            INNER JOIN users u ON r.user_id = u.ID
        `;

        // Definimos qué roles tienen acceso total ("Modo Dios")
        const rolesWithFullAccess = ['admin', 'gerente', 'administracion'];

        if (rolesWithFullAccess.includes(currentUser.rol)) {
            // Caso A: Ver Todo (Ordenado por fecha reciente)
            query = `${baseQuery} ORDER BY r.created_at DESC`;
        } else {
            // Caso B: Ver Solo lo Suyo (Vendedores)
            query = `${baseQuery} WHERE r.user_id = ? ORDER BY r.created_at DESC`;
            queryParams.push(currentUser.userId);
        }

        connection = await getConnection();
        const [returns] = await connection.execute(query, queryParams);
        
        res.status(200).json({ success: true, data: returns });

    } catch (error) {
        console.error('Error al obtener devoluciones:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * [PROTEGIDO] Obtener DETALLE de una devolución por ID
 * URL: GET /api/returns/:id
 * Incluye: Info general + Lista de productos devueltos (return_items)
 */
const getReturnById = async (req, res) => {
    let connection;
    try {
        const returnId = req.params.id;
        const currentUser = req.user;

        // Validar que el ID sea un número
        if (isNaN(parseInt(returnId, 10))) {
            return res.status(400).json({ success: false, message: 'ID inválido.' });
        }

        connection = await getConnection();

        // 1. Obtener el Encabezado (Info General) con JOINs
        const headerQuery = `
            SELECT 
                r.*,
                CONCAT(c.first_name, ' ', c.last_name) AS client_name,
                c.email AS client_email,
                u.Nombre AS user_name
            FROM returns r
            INNER JOIN clients c ON r.client_id = c.id
            INNER JOIN users u ON r.user_id = u.ID
            WHERE r.id = ?
        `;
        
        const [returns] = await connection.execute(headerQuery, [returnId]);

        if (returns.length === 0) {
            return res.status(404).json({ success: false, message: 'Devolución no encontrada.' });
        }

        const returnHeader = returns[0];

        // 2. SEGURIDAD: Verificar si el usuario tiene permiso de ver ESTA devolución
        const rolesWithFullAccess = ['admin', 'gerente', 'administracion'];
        
        const canViewAll = rolesWithFullAccess.includes(currentUser.rol);
        const isOwner = currentUser.userId === returnHeader.user_id;

        if (!canViewAll && !isOwner) {
            return res.status(403).json({ success: false, message: 'No tienes permiso para ver los detalles de esta devolución.' });
        }

        // 3. Obtener los Items (Productos devueltos)
        // Usamos LEFT JOIN con products para traer el SKU actual (informativo)
        const itemsQuery = `
            SELECT 
                ri.id,
                ri.product_name,
                ri.quantity,
                ri.unit_price_refunded,
                (ri.quantity * ri.unit_price_refunded) as subtotal_refunded,
                p.sku
            FROM return_items ri
            LEFT JOIN products p ON ri.product_id = p.id
            WHERE ri.return_id = ?
        `;

        const [returnItems] = await connection.execute(itemsQuery, [returnId]);

        // 4. Armar la respuesta completa
        res.status(200).json({ 
            success: true, 
            data: {
                ...returnHeader, // Info general
                items: returnItems // Array de productos
            }
        });

    } catch (error) {
        console.error('Error al obtener detalle de devolución:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};
module.exports = {
    createReturn,
    updateReturnStatus,
    getReturns,    // <--- Lista
    getReturnById  // <--- Detalle Individual

    
};