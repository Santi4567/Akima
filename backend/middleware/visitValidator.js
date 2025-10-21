// Crear nuevo archivo: middleware/visitValidator.js

const validator = require('validator'); // Usaremos esto para la fecha/hora

const VISIT_SCHEMA = {
    // Todos los campos que la API puede recibir
    allowedFields: [
        'client_id', 'user_id', 'scheduled_for', 'status', 'notes'
    ],
    // Reglas para cada campo
    fieldRules: {
        client_id: { type: 'integer', required: true },
        user_id: { type: 'integer', required: true },
        scheduled_for: { type: 'datetime', required: true }, // Espera formato ISO 8601 (YYYY-MM-DDTHH:MM:SS)
        status: { type: 'string', enum: ['pending', 'completed', 'cancelled'] },
        notes: { type: 'string' } // TEXT
    }
};

/**
 * Middleware que valida el payload para crear o actualizar una visita.
 */
const validateVisitPayload = (req, res, next) => {
    const receivedFields = Object.keys(req.body);

    // 1. Validar campos no permitidos
    const extraFields = receivedFields.filter(field => !VISIT_SCHEMA.allowedFields.includes(field));
    if (extraFields.length > 0) {
        return res.status(400).json({ success: false, error: 'CAMPOS_NO_PERMITIDOS', message: `Los campos ${extraFields.join(', ')} no están permitidos.` });
    }

    // 2. Validar campos requeridos (solo para POST)
    if (req.method === 'POST') {
        for (const field in VISIT_SCHEMA.fieldRules) {
            if (VISIT_SCHEMA.fieldRules[field].required && req.body[field] === undefined) {
                return res.status(400).json({ success: false, error: 'CAMPO_REQUERIDO', message: `El campo '${field}' es obligatorio.` });
            }
        }
    }

    // 3. Validar reglas de tipo para campos presentes
    for (const field of receivedFields) {
        const rule = VISIT_SCHEMA.fieldRules[field];
        const value = req.body[field];

        if (rule) {
            if (rule.type === 'string' && typeof value !== 'string') return res.status(400).json({ success: false, message: `El campo '${field}' debe ser de tipo texto.` });
            if (rule.type === 'integer' && !Number.isInteger(value)) return res.status(400).json({ success: false, message: `El campo '${field}' debe ser un número entero.` });
            if (rule.type === 'datetime' && !validator.isISO8601(value)) return res.status(400).json({ success: false, message: `El campo '${field}' debe ser una fecha y hora en formato ISO 8601 (ej. YYYY-MM-DDTHH:MM:SS).` });
            
            if (rule.enum && !rule.enum.includes(value)) return res.status(400).json({ success: false, message: `El valor para '${field}' no es válido.` });
        }
    }
    
    next();
};

module.exports = {
    validateVisitPayload
};