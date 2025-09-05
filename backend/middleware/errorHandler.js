/**
 * MIDDLEWARE GLOBAL DE MANEJO DE ERRORES
 * - Captura todos los errores no manejados
 * - Maneja errores específicos de MySQL
 * - Respuestas consistentes de error
 * - Logging de errores para debugging
 */


const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Error de MySQL
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      error: 'DUPLICADO',
      message: 'El registro ya existe'
    });
  }

  // Error de conexión a BD
  if (err.code === 'ECONNREFUSED') {
    return res.status(500).json({
      success: false,
      error: 'BD_NO_DISPONIBLE',
      message: 'Base de datos no disponible'
    });
  }

  // Error genérico
  res.status(500).json({
    success: false,
    error: 'ERROR_SERVIDOR',
    message: 'Error interno del servidor'
  });
};

module.exports = { errorHandler };