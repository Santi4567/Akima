
const { sanitizeInput } = require('../utils/sanitizer');
/**
 * Middleware para validar el payload de la creación de una nueva devolución (return).
 * Valida la estructura y se asegura de que se provean 'items' (para productos)
 * O un 'total_refunded' (para ajustes manuales).
 */
const validateReturnPayload = (req, res, next) => {
    const { order_id, reason, items, total_refunded, status } = req.body;

    // 1. Validar campos requeridos
    if (order_id === undefined || reason === undefined) {
        return res.status(400).json({ success: false, error: 'CAMPOS_REQUERIDOS', message: 'Los campos "order_id" y "reason" son obligatorios.' });
    }

    // Validar tipos de dato
    if (typeof order_id !== 'number' || !Number.isInteger(order_id)) {
        return res.status(400).json({ success: false, error: 'TIPO_INVALIDO', message: 'El campo "order_id" debe ser un número entero.' });
    }
    if (typeof reason !== 'string') {
        return res.status(400).json({ success: false, error: 'TIPO_INVALIDO', message: 'El campo "reason" debe ser de tipo texto.' });
    }

    // Validar campos opcionales si existen
    if (total_refunded !== undefined && typeof total_refunded !== 'number') {
        return res.status(400).json({ success: false, error: 'TIPO_INVALIDO', message: 'El campo "total_refunded" debe ser un número.' });
    }
    if (total_refunded !== undefined && total_refunded <= 0) {
        return res.status(400).json({ success: false, error: 'MONTO_INVALIDO', message: 'El "total_refunded" debe ser un número positivo.' });
    }
    if (status !== undefined && !['pending', 'approved', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ success: false, error: 'ESTADO_INVALIDO', message: 'El "status" no es válido.' });
    }

    // Validar campos extra
    const allowedFields = ['order_id', 'reason', 'items', 'total_refunded', 'status'];
    const receivedFields = Object.keys(req.body);
    const extraFields = receivedFields.filter(field => !allowedFields.includes(field));
    if (extraFields.length > 0) {
        return res.status(400).json({ success: false, error: 'CAMPOS_NO_PERMITIDOS', message: `Los campos ${extraFields.join(', ')} no están permitidos.` });
    }


    // 2. Lógica de Validación Excluyente (Items vs Total)
    if (items && total_refunded) {
        return res.status(400).json({ success: false, error: 'DATOS_CONFLICTIVOS', message: "No puedes proveer 'items' y un 'total_refunded' manual al mismo tiempo." });
    }
    if (items === undefined && total_refunded === undefined) {
        return res.status(400).json({ success: false, error: 'DATOS_FALTANTES', message: "Debes proveer un array de 'items' o un 'total_refunded' manual." });
    }

    // --- 3. Validación del Array 'items' (si existe) ---
    if (items) {
        if (!Array.isArray(items)) {
            return res.status(400).json({ success: false, error: 'TIPO_INVALIDO', message: 'El campo "items" debe ser un array.' });
        }
        if (items.length === 0) {
            return res.status(400).json({ success: false, error: 'ITEMS_VACIO', message: 'El array "items" no puede estar vacío.' });
        }

        // Validar cada objeto dentro de 'items'
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (typeof item !== 'object' || item === null || Array.isArray(item)) {
                return res.status(400).json({ success: false, error: 'ITEM_INVALIDO', message: `El item en la posición ${i} no es un objeto.` });
            }
            
            const { order_item_id, quantity } = item;

            if (order_item_id === undefined || quantity === undefined) {
                return res.status(400).json({ success: false, error: 'CAMPOS_ITEM_REQUERIDOS', message: `El item en la posición ${i} debe tener "order_item_id" y "quantity".` });
            }
            if (typeof order_item_id !== 'number' || !Number.isInteger(order_item_id)) {
                return res.status(400).json({ success: false, error: 'TIPO_INVALIDO', message: `El "order_item_id" en la posición ${i} debe ser un número entero.` });
            }
            if (typeof quantity !== 'number' || !Number.isInteger(quantity)) {
                return res.status(400).json({ success: false, error: 'TIPO_INVALIDO', message: `La "quantity" en la posición ${i} debe ser un número entero.` });
            }
            if (quantity <= 0) {
                return res.status(400).json({ success: false, error: 'CANTIDAD_INVALIDA', message: `La "quantity" en la posición ${i} debe ser mayor a 0.` });
            }

            const allowedItemFields = ['order_item_id', 'quantity'];
            const receivedItemFields = Object.keys(item);
            const extraItemFields = receivedItemFields.filter(field => !allowedItemFields.includes(field));
            if (extraItemFields.length > 0) {
                return res.status(400).json({ success: false, error: 'CAMPOS_ITEM_NO_PERMITIDOS', message: `El item en la posición ${i} contiene campos no permitidos.` });
            }
        }
    }

    next();
};
const validateReturnStatusPayload = (req, res, next) => {
    const { status } = req.body;

    // 1. Validar campos extra
    const allowedFields = ['status'];
    const receivedFields = Object.keys(req.body);
    const extraFields = receivedFields.filter(field => !allowedFields.includes(field));

    if (extraFields.length > 0) {
        return res.status(400).json({ success: false, error: 'CAMPOS_NO_PERMITIDOS', message: `Solo se permite el campo 'status'.` });
    }

    // 2. Validar campo requerido
    if (!status) {
        return res.status(400).json({ success: false, message: 'El campo "status" es obligatorio.' });
    }

    // 3. Validar valores permitidos
    const validStatus = ['pending', 'approved', 'completed', 'cancelled'];
    if (!validStatus.includes(status)) {
         return res.status(400).json({ 
            success: false, 
            message: `El estado '${status}' no es válido. Valores permitidos: ${validStatus.join(', ')}` 
        });
    }
    next();
};

module.exports = {
    validateReturnPayload,
    validateReturnStatusPayload
};