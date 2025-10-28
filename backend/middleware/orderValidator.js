/**
 * Middleware para validar el payload de la creación de una nueva orden.
 * Verifica la estructura del JSON, los tipos de datos y las reglas del array 'items'.
 */
const validateOrderPayload = (req, res, next) => {
    const { client_id, shipping_address, notes, items } = req.body;

    // --- 1. Validación de Campos de Primer Nivel (El Pedido) ---
    if (client_id === undefined || items === undefined) {
        return res.status(400).json({ success: false, error: 'CAMPOS_REQUERIDOS', message: 'Los campos "client_id" y "items" son obligatorios.' });
    }
    if (typeof client_id !== 'number' || !Number.isInteger(client_id)) {
        return res.status(400).json({ success: false, error: 'TIPO_INVALIDO', message: 'El campo "client_id" debe ser un número entero.' });
    }
    if (shipping_address && typeof shipping_address !== 'string') {
        return res.status(400).json({ success: false, error: 'TIPO_INVALIDO', message: 'El campo "shipping_address" debe ser de tipo texto.' });
    }
    if (notes && typeof notes !== 'string') {
        return res.status(400).json({ success: false, error: 'TIPO_INVALIDO', message: 'El campo "notes" debe ser de tipo texto.' });
    }
    const allowedFields = ['client_id', 'shipping_address', 'notes', 'items'];
    const receivedFields = Object.keys(req.body);
    const extraFields = receivedFields.filter(field => !allowedFields.includes(field));
    if (extraFields.length > 0) {
        return res.status(400).json({ success: false, error: 'CAMPOS_NO_PERMITIDOS', message: `Los campos ${extraFields.join(', ')} no están permitidos.` });
    }


    // --- 2. Validación del Array 'items' ---
    if (!Array.isArray(items)) {
        return res.status(400).json({ success: false, error: 'TIPO_INVALIDO', message: 'El campo "items" debe ser un array.' });
    }
    if (items.length === 0) {
        return res.status(400).json({ success: false, error: 'ITEMS_VACIO', message: 'El pedido debe contener al menos un producto.' });
    }


    // --- 3. Validación de Cada Objeto dentro de 'items' ---

    for (let i = 0; i < items.length; i++) {
        const item = items[i];

        // Validar que el item es un objeto
        if (typeof item !== 'object' || item === null || Array.isArray(item)) {
            return res.status(400).json({ success: false, error: 'ITEM_INVALIDO', message: `El item en la posición ${i} no es un objeto válido.` });
        }
        
        const { product_id, quantity } = item;

        // Validar campos requeridos del item
        if (product_id === undefined || quantity === undefined) {
            return res.status(400).json({ success: false, error: 'CAMPOS_ITEM_REQUERIDOS', message: `El item en la posición ${i} debe tener "product_id" y "quantity".` });
        }

        // Validar tipos de dato del item
        if (typeof product_id !== 'number' || !Number.isInteger(product_id)) {
            return res.status(400).json({ success: false, error: 'TIPO_INVALIDO', message: `El "product_id" en la posición ${i} debe ser un número entero.` });
        }

        if (typeof quantity !== 'number' || !Number.isInteger(quantity)) {
            return res.status(400).json({ success: false, error: 'TIPO_INVALIDO', message: `La "quantity" en la posición ${i} debe ser un número entero.` });
        }

        // Validar regla de negocio (no pedir 0 productos)
        if (quantity <= 0) {
            return res.status(400).json({ success: false, error: 'CANTIDAD_INVALIDA', message: `La "quantity" en la posición ${i} debe ser mayor a 0.` });
        }

        // Validar que no vengan campos extra en el item
        const allowedItemFields = ['product_id', 'quantity'];
        const receivedItemFields = Object.keys(item);
        const extraItemFields = receivedItemFields.filter(field => !allowedItemFields.includes(field));

        if (extraItemFields.length > 0) {
            return res.status(400).json({ success: false, error: 'CAMPOS_ITEM_NO_PERMITIDOS', message: `El item en la posición ${i} contiene campos no permitidos: ${extraItemFields.join(', ')}.` });
        }
    }

    // Si todo pasó, continuamos al controlador
    next();
    
};
/**
 * Middleware para validar el payload de la actualización de estado.
 */
const validateStatusPayload = (req, res, next) => {
    const { status } = req.body;
    if (!status) {
        return res.status(400).json({ success: false, message: 'El campo "status" es obligatorio.' });
    }

    // LISTA RESTRINGIDA: Solo los estados del flujo de despacho son válidos aquí.
    const validStatus = ['processing', 'shipped', 'completed'];

    if (!validStatus.includes(status)) {
         return res.status(400).json({ 
            success: false, 
            message: `El estado '${status}' no es válido para esta operación. Para cancelar, usa el endpoint dedicado.` 
        });
    }
    next();
};

module.exports = {
    validateOrderPayload,
    validateStatusPayload
};