/**
 * UTILIDADES DE SANITIZACIÓN Y SEGURIDAD
 * - sanitizeInput: Limpia inputs contra SQL injection y XSS
 * - containsSQLInjection: Detecta patrones maliciosos
 * - Funciones reutilizables de seguridad
 * - Prevención de ataques comunes
 * - Ubicacion utils/sanitizer.js
 */


const validator = require('validator');
const xss = require('xss');

// Función de sanitización anti-inyección SQL
const sanitizeInput = (input) => {
  if (typeof input !== 'string') {
    return input;
  }
  
  let sanitized = input
    .replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, (char) => {
      switch (char) {
        case '\0': return '\\0';
        case '\x08': return '\\b';
        case '\x09': return '\\t';
        case '\x1a': return '\\z';
        case '\n': return '\\n';
        case '\r': return '\\r';
        case '"':
        case "'":
        case '\\':
        case '%': return '\\' + char;
        default: return char;
      }
    })
    .replace(/(-{2,}.*$)/gm, '')
    .replace(/(\/\*[\s\S]*?\*\/)/g, '')
    .replace(/\b(union|select|insert|update|delete|drop|create|alter|exec|execute|sp_|xp_)\b/gi, '');
  
  sanitized = xss(sanitized, {
    whiteList: {},
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script']
  });
  
  return sanitized.trim();
};

// Función para validar patrones de inyección SQL
const containsSQLInjection = (input) => {
  const sqlPatterns = [
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
    /(\b(or|and)\b.*=.*)/i,
    /(--|\#|\/\*|\*\/)/,
    /(\b(sp_|xp_)\w+)/i,
    /([\'\";])/,
    /(\b(null|true|false)\b.*[\=\>\<])/i
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
};

/**
 * Verifica si algún valor de tipo string dentro de un objeto JSON contiene patrones de inyección SQL.
 * @param {object} jsonObj - El objeto a verificar.
 * @returns {boolean} - true si se encuentra un patrón, false en caso contrario.
 */
const jsonObjectContainsSQLInjection = (jsonObj) => {
    if (typeof jsonObj !== 'object' || jsonObj === null) {
        return false;
    }

    for (const key in jsonObj) {
        if (Object.hasOwnProperty.call(jsonObj, key)) {
            const value = jsonObj[key];
            if (typeof value === 'string' && containsSQLInjection(value)) {
                // Si CUALQUIER valor de texto contiene una inyección, detenemos y devolvemos true.
                return true;
            }
        }
    }
    // Si terminamos de recorrer y no encontramos nada, el objeto está limpio.
    return false;
};

/**
 * Sanitiza los valores de tipo string dentro de un objeto JSON.
 * Recorre el objeto y aplica sanitizeInput a cada valor de texto.
 * @param {object} jsonObj - El objeto JSON a sanitizar.
 * @returns {object} - El objeto con sus valores de texto ya sanitizados.
 */
const sanitizeJsonObject = (jsonObj) => {
    if (typeof jsonObj !== 'object' || jsonObj === null) {
        return jsonObj; // Devuelve el input si no es un objeto válido
    }

    const sanitizedObj = {};
    for (const key in jsonObj) {
        // Nos aseguramos de que estamos trabajando con propiedades del propio objeto
        if (Object.hasOwnProperty.call(jsonObj, key)) {
            const value = jsonObj[key];
            // Si el valor es un string, lo sanitizamos. Si no, lo dejamos como está.
            if (typeof value === 'string') {
                sanitizedObj[key] = sanitizeInput(value);
            } else {
                sanitizedObj[key] = value;
            }
        }
    }
    return sanitizedObj;
};

module.exports = {
  sanitizeInput,
  containsSQLInjection,
  sanitizeJsonObject,
  jsonObjectContainsSQLInjection
};