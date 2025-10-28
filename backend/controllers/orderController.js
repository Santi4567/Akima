// Crear nuevo archivo: controllers/orderController.js

const { getConnection } = require('../config/database');
const { sanitizeInput, containsSQLInjection } = require('../utils/sanitizer');
const { checkPermission, PERMISSIONS } = require('../utils/permissions');

/**
 * [PROTEGIDO] Crear un nuevo Pedido
 */
const createOrder = async (req, res) => {
    const { client_id, shipping_address, notes, items } = req.body;
    const user_id_from_token = req.user.userId;
    
    let connection;
    let warnings = [];
    let total_amount = 0;

    try {
        connection = await getConnection();
        await connection.beginTransaction();

        // 1. Validar que el Vendedor (del token) y el Cliente (del body) existan
        const [user] = await connection.execute('SELECT ID FROM users WHERE ID = ?', [user_id_from_token]);
        if (user.length === 0) {
            return res.status(404).json({ success: false, message: 'El usuario vendedor no existe.' });
        }
        const [client] = await connection.execute('SELECT id FROM clients WHERE id = ?', [client_id]);
        if (client.length === 0) {
            return res.status(404).json({ success: false, message: 'El cliente especificado no existe.' });
        }

        // 2. Insertar el encabezado del pedido
        const [orderResult] = await connection.execute(
            'INSERT INTO orders (client_id, user_id, shipping_address, notes) VALUES (?, ?, ?, ?)',
            [client_id, user_id_from_token, sanitizeInput(shipping_address), sanitizeInput(notes)]
        );
        const newOrderId = orderResult.insertId;

        // 3. Bucle para procesar los items
        for (const item of items) {
            const { product_id, quantity } = item;
            
            // 3a. Consultar producto (para stock, precio y nombre)
            const [products] = await connection.execute('SELECT name, price, stock_quantity FROM products WHERE id = ?', [product_id]);
            if (products.length === 0) {
                // Si un producto no existe, deshacemos todo
                throw new Error(`El producto con ID ${product_id} no existe.`);
            }
            const product = products[0];

            // 3b. Lógica de advertencia de stock
            if (product.stock_quantity < quantity) {
                warnings.push(`Advertencia: Producto '${product.name}' (ID: ${product_id}) solo tiene ${product.stock_quantity} en stock, se pidieron ${quantity}.`);
            }

            // 3c. Insertar el item "congelando" los datos
            await connection.execute(
                'INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price) VALUES (?, ?, ?, ?, ?)',
                [newOrderId, product_id, product.name, quantity, product.price]
            );
            
            // 3d. Calcular el total
            total_amount += (product.price * quantity);
        }

        // 4. Actualizar el pedido con el total final
        await connection.execute('UPDATE orders SET total_amount = ? WHERE id = ?', [total_amount, newOrderId]);

        // 5. Confirmar la transacción
        await connection.commit();
        
        res.status(201).json({
            success: true,
            message: 'Pedido creado exitosamente.',
            data: { order_id: newOrderId, total_amount: total_amount },
            warnings: warnings
        });

    } catch (error) {
        if (connection) await connection.rollback(); // Deshacer todo si algo falló
        console.error('Error al crear pedido:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR', message: error.message });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * [PROTEGIDO] Obtener Pedidos (Unificado)
 */
const getOrders = async (req, res) => {
    let connection;
    try {
        const currentUser = req.user;
        let query;
        let queryParams = [];

        if (checkPermission(currentUser.rol, PERMISSIONS.VIEW_ALL_ORDERS)) {
            query = 'SELECT * FROM orders ORDER BY created_at DESC';
        } else if (checkPermission(currentUser.rol, PERMISSIONS.VIEW_OWN_ORDERS)){
            query = 'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC';
            queryParams.push(currentUser.userId);
        }


        connection = await getConnection();
        const [orders] = await connection.execute(query, queryParams);
        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        console.error('Error al obtener pedidos:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * [PROTEGIDO] Editar Estado de un Pedido (Almacén)
 */
const updateOrderStatus = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const { status } = req.body; // status ya fue validado por el middleware

        connection = await getConnection();
        const [result] = await connection.execute(
            'UPDATE orders SET status = ? WHERE id = ?',
            [status, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Pedido no encontrado.' });
        }
        res.status(200).json({ success: true, message: `Pedido actualizado a estado: ${status}` });
    } catch (error) {
        console.error('Error al actualizar estado de pedido:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * [PROTEGIDO] Cancelar un Pedido (Admin/Gerente)
 */
const cancelOrder = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await getConnection();
        
        const [result] = await connection.execute(
            "UPDATE orders SET status = 'cancelled' WHERE id = ? AND status IN ('pending', 'processing')",
            [id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Pedido no encontrado o ya no se puede cancelar.' });
        }
        res.status(200).json({ success: true, message: 'Pedido cancelado exitosamente.' });
    } catch (error) {
        console.error('Error al cancelar pedido:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

// NOTA: updateOrderContent (Punto 2) es muy complejo.
// Requeriría una transacción para borrar items, añadir nuevos y recalcular el total.
// Lo omito por ahora para centrarnos en el flujo principal, como acordamos.

module.exports = {
    createOrder,
    getOrders,
    updateOrderStatus,
    cancelOrder
    // getOrderById (necesitaríamos implementar este)
};