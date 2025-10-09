/**
 * Middleware para validar los datos de entrada para la entidad 'suppliers'.
 * Centraliza las reglas de validación de campos y longitudes.
 */

// Definimos la estructura y reglas de la tabla en un solo lugar.
const SUPPLIER_SCHEMA = {
    allowedFields: [
        'name', 'contact_person', 'email', 'phone', 'address', 
        'website', 'status', 'notes', 'tax_id', 'payment_terms', 'billing_email'
    ],
    fieldRules: {
        name: { maxLength: 200, required: true },
        contact_person: { maxLength: 150 },
        email: { maxLength: 150 },
        phone: { maxLength: 50 },
        website: { maxLength: 255 },
        status: { enum: ['activo', 'inactivo', 'potencial'] },
        tax_id: { maxLength: 50 },
        payment_terms: { maxLength: 100 },
        billing_email: { maxLength: 150 }
    }
};

/**
 * Middleware que valida el cuerpo (body) de las peticiones POST y PUT.
 */
const validateSupplierPayload = (req, res, next) => {
    const receivedFields = Object.keys(req.body);

    // 1. Validar que no vengan campos no permitidos
    const extraFields = receivedFields.filter(field => !SUPPLIER_SCHEMA.allowedFields.includes(field));
    if (extraFields.length > 0) {
        return res.status(400).json({
            success: false,
            error: 'CAMPOS_NO_PERMITIDOS',
            message: `Los campos ${extraFields.join(', ')} no están permitidos.`
        });
    }

    // 2. Validar reglas (longitud, requeridos, etc.) para cada campo
    for (const field of receivedFields) {
        const rule = SUPPLIER_SCHEMA.fieldRules[field];
        const value = req.body[field];

        if (rule) {
            // Validar longitud máxima
            if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
                return res.status(400).json({
                    success: false,
                    error: 'LONGITUD_EXCEDIDA',
                    message: `El campo '${field}' no puede exceder los ${rule.maxLength} caracteres.`
                });
            }
            // Validar campos de tipo ENUM
            if (rule.enum && !rule.enum.includes(value)) {
                return res.status(400).json({
                    success: false,
                    error: 'VALOR_INVALIDO',
                    message: `El campo 'status' debe ser uno de: ${rule.enum.join(', ')}.`
                });
            }
        }
    }
    
    // 3. Validar campos requeridos (solo para POST)
    if (req.method === 'POST') {
        const requiredField = 'name';
        if (!req.body[requiredField]) {
             return res.status(400).json({
                    success: false,
                    error: 'CAMPO_REQUERIDO',
                    message: `El campo '${requiredField}' es obligatorio.`
                });
        }
    }

    next();
};

module.exports = {
    validateSupplierPayload
};