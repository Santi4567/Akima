
const USER_SCHEMA = {
    registerFields: ['Nombre', 'Correo', 'Passwd'],
    updateFields: ['Nombre', 'Correo', 'Passwd', 'Estado', 'rol'],
    fieldRules: {
        Nombre: { type: 'string', maxLength: 100, required: true },
        Correo: { type: 'string', maxLength: 100, required: true },
        Passwd: { type: 'string', maxLength: 255, minLength: 6, required: true },
        Estado: { type: 'boolean' },
        rol: { type: 'string', maxLength: 20, enum: ['admin', 'gerente', 'vendedor', 'administracion'] }
    }
};

const validatePayload = (allowedFields) => (req, res, next) => {
    const receivedFields = Object.keys(req.body);

    // 1. Validar campos no permitidos
    const extraFields = receivedFields.filter(field => !allowedFields.includes(field));
    if (extraFields.length > 0) {
        return res.status(400).json({ success: false, error: 'CAMPOS_NO_PERMITIDOS', message: `Los campos ${extraFields.join(', ')} no están permitidos.` });
    }

    // 2. Validar reglas para cada campo
    for (const field of receivedFields) {
        const rule = USER_SCHEMA.fieldRules[field];
        const value = req.body[field];

        if (rule) {
            // Validar tipo de dato
            if (rule.type === 'string' && typeof value !== 'string') return res.status(400).json({ success: false, message: `El campo '${field}' debe ser de tipo texto.` });
            if (rule.type === 'boolean' && typeof value !== 'boolean') return res.status(400).json({ success: false, message: `El campo '${field}' debe ser booleano (true/false).` });

            // Validar longitud
            if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) return res.status(400).json({ success: false, message: `El campo '${field}' excede los ${rule.maxLength} caracteres.` });
            if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) return res.status(400).json({ success: false, message: `El campo '${field}' debe tener al menos ${rule.minLength} caracteres.` });
            
            // Validar ENUM
            if (rule.enum && !rule.enum.includes(value)) return res.status(400).json({ success: false, message: `El valor para '${field}' no es válido.` });
        }
    }
    next();
};

module.exports = {
    validateRegisterPayload: validatePayload(USER_SCHEMA.registerFields),
    validateUpdatePayload: validatePayload(USER_SCHEMA.updateFields)
};