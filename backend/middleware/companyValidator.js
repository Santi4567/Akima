// Crear middleware/companyValidator.js

const COMPANY_SCHEMA = {
    allowedFields: ['name', 'legal_name', 'tax_id', 'email', 'phone', 'address', 'website'],
    fieldRules: {
        name: { type: 'string', maxLength: 255, required: true },
        legal_name: { type: 'string', maxLength: 255 },
        tax_id: { type: 'string', maxLength: 50 },
        email: { type: 'string', maxLength: 150 }, // Podrías agregar validación de email aquí
        phone: { type: 'string', maxLength: 50 },
        address: { type: 'string' },
        website: { type: 'string', maxLength: 255 }
    }
};

const validateCompanyPayload = (req, res, next) => {
    // Multer pone los campos de texto en req.body
    const receivedFields = Object.keys(req.body);

    // 1. Validar campos extra
    const extraFields = receivedFields.filter(field => !COMPANY_SCHEMA.allowedFields.includes(field));
    if (extraFields.length > 0) {
        return res.status(400).json({ success: false, error: 'CAMPOS_NO_PERMITIDOS', message: `Campos no permitidos: ${extraFields.join(', ')}` });
    }

    // 2. Validar tipos y longitudes
    for (const field of receivedFields) {
        const rule = COMPANY_SCHEMA.fieldRules[field];
        const value = req.body[field];

        if (rule.type === 'string' && typeof value !== 'string') {
            return res.status(400).json({ success: false, message: `El campo '${field}' debe ser texto.` });
        }
        if (rule.maxLength && value.length > rule.maxLength) {
            return res.status(400).json({ success: false, message: `El campo '${field}' excede los ${rule.maxLength} caracteres.` });
        }
    }
    
    // El nombre es obligatorio si se envía (aunque en un update parcial podría ser opcional, 
    // aquí forzamos que si se crea por primera vez, lo tenga).
    if (req.method === 'PUT' && !req.body.name && !req.file) {
         // Nota: Permitimos update sin nombre SI se está subiendo solo el logo.
         // Si no hay archivo y no hay datos, error.
         if (receivedFields.length === 0) {
             return res.status(400).json({ success: false, message: 'Debes enviar datos o una imagen para actualizar.' });
         }
    }

    next();
};

module.exports = { validateCompanyPayload };