/**
 * Middleware para validar los datos de entrada para la entidad 'products'.
 */

const PRODUCT_SCHEMA = {
    allowedFields: [
        'sku', 'barcode', 'name', 'description', 'price', 'cost_price', 
        'product_type', 'status', 'category_id', 'supplier_id',
        'weight', 'height', 'width', 'depth', 'custom_fields','location'
    ],
    fieldRules: {
        sku: { type: 'string', maxLength: 100, required: true },
        barcode: { type: 'string', maxLength: 50 },
        name: { type: 'string', maxLength: 255, required: true },
        description: { type: 'string' }, // TEXT fields don't have a max length here
        price: { type: 'number', required: true },
        cost_price: { type: 'number' },
        product_type: { type: 'string', enum: ['product', 'service'] },
        status: { type: 'string', enum: ['active', 'inactive', 'draft', 'discontinued'] },
        category_id: { type: 'integer' },
        supplier_id: { type: 'integer' },
        weight: { type: 'number' },
        height: { type: 'number' },
        width: { type: 'number' },
        depth: { type: 'number' },
        custom_fields: { type: 'object' }, // JSON fields are objects
        location: { type: 'string', maxLength: 255 }
    }
};

const validateProductPayload = (req, res, next) => {
    const receivedFields = Object.keys(req.body);

    // 1. Validar campos no permitidos
    const extraFields = receivedFields.filter(field => !PRODUCT_SCHEMA.allowedFields.includes(field));
    if (extraFields.length > 0) {
        return res.status(400).json({ success: false, error: 'CAMPOS_NO_PERMITIDOS', message: `Los campos ${extraFields.join(', ')} no están permitidos.` });
    }

    // 2. Validar reglas para cada campo
    for (const field of receivedFields) {
        const rule = PRODUCT_SCHEMA.fieldRules[field];
        const value = req.body[field];

        if (rule) {
            // Validar tipo de dato
            if (rule.type === 'string' && typeof value !== 'string') return res.status(400).json({ success: false, message: `El campo '${field}' debe ser de tipo texto.` });
            if (rule.type === 'number' && typeof value !== 'number') return res.status(400).json({ success: false, message: `El campo '${field}' debe ser de tipo numérico.` });
            if (rule.type === 'integer' && !Number.isInteger(value)) return res.status(400).json({ success: false, message: `El campo '${field}' debe ser un número entero.` });
            if (rule.type === 'object' && typeof value !== 'object') return res.status(400).json({ success: false, message: `El campo '${field}' debe ser un objeto JSON.` });

            // Validar longitud máxima
            if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
                return res.status(400).json({ success: false, error: 'LONGITUD_EXCEDIDA', message: `El campo '${field}' no puede exceder los ${rule.maxLength} caracteres.` });
            }
            // Validar ENUM
            if (rule.enum && !rule.enum.includes(value)) {
                return res.status(400).json({ success: false, error: 'VALOR_INVALIDO', message: `El valor para '${field}' no es válido.` });
            }
        }
    }

    // 3. Validar campos requeridos (solo para POST)
    if (req.method === 'POST') {
        for (const field in PRODUCT_SCHEMA.fieldRules) {
            if (PRODUCT_SCHEMA.fieldRules[field].required && req.body[field] === undefined) {
                return res.status(400).json({ success: false, error: 'CAMPO_REQUERIDO', message: `El campo '${field}' es obligatorio.` });
            }
        }
    }

    next();
};


const STOCK_UPDATE_SCHEMA = {
    allowedFields: ['quantity', 'type', 'reason'],
    fieldRules: {
        quantity: { type: 'integer', required: true }, // Siempre positivo
        type: { type: 'string', required: true, enum: ['add', 'subtract', 'set'] }, // Operación
        reason: { type: 'string', required: true } // Obligatorio explicar por qué
    }
};

const validateStockUpdate = (req, res, next) => {
    const { quantity, type, reason } = req.body;

    if (quantity === undefined || !type || !reason) {
        return res.status(400).json({ success: false, message: 'Faltan campos: quantity, type, reason.' });
    }
    
    if (!Number.isInteger(quantity) || quantity < 0) {
        return res.status(400).json({ success: false, message: 'La cantidad debe ser un número entero positivo.' });
    }

    if (!['add', 'subtract', 'set'].includes(type)) {
        return res.status(400).json({ success: false, message: 'El tipo debe ser: add, subtract o set.' });
    }

    next();
};

module.exports = { validateProductPayload,validateStockUpdate };