// Crear nuevo archivo: controllers/orderController.js

const { getConnection } = require('../config/database');
const { sanitizeInput, containsSQLInjection } = require('../utils/sanitizer');
const { checkPermission, PERMISSIONS } = require('../utils/permissions');

const recalculateOrderTotal = async (connection, orderId) => {
    // Sumamos (cantidad * precio) de todos los items de esa orden
    const [result] = await connection.execute(
        'SELECT SUM(quantity * unit_price) as newTotal FROM order_items WHERE order_id = ?',
        [orderId]
    );
    
    // Si no hay items, el total es 0
    const newTotal = result[0].newTotal || 0;
    
    // Actualizamos la tabla padre 'orders'
    await connection.execute('UPDATE orders SET total_amount = ? WHERE id = ?', [newTotal, orderId]);
    
    return newTotal;
};


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

        // 1. Validaciones iniciales (Usuario y Cliente)
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
            
            // 3a. Consultar producto
            const [products] = await connection.execute('SELECT name, price, stock_quantity FROM products WHERE id = ?', [product_id]);
            if (products.length === 0) {
                throw new Error(`El producto con ID ${product_id} no existe.`);
            }
            const product = products[0];

            // 3b. Lógica de advertencia (Informativo)
            if (product.stock_quantity < quantity) {
                warnings.push(`Advertencia: Producto '${product.name}' (ID: ${product_id}) solo tiene ${product.stock_quantity} en stock, se pidieron ${quantity}.`);
            }

            // 3c. Insertar el item en el historial
            await connection.execute(
                'INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price) VALUES (?, ?, ?, ?, ?)',
                [newOrderId, product_id, product.name, quantity, product.price]
            );
            
            // =================================================================
            // 3d. [NUEVO] ACTUALIZAR EL STOCK (RESTAR INVENTARIO)
            // =================================================================
            await connection.execute(
                'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
                [quantity, product_id]
            );
            
            // 3e. Calcular el total
            total_amount += (product.price * quantity);
        }

        // 4. Actualizar el total del pedido
        await connection.execute('UPDATE orders SET total_amount = ? WHERE id = ?', [total_amount, newOrderId]);

        // 5. Confirmar transacción
        await connection.commit();
        
        res.status(201).json({
            success: true,
            message: 'Pedido creado exitosamente.',
            data: { order_id: newOrderId, total_amount: total_amount },
            warnings: warnings
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error al crear pedido:', error);
        
        // Manejo especial para error de "Fuera de rango" (Si el stock es UNSIGNED y baja de 0)
        if (error.code === '22003' || error.message.includes('Out of range')) {
             return res.status(409).json({ 
                 success: false, 
                 error: 'STOCK_INSUFICIENTE', 
                 message: 'No se pudo procesar la orden porque el stock no puede ser negativo. Ajusta tu inventario.' 
             });
        }

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

        // 1. Definimos la consulta base con los JOINs necesarios
        // Seleccionamos todo de la orden (o.*) y agregamos los nombres
        const baseQuery = `
            SELECT 
                o.*,
                CONCAT(c.first_name, ' ', c.last_name) AS client_name,
                seller.Nombre AS user_name,          -- El Vendedor (user_id)
                processor.Nombre AS processor_name   -- El Almacenista (processing_id)
            FROM orders o
            INNER JOIN clients c ON o.client_id = c.id
            INNER JOIN users seller ON o.user_id = seller.ID  -- Primer join con users (Vendedor)
            LEFT JOIN users processor ON o.processing_id = processor.ID -- Segundo join (Almacén)
        `;

        // 2. Lógica de Permisos para filtrar los resultados
        if (checkPermission(currentUser.rol, PERMISSIONS.VIEW_ALL_ORDERS)) {
            // Caso A: Gerente/Admin/Almacén ve TODOS los pedidos
            query = `${baseQuery} ORDER BY o.created_at DESC`;
        } else {
            // Caso B: Vendedor ve SOLO sus pedidos (asumimos VIEW_OWN_ORDERS)
            query = `${baseQuery} WHERE o.user_id = ? ORDER BY o.created_at DESC`;
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
 * Validaciones de flujo:
 * 1. Un pedido 'completed' está bloqueado y no cambia.
 * 2. Un pedido 'shipped' no puede regresar a 'processing' o 'pending'.
 * (ACTUALIZADO: Registra quién inició el procesamiento)
 */
const updateOrderStatus = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const { status: newStatus } = req.body;
        const currentUser = req.user; // <--- Necesitamos saber quién es

        connection = await getConnection();

        // 1. Obtener estado actual
        const [orders] = await connection.execute('SELECT status FROM orders WHERE id = ?', [id]);

        if (orders.length === 0) {
            return res.status(404).json({ success: false, message: 'Pedido no encontrado.' });
        }

        const currentStatus = orders[0].status;

        // 2. Validaciones de flujo (Igual que antes)
        if (currentStatus === 'completed') {
            return res.status(409).json({ success: false, error: 'ESTADO_INMUTABLE', message: 'El pedido ya está completado.' });
        }
        if (currentStatus === 'cancelled') {
             return res.status(409).json({ success: false, error: 'PEDIDO_CANCELADO', message: 'El pedido está cancelado.' });
        }
        if (currentStatus === 'shipped' && (newStatus === 'processing' || newStatus === 'pending')) {
            return res.status(409).json({ success: false, error: 'RETROCESO_NO_PERMITIDO', message: 'No se puede regresar el estado.' });
        }

        // =================================================================
        // 3. LÓGICA DE ASIGNACIÓN DE RESPONSABLE (processing_id)
        // =================================================================
        let sql;
        let params;

        // Si el pedido "empieza" a procesarse (pasa de pending -> processing)
        if (currentStatus === 'pending' && newStatus === 'processing') {
            sql = 'UPDATE orders SET status = ?, processing_id = ? WHERE id = ?';
            params = [newStatus, currentUser.userId, id];
        } else {
            // Cualquier otro cambio de estado (shipped, completed, etc.)
            // Solo actualizamos el estado, respetando quién lo procesó originalmente
            sql = 'UPDATE orders SET status = ? WHERE id = ?';
            params = [newStatus, id];
        }

        // 4. Ejecutar
        await connection.execute(sql, params);

        res.status(200).json({ success: true, message: `Pedido actualizado a estado: ${newStatus}` });

    } catch (error) {
        console.error('Error al actualizar estado:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * [PROTEGIDO] Cancelar un Pedido (Admin/Gerente)
 * Reglas: Solo se puede cancelar si está 'pending' o 'processing'.
 * Si ya se envió, se debe usar el flujo de Devoluciones.
 */
const cancelOrder = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await getConnection();

        // 1. OBTENER EL ESTADO ACTUAL
        const [orders] = await connection.execute('SELECT status FROM orders WHERE id = ?', [id]);

        if (orders.length === 0) {
            return res.status(404).json({ success: false, message: 'Pedido no encontrado.' });
        }

        const currentStatus = orders[0].status;

        // 2. VALIDACIONES DE LÓGICA
        
        // Caso A: Ya está cancelado
        if (currentStatus === 'cancelled') {
            return res.status(409).json({ 
                success: false, 
                error: 'YA_CANCELADO',
                message: 'El pedido ya ha sido cancelado anteriormente.' 
            });
        }

        // Caso B: Ya salió del almacén (Shipped o Completed)
        if (currentStatus === 'shipped' || currentStatus === 'completed') {
            return res.status(409).json({ 
                success: false, 
                error: 'CANCELACION_NO_PERMITIDA',
                message: `No se puede cancelar un pedido con estado '${currentStatus}'. Debes gestionar una Devolución (Return).` 
            });
        }

        // 3. EJECUTAR CANCELACIÓN (Solo si es pending o processing)
        // Nota: Aquí es donde, idealmente, también sumarías el stock de vuelta (restock).
        // Por ahora, solo cambiamos el estado.
        
        await connection.execute(
            "UPDATE orders SET status = 'cancelled' WHERE id = ?",
            [id]
        );

        res.status(200).json({ success: true, message: 'Pedido cancelado exitosamente.' });

    } catch (error) {
        console.error('Error al cancelar pedido:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};


//=================================================
// para modificar,eliminar y ver items de un pedido
//=================================================

/**
 * [PROTEGIDO] Obtener los productos (items) de una orden específica
 * URL: GET /api/orders/:id/items
 */
const getOrderItems = async (req, res) => {
    let connection;
    try {
        const orderId = req.params.id;
        const currentUser = req.user;

        // Validar ID
        if (isNaN(parseInt(orderId, 10))) {
            return res.status(400).json({ success: false, message: 'El ID de la orden debe ser un número.' });
        }

        connection = await getConnection();

        // 1. SEGURIDAD: Verificar que la orden existe y quién es el dueño
        const [orderCheck] = await connection.execute('SELECT user_id FROM orders WHERE id = ?', [orderId]);
        
        if (orderCheck.length === 0) {
            return res.status(404).json({ success: false, message: 'El pedido no existe.' });
        }

        const orderOwnerId = orderCheck[0].user_id;

        // 2. VALIDACIÓN DE PERMISOS
        // ¿Tiene permiso de ver TODO?
        const canViewAll = checkPermission(currentUser.rol, PERMISSIONS.VIEW_ALL_ORDERS);
        // ¿Es el dueño de la orden?
        const isOwner = currentUser.userId === orderOwnerId;

        // Si no es admin/gerente Y no es el dueño, bloquear acceso.
        if (!canViewAll && !isOwner) {
            return res.status(403).json({ success: false, message: 'No tienes permiso para ver los detalles de este pedido.' });
        }

        // 3. OBTENER LOS PRODUCTOS
        // Opcional: Hacemos un LEFT JOIN con 'products' por si quieres mostrar el SKU actual o la imagen,
        // pero respetamos los datos históricos (precio y nombre) guardados en order_items.
        const sql = `
            SELECT 
                oi.id,
                oi.order_id,
                oi.product_id,
                oi.product_name,  -- Nombre histórico
                oi.quantity,
                oi.unit_price,    -- Precio histórico
                (oi.quantity * oi.unit_price) AS subtotal,
                p.sku,            -- SKU actual (informativo)
                p.stock_quantity  -- Stock actual (informativo)
            FROM order_items oi
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        `;

        const [items] = await connection.execute(sql, [orderId]);

        res.status(200).json({ success: true, data: items });

    } catch (error) {
        console.error('Error al obtener items del pedido:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * [PROTEGIDO] Agregar Item a Orden (o sumar cantidad si ya existe)
 * Solo si status = 'pending'. Resta stock.
 */
const addOrderItem = async (req, res) => {
    const { id: orderId } = req.params; // ID de la Orden
    const { product_id, quantity } = req.body;
    const currentUser = req.user;
    
    let connection;
    try {
        connection = await getConnection();
        await connection.beginTransaction();

        // 1. Verificar Orden (Existencia, Dueño y Estado)
        const [orders] = await connection.execute('SELECT user_id, status FROM orders WHERE id = ?', [orderId]);
        if (orders.length === 0) return res.status(404).json({ success: false, message: 'Pedido no encontrado.' });
        
        const order = orders[0];
        
        // Permisos: Dueño o Admin
        if (order.user_id !== currentUser.userId && !checkPermission(currentUser.rol, PERMISSIONS.VIEW_ALL_ORDERS)) {
            return res.status(403).json({ success: false, message: 'No tienes permiso para editar este pedido.' });
        }
        // Estado: Solo Pending
        if (order.status !== 'pending') {
            return res.status(409).json({ success: false, message: `No se pueden agregar items a un pedido en estado '${order.status}'.` });
        }

        // 2. Verificar Producto y Obtener Datos
        const [products] = await connection.execute('SELECT name, price, stock_quantity FROM products WHERE id = ?', [product_id]);
        if (products.length === 0) return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
        const product = products[0];

        // 3. Verificar si el item ya existe en la orden
        const [existingItem] = await connection.execute(
            'SELECT id, quantity FROM order_items WHERE order_id = ? AND product_id = ?',
            [orderId, product_id]
        );

        if (existingItem.length > 0) {
            // CASO A: El producto YA ESTÁ en la orden -> Sumamos cantidad
            const itemId = existingItem[0].id;
            await connection.execute(
                'UPDATE order_items SET quantity = quantity + ? WHERE id = ?',
                [quantity, itemId]
            );
        } else {
            // CASO B: El producto NO ESTÁ -> Creamos fila nueva
            await connection.execute(
                'INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price) VALUES (?, ?, ?, ?, ?)',
                [orderId, product_id, product.name, quantity, product.price]
            );
        }

        // 4. ACTUALIZAR STOCK (Restar)
        await connection.execute(
            'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
            [quantity, product_id]
        );

        // 5. RECALCULAR TOTAL DE LA ORDEN
        const newTotal = await recalculateOrderTotal(connection, orderId);

        await connection.commit();
        res.status(200).json({ success: true, message: 'Item agregado/actualizado correctamente.', data: { new_order_total: newTotal } });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error al agregar item:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR', message: error.message });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * [PROTEGIDO] Eliminar Item de Orden
 * Solo si status = 'pending'. Devuelve stock.
 */
const removeOrderItem = async (req, res) => {
    const { id: orderId, itemId } = req.params; // itemId es el ID de la tabla order_items
    const currentUser = req.user;

    let connection;
    try {
        connection = await getConnection();
        await connection.beginTransaction();

        // 1. Verificar Orden (Existencia, Dueño y Estado)
        const [orders] = await connection.execute('SELECT user_id, status FROM orders WHERE id = ?', [orderId]);
        if (orders.length === 0) return res.status(404).json({ success: false, message: 'Pedido no encontrado.' });
        const order = orders[0];

        if (order.user_id !== currentUser.userId && !checkPermission(currentUser.rol, PERMISSIONS.VIEW_ALL_ORDERS)) {
            return res.status(403).json({ success: false, message: 'No tienes permiso para editar este pedido.' });
        }
        if (order.status !== 'pending') {
            return res.status(409).json({ success: false, message: `No se pueden eliminar items de un pedido en estado '${order.status}'.` });
        }

        // 2. Obtener datos del item a borrar (Necesitamos saber cuánto devolver al stock)
        const [items] = await connection.execute('SELECT product_id, quantity FROM order_items WHERE id = ? AND order_id = ?', [itemId, orderId]);
        if (items.length === 0) {
            return res.status(404).json({ success: false, message: 'El item no existe en este pedido.' });
        }
        const itemToDelete = items[0];

        // 3. Eliminar el item
        await connection.execute('DELETE FROM order_items WHERE id = ?', [itemId]);

        // 4. DEVOLVER STOCK (Sumar)
        // (Solo si el producto aún existe en el catálogo, si product_id no es null)
        if (itemToDelete.product_id) {
            await connection.execute(
                'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
                [itemToDelete.quantity, itemToDelete.product_id]
            );
        }

        // 5. RECALCULAR TOTAL
        const newTotal = await recalculateOrderTotal(connection, orderId);

        await connection.commit();
        res.status(200).json({ success: true, message: 'Item eliminado y stock restaurado.', data: { new_order_total: newTotal } });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error al eliminar item:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * [PROTEGIDO] Buscar Órdenes
 * Busca por: ID de orden, Nombre del Cliente o Apellido.
 * Respeta la visibilidad por rol (Own vs All).
 */
const searchOrders = async (req, res) => {
    let connection;
    try {
        const { q } = req.query;
        const currentUser = req.user;

        if (!q) {
            return res.status(400).json({ success: false, message: 'Ingresa un término de búsqueda "q".' });
        }

        const searchTerm = sanitizeInput(q);
        if (containsSQLInjection(searchTerm)) {
            return res.status(400).json({ success: false, error: 'INPUT_MALICIOSO' });
        }

        connection = await getConnection();

        // 1. Consulta Base (Igual que getOrders)
        const baseQuery = `
            SELECT 
                o.*,
                CONCAT(c.first_name, ' ', c.last_name) AS client_name,
                u.Nombre AS user_name
            FROM orders o
            INNER JOIN clients c ON o.client_id = c.id
            INNER JOIN users u ON o.user_id = u.ID
        `;

        // 2. Filtros de Búsqueda (ID exacto o Nombre parcial)
        const searchCondition = `(o.id LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ?)`;
        const searchParams = [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`];

        let finalQuery;
        let finalParams = [...searchParams];

        // 3. Aplicar Seguridad por Rol
        const rolesWithFullAccess = ['admin', 'gerente', 'administracion'];

        if (rolesWithFullAccess.includes(currentUser.rol)) {
            // Admin: Busca en todo
            finalQuery = `${baseQuery} WHERE ${searchCondition} ORDER BY o.created_at DESC LIMIT 20`;
        } else {
            // Vendedor: Busca solo en SU historial + La condición de búsqueda
            finalQuery = `${baseQuery} WHERE o.user_id = ? AND ${searchCondition} ORDER BY o.created_at DESC LIMIT 20`;
            // El user_id va PRIMERO en los parámetros
            finalParams.unshift(currentUser.userId);
        }

        const [orders] = await connection.execute(finalQuery, finalParams);
        res.status(200).json({ success: true, data: orders });

    } catch (error) {
        console.error('Error en buscador de órdenes:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = {
    createOrder,
    getOrders,
    updateOrderStatus,
    cancelOrder,
    getOrderItems,
    addOrderItem,   
    removeOrderItem,
    searchOrders
    
};