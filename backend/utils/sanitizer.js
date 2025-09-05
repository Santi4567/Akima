/**
 * UTILIDADES DE SANITIZACIÓN Y SEGURIDAD
 * - sanitizeInput: Limpia inputs contra SQL injection y XSS
 * - containsSQLInjection: Detecta patrones maliciosos
 * - Funciones reutilizables de seguridad
 * - Prevención de ataques comunes
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

module.exports = {
  sanitizeInput,
  containsSQLInjection
};