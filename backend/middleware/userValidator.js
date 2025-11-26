
const USER_SCHEMA = {
    // campos permitidos
    registerFields: ['Nombre', 'Correo', 'Passwd', 'Estado', 'rol', 'phone', 'address', 'sex'],
    updateFields: ['Nombre', 'Correo', 'Passwd', 'Estado', 'rol', 'phone', 'address', 'sex'],
    
    fieldRules: {
        Nombre: { type: 'string', maxLength: 100 },
        Correo: { type: 'string', maxLength: 100 },
        Passwd: { type: 'string', maxLength: 255, minLength: 6 },
        Estado: { type: 'boolean' },
        rol: { type: 'string', maxLength: 20, enum: ['admin', 'gerente', 'vendedor', 'administracion'] },
        
        // --- NUEVAS REGLAS ---
        phone: { 
            type: 'string', 
            maxLength: 20, 
            // Esta Regex asegura que SOLO haya números (0-9). Ni letras, ni espacios, ni guiones.
            pattern: /^[0-9]+$/, 
            errorMessage: 'El teléfono debe contener solo números, sin espacios ni guiones.'
        },
        address: { type: 'string' }, // TEXT en BD no tiene límite corto, pero string en JS
        sex: { type: 'string', enum: ['M', 'F', 'O'] }
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

            if (rule.pattern && !rule.pattern.test(value)) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'FORMATO_INVALIDO', 
                    message: rule.errorMessage || `El formato de '${field}' no es válido.`
                });
            }
        }
    }
    next();
};

module.exports = {
    validateRegisterPayload: validatePayload(USER_SCHEMA.registerFields),
    validateUpdatePayload: validatePayload(USER_SCHEMA.updateFields)
};