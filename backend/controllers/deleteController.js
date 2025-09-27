/**
 * CONTROLADOR PARA ELIMINAR USUARIOS
 * - Solo administradores pueden eliminar usuarios
 * - Validaciones de seguridad
 * - Verificación de existencia del usuario
 * - Ubicacion: controllers/deleteUserController.js o añadir a authController.js
 */

const { getConnection } = require('../config/database');

/**
 * Eliminar usuario por ID
 * Solo admin puede eliminar cualquier usuario
 */
const deleteUser = async (req, res) => {
  let connection;
  
  try {
    const targetUserId = req.params.userId;
    const currentUser = req.user;
    const currentUserRole = currentUser.rol || 'vendedor';

    console.log(`=== ELIMINAR USUARIO ===`);
    console.log(`Usuario actual: ID ${currentUser.userId}, Rol: ${currentUserRole}`);
    console.log(`Usuario a eliminar: ID ${targetUserId}`);

    // 1. Verificar que solo admin puede eliminar
    if (currentUserRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'ACCESO_DENEGADO',
        message: 'Solo administradores pueden eliminar usuarios'
      });
    }

    // 2. Validar que el ID sea un número válido
    if (!targetUserId || isNaN(targetUserId)) {
      return res.status(400).json({
        success: false,
        error: 'ID_INVALIDO',
        message: 'El ID del usuario debe ser un número válido'
      });
    }

    // 3. Evitar que el admin se elimine a sí mismo
    if (currentUser.userId.toString() === targetUserId) {
      return res.status(400).json({
        success: false,
        error: 'AUTO_ELIMINACION_NO_PERMITIDA',
        message: 'No puedes eliminar tu propia cuenta'
      });
    }

    connection = await getConnection();

    // 4. Verificar que el usuario existe
    const [existingUser] = await connection.execute(
      'SELECT ID, Nombre, Correo, rol FROM users WHERE ID = ?',
      [targetUserId]
    );

    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'USUARIO_NO_ENCONTRADO',
        message: 'El usuario especificado no existe'
      });
    }

    const userToDelete = existingUser[0];
    console.log(`Usuario encontrado: ${userToDelete.Nombre} (${userToDelete.rol})`);

    // 5. Eliminar el usuario
    const [deleteResult] = await connection.execute(
      'DELETE FROM users WHERE ID = ?',
      [targetUserId]
    );

    if (deleteResult.affectedRows === 0) {
      return res.status(500).json({
        success: false,
        error: 'ERROR_ELIMINACION',
        message: 'No se pudo eliminar el usuario'
      });
    }

    console.log(`Usuario eliminado exitosamente: ID ${targetUserId}`);

    // 6. Respuesta exitosa
    res.status(200).json({
      success: true,
      message: 'Usuario eliminado exitosamente',
      data: {
        deletedUser: {
          id: userToDelete.ID,
          nombre: userToDelete.Nombre,
          correo: userToDelete.Correo,
          rol: userToDelete.rol
        },
        deletedBy: {
          id: currentUser.userId,
          nombre: currentUser.nombre
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    
    // Manejo de errores específicos de BD
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({
        success: false,
        error: 'USUARIO_REFERENCIADO',
        message: 'No se puede eliminar el usuario porque tiene registros asociados'
      });
    }

    res.status(500).json({
      success: false,
      error: 'ERROR_SERVIDOR',
      message: 'Error interno del servidor al eliminar usuario'
    });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  deleteUser
};