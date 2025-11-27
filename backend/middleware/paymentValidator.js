// Crear nuevo archivo: middleware/paymentValidator.js

const PAYMENT_SCHEMA = {
    allowedFields: ['order_id', 'amount', 'method', 'reference', 'notes'],
    fieldRules: {
        order_id: { type: 'integer', required: true },
        amount: { type: 'number', required: true },
        // AQUÍ ESTÁ TU CAMBIO: Solo estos 3 métodos
        method: { type: 'string', required: true, enum: ['cash', 'transfer', 'credit_card'] },
        reference: { type: 'string' },
        notes: { type: 'string' }
    }
};

const validatePaymentPayload = (req, res, next) => {
    const receivedFields = Object.keys(req.body);

    // 1. Validar campos extra
    const extraFields = receivedFields.filter(field => !PAYMENT_SCHEMA.allowedFields.includes(field));
    if (extraFields.length > 0) {
        return res.status(400).json({ success: false, error: 'CAMPOS_NO_PERMITIDOS', message: `Campos no permitidos: ${extraFields.join(', ')}` });
    }

    // 2. Validar requeridos
    for (const field in PAYMENT_SCHEMA.fieldRules) {
        if (PAYMENT_SCHEMA.fieldRules[field].required && req.body[field] === undefined) {
            return res.status(400).json({ success: false, error: 'CAMPO_REQUERIDO', message: `El campo '${field}' es obligatorio.` });
        }
    }

    // 3. Validar tipos y valores
    for (const field of receivedFields) {
        const rule = PAYMENT_SCHEMA.fieldRules[field];
        const value = req.body[field];

        if (rule.type === 'integer' && !Number.isInteger(value)) return res.status(400).json({ success: false, message: `El '${field}' debe ser entero.` });
        if (rule.type === 'number' && typeof value !== 'number') return res.status(400).json({ success: false, message: `El '${field}' debe ser número.` });
        if (rule.type === 'string' && typeof value !== 'string') return res.status(400).json({ success: false, message: `El '${field}' debe ser texto.` });
        
        // Validar monto positivo
        if (field === 'amount' && value <= 0) {
            return res.status(400).json({ success: false, error: 'MONTO_INVALIDO', message: 'El monto debe ser mayor a 0.' });
        }

        // Validar ENUM (Tu cambio)
        if (rule.enum && !rule.enum.includes(value)) {
            return res.status(400).json({ 
                success: false, 
                error: 'METODO_INVALIDO', 
                message: `Método de pago inválido. Opciones: ${rule.enum.join(', ')}` 
            });
        }
    }
    next();
};

module.exports = { validatePaymentPayload };