/**
 * MIDDLEWARES DE AUTENTICACIÓN Y AUTORIZACIÓN
 * - verifyToken: Verifica que el JWT sea válido
 * - requireAdmin: Verifica que el usuario sea administrador (por rol)
 * - requirePermission: Verifica permisos específicos
 * - Extrae información del usuario del token incluyendo rol
 * - Manejo de errores de tokens (expirados, inválidos)
 * - Ubicacion middleware/auth.js
 */

const jwt = require('jsonwebtoken');
const { requirePermission} = require('../utils/permissions');

const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_super_secreta_akima_2024';

/**
 * Middleware para verificar JWT
 * Ahora incluye el rol del usuario en req.user
 */
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'TOKEN_REQUERIDO',
        message: 'Se requiere un token de autorización'
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    
    req.user = {
      userId: decoded.userId,
      nombre: decoded.nombre,
      correo: decoded.correo,
      rol: decoded.rol || 'vendedor', // Rol por defecto si no está en el token
      isAdmin: decoded.rol === 'admin' // Compatibilidad hacia atrás
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'TOKEN_EXPIRADO',
        message: 'El token ha expirado'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'TOKEN_INVALIDO',
        message: 'Token inválido'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'ERROR_SERVIDOR',
      message: 'Error al verificar el token'
    });
  }
};

/**
 * Middleware específico para requerir permisos de administrador
 * Ahora usa el rol en lugar de isAdmin
 */
const requireAdminRole = (req, res, next) => {
  const userRole = req.user?.rol || 'vendedor';
  if (userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'ACCESO_DENEGADO',
      message: 'Se requieren permisos de administrador'
    });
  }
  next();
};


module.exports = {
  verifyToken,
  requireAdmin: requireAdminRole, // Mantenemos el nombre original para compatibilidad
  requirePermission,
  JWT_SECRET //<-- SI se ocupa, no lo borres (Dont delete)
};