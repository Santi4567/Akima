/**
 * CONTROLADOR DE ADMINISTRACIÓN
 * - Funciones exclusivas para administradores
 * - Gestión del sistema, permisos, configuración
 * - Ubicación: controllers/adminController.js
 */

const { loadPermissions } = require('../utils/permissions');

/**
 * Recargar permisos del sistema
 * Solo admin puede usarlo
 */
const reloadPermissions = async (req, res) => {
  try {
    // Verificación adicional de seguridad
    if (req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'ACCESO_DENEGADO',
        message: 'Solo administradores pueden recargar permisos'
      });
    }

    // Recargar permisos
    const newPermissions = loadPermissions();
    
    res.status(200).json({
      success: true,
      message: 'Permisos recargados exitosamente',
      data: {
        permissions: newPermissions,
        timestamp: new Date().toISOString(),
        reloadedBy: req.user.nombre
      }
    });

  } catch (error) {
    console.error('Error recargando permisos:', error);
    res.status(500).json({
      success: false,
      error: 'ERROR_SERVIDOR',
      message: 'Error al recargar permisos'
    });
  }
};

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
  reloadPermissions,
  getSystemInfo
};