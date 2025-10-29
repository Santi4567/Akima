const { getConnection } = require('../config/database');
const { sanitizeInput, containsSQLInjection } = require('../utils/sanitizer');

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
const createReturn = async (req, res) => {
    // El middleware 'validateReturnPayload' ya verificó la forma,
    // que 'order_id' y 'reason' existen, y que solo 'items' O 'total_refunded' está presente.
    
    const { order_id, reason, items, total_refunded, status } = req.body;
    const user_id_from_token = req.user.userId;

    let connection;
    let final_total_refunded = 0;
    // Usaremos este array para guardar los items validados antes de insertarlos
    let validatedItemsToInsert = []; 

    // 1. Sanitizar la razón (único campo de texto libre)
    const sanitizedReason = sanitizeInput(reason);
    if (containsSQLInjection(sanitizedReason)) {
        return res.status(400).json({ success: false, error: 'INPUT_MALICIOSO', message: 'El campo "reason" contiene patrones no permitidos.' });
    }

    try {
        // 2. Iniciar Transacción
        connection = await getConnection();
        await connection.beginTransaction();

        // 3. Validar que el Pedido exista y obtener el client_id
        const [orders] = await connection.execute('SELECT client_id FROM orders WHERE id = ?', [order_id]);
        if (orders.length === 0) {
            // No es necesario hacer rollback si la transacción aún no ha escrito nada
            return res.status(404).json({ success: false, message: 'El pedido original no existe.' });
        }
        const client_id = orders[0].client_id;

        // 4. Determinar el tipo de Reembolso
        if (total_refunded) {
            // ==========================================================
            // CASO A: Reembolso manual (Ajuste de precio)
            // ==========================================================
            final_total_refunded = total_refunded;
        
        } else if (items) {
            // ==========================================================
            // CASO B: Devolución de productos (Faltantes de stock, etc.)
            // ==========================================================
            
            // Loop 1: Validar todos los items y calcular el total
            for (const item of items) {
                const { order_item_id, quantity } = item;
                
                // VALIDACIÓN 1 (Caso 2 Erróneo):
                // Verificar que el item existe Y pertenece al pedido
                const [orderItems] = await connection.execute(
                    'SELECT product_id, product_name, unit_price, quantity AS ordered_quantity FROM order_items WHERE id = ? AND order_id = ?',
                    [order_item_id, order_id]
                );
                
                if (orderItems.length === 0) {
                    throw new Error(`El item de pedido (ID: ${order_item_id}) no existe o no pertenece al pedido ${order_id}.`);
                }
                const originalItem = orderItems[0];
                const ordered_quantity = originalItem.ordered_quantity;

                // VALIDACIÓN 2 (LA LÓGICA CORREGIDA):
                // Calcular devoluciones previas que NO estén canceladas
                const [prevReturns] = await connection.execute(
                    `SELECT SUM(ri.quantity) as totalReturned 
                     FROM return_items ri
                     JOIN returns r ON ri.return_id = r.id
                     WHERE ri.order_item_id = ? AND r.status != 'cancelled'`, // <<< ¡LA LÓGICA CLAVE!
                    [order_item_id]
                );
                const totalReturned = prevReturns[0].totalReturned || 0;

                // VALIDACIÓN 3 (Caso 3 Erróneo):
                // Verificar que la nueva cantidad no exceda lo que queda disponible
                if ((Number(totalReturned) + Number(quantity)) > ordered_quantity) {
                    const remaining = ordered_quantity - totalReturned;
                    throw new Error(`Error en producto '${originalItem.product_name}': Se pidieron ${ordered_quantity}, ya se han devuelto ${totalReturned} (válidos). Solo puedes devolver ${remaining} más.`);
                }

                // Si todo es válido, preparamos el item para insertarlo después
                validatedItemsToInsert.push({
                    order_item_id: order_item_id, 
                    product_id: originalItem.product_id,
                    product_name: originalItem.product_name,
                    quantity: quantity,
                    unit_price_refunded: originalItem.unit_price
                });

                // Sumar al total que se reembolsará
                final_total_refunded += (originalItem.unit_price * quantity);
            }
        }

        // 5. Insertar el Encabezado de la Devolución (tabla 'returns')
        const [returnResult] = await connection.execute(
            'INSERT INTO returns (order_id, client_id, user_id, reason, total_refunded, status) VALUES (?, ?, ?, ?, ?, ?)',
            [order_id, client_id, user_id_from_token, sanitizedReason, final_total_refunded, status || 'completed']
        );
        const newReturnId = returnResult.insertId;

        // 6. Insertar los Items de la Devolución (tabla 'return_items'), si aplica
        if (items) {
            // Loop 2: Insertar los items que ya validamos
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
        // Si algo falla (Validación 1, 2 o 3), deshacemos todo
        if (connection) await connection.rollback();
        console.error('Error al crear devolución:', error);
        
        // Enviamos el mensaje de error específico (ej. "Solo puedes devolver 6 más...")
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
module.exports = {
    createReturn,
    updateReturnStatus
    // getReturns,
    
};