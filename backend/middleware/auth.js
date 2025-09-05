/**
 * MIDDLEWARES DE AUTENTICACIÓN Y AUTORIZACIÓN
 * - verifyToken: Verifica que el JWT sea válido
 * - requireAdmin: Verifica que el usuario sea administrador
 * - Extrae información del usuario del token
 * - Manejo de errores de tokens (expirados, inválidos)
 */


const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_super_secreta_akima_2024';

// Middleware para verificar JWT
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
      isAdmin: decoded.isAdmin
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

// Middleware para verificar si es admin
const requireAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
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
  requireAdmin,
  JWT_SECRET
};