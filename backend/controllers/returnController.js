// Crear nuevo archivo: controllers/returnController.js

const { getConnection } = require('../config/database');
const { sanitizeInput, containsSQLInjection } = require('../utils/sanitizer');
const { checkPermission, PERMISSIONS } = require('../utils/permissions');

/**
 * [PROTEGIDO] Crear una nueva Devolución/Reembolso
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
        connection = await getConnection();
        await connection.beginTransaction();

        // 2. Validar que el Pedido exista y obtener el client_id
        const [orders] = await connection.execute('SELECT client_id FROM orders WHERE id = ?', [order_id]);
        if (orders.length === 0) {
            // No es necesario hacer rollback si la transacción aún no ha escrito nada
            return res.status(404).json({ success: false, message: 'El pedido original no existe.' });
        }
        const client_id = orders[0].client_id;

        // 3. Determinar el tipo de Reembolso
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
                
                // VALIDACIÓN (Caso 2 Erróneo):
                // Verificar que el item existe Y pertenece al pedido
                const [orderItems] = await connection.execute(
                    'SELECT product_id, product_name, unit_price, quantity AS ordered_quantity FROM order_items WHERE id = ? AND order_id = ?',
                    [order_item_id, order_id]
                );
                
                if (orderItems.length === 0) {
                    throw new Error(`El item de pedido (ID: ${order_item_id}) no existe o no pertenece al pedido ${order_id}.`);
                }
                const originalItem = orderItems[0];

                // VALIDACIÓN (Caso 3 Erróneo):
                // Verificar que la cantidad a devolver no sea mayor a la pedida
                if (quantity > originalItem.ordered_quantity) {
                    throw new Error(`No se puede devolver ${quantity} del producto '${originalItem.product_name}', solo se pidieron ${originalItem.ordered_quantity}.`);
                }

                // (Validación Futura: Verificar que no se haya devuelto ya este item en un reembolso anterior)

                // Guardar el item validado para el siguiente bucle
                validatedItemsToInsert.push({
                    product_id: originalItem.product_id,
                    product_name: originalItem.product_name,
                    quantity: quantity,
                    unit_price_refunded: originalItem.unit_price
                });

                // Sumar al total que se reembolsará
                final_total_refunded += (originalItem.unit_price * quantity);
            }
        }
        // (El caso 'else' es manejado por el middleware, que obliga a tener 'items' o 'total_refunded')

        // 4. Insertar el Encabezado de la Devolución (tabla 'returns')
        const [returnResult] = await connection.execute(
            'INSERT INTO returns (order_id, client_id, user_id, reason, total_refunded, status) VALUES (?, ?, ?, ?, ?, ?)',
            [order_id, client_id, user_id_from_token, sanitizedReason, final_total_refunded, status || 'completed']
        );
        const newReturnId = returnResult.insertId;

        // 5. Insertar los Items de la Devolución (tabla 'return_items'), si aplica
        if (items) {
            // Loop 2: Insertar los items que ya validamos
            for (const itemToInsert of validatedItemsToInsert) {
                await connection.execute(
                    'INSERT INTO return_items (return_id, product_id, product_name, quantity, unit_price_refunded) VALUES (?, ?, ?, ?, ?)',
                    [
                        newReturnId, 
                        itemToInsert.product_id, 
                        itemToInsert.product_name, 
                        itemToInsert.quantity, 
                        itemToInsert.unit_price_refunded
                    ]
                );
            }
        }

        // 6. Confirmar la transacción
        await connection.commit();
        
        res.status(201).json({ 
            success: true, 
            message: 'Devolución/Reembolso creado exitosamente.', 
            data: { return_id: newReturnId, total_refunded: final_total_refunded } 
        });

    } catch (error) {
        // Si algo falla (Caso 2 o 3), deshacemos todo
        if (connection) await connection.rollback();
        console.error('Error al crear devolución:', error);
        
        // Enviamos el mensaje de error específico (ej. "No se puede devolver 20...")
        res.status(400).json({ success: false, error: 'VALIDACION_NEGOCIO', message: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// ... (Aquí irían las funciones getReturns, updateReturnStatus, etc.) ...

module.exports = {
    createReturn
    // getReturns,
    // updateReturnStatus
};