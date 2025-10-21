/**
 * Middleware para validar los datos de entrada para la entidad 'clients'.
 * Verifica campos permitidos, tipos de dato y longitudes.
 */

const CLIENT_SCHEMA = {
    // Todos los campos que la API puede recibir
    allowedFields: [
        'first_name', 'last_name', 'email', 'phone', 'address', 
        'company_name', 'status', 'notes', 'last_contact_date', 'follow_up_days'
    ],
    // Reglas para cada campo
    fieldRules: {
        first_name: { type: 'string', maxLength: 100, required: true },
        last_name: { type: 'string', maxLength: 100, required: true },
        email: { type: 'string', maxLength: 150, required: true },
        phone: { type: 'string', maxLength: 50 },
        address: { type: 'string' }, // TEXT
        company_name: { type: 'string', maxLength: 200 },
        status: { type: 'string', enum: ['lead', 'active', 'inactive'] },
        notes: { type: 'string' }, // TEXT
        last_contact_date: { type: 'date' }, // Espera un formato 'YYYY-MM-DD'
        follow_up_days: { type: 'integer' }
    }
};

/**
 * Middleware que valida el payload para crear o actualizar un cliente.
 */
const validateClientPayload = (req, res, next) => {
    const receivedFields = Object.keys(req.body);

    // 1. Validar campos no permitidos
    const extraFields = receivedFields.filter(field => !CLIENT_SCHEMA.allowedFields.includes(field));
    if (extraFields.length > 0) {
        return res.status(400).json({ success: false, error: 'CAMPOS_NO_PERMITIDOS', message: `Los campos ${extraFields.join(', ')} no están permitidos.` });
    }

    // 2. Validar campos requeridos (solo para POST)
    if (req.method === 'POST') {
        for (const field in CLIENT_SCHEMA.fieldRules) {
            if (CLIENT_SCHEMA.fieldRules[field].required && req.body[field] === undefined) {
                return res.status(400).json({ success: false, error: 'CAMPO_REQUERIDO', message: `El campo '${field}' es obligatorio.` });
            }
        }
    }

    // 3. Validar reglas de tipo y longitud para campos presentes
    for (const field of receivedFields) {
        const rule = CLIENT_SCHEMA.fieldRules[field];
        const value = req.body[field];

        if (rule) {
            if (rule.type === 'string' && typeof value !== 'string') return res.status(400).json({ success: false, message: `El campo '${field}' debe ser de tipo texto.` });
            if (rule.type === 'integer' && !Number.isInteger(value)) return res.status(400).json({ success: false, message: `El campo '${field}' debe ser un número entero.` });
            if (rule.type === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(value)) return res.status(400).json({ success: false, message: `El campo '${field}' debe tener el formato YYYY-MM-DD.` });
            
            if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) return res.status(400).json({ success: false, message: `El campo '${field}' excede los ${rule.maxLength} caracteres.` });
            if (rule.enum && !rule.enum.includes(value)) return res.status(400).json({ success: false, message: `El valor para '${field}' no es válido.` });
        }
    }
    
    next();
};

module.exports = {
    validateClientPayload
};