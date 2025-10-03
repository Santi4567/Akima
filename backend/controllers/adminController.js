/**
 * CONTROLADOR DE ADMINISTRACIÓN
 * - Funciones exclusivas para administradores
 * - Ubicación: controllers/adminController.js
 */


/**
 * Obtener información del sistema
 */
const getSystemInfo = async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'ACCESO_DENEGADO',
        message: 'Solo administradores pueden ver información del sistema'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Información del sistema',
      data: {
        version: '1.0.0',
        uptime: process.uptime(),
        nodeVersion: process.version,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error obteniendo info del sistema:', error);
    res.status(500).json({
      success: false,
      error: 'ERROR_SERVIDOR',
      message: 'Error al obtener información del sistema'
    });
  }
};

module.exports = {
  getSystemInfo
};