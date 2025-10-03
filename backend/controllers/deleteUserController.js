/**
 * CONTROLADOR PARA ELIMINAR USUARIOS (REFACTORIZADO Y CON PROTECCIONES ADICIONALES)
 * - Solo usuarios con el permiso 'delete.users' (o admin) pueden eliminar.
 * - Solo un admin puede eliminar a otro admin.
 * - No se puede eliminar al último admin del sistema.
 */

const { getConnection } = require('../config/database');
const { checkPermission, PERMISSIONS } = require('../utils/permissions');

/**
 * Eliminar usuario por ID
 */
const deleteUser = async (req, res) => {
  let connection;
  
  try {
    const targetUserId = req.params.userId;
    const currentUser = req.user;
    const currentUserRole = currentUser.rol || 'vendedor';

    // 1. Verificación de Permisos (¿Puede este rol eliminar usuarios?)
    if (!checkPermission(currentUserRole, PERMISSIONS.DELETE_USERS)) {
      return res.status(403).json({
        success: false,
        error: 'ACCESO_DENEGADO',
        message: 'No tienes los permisos necesarios para eliminar usuarios.'
      });
    }

    // 2. Validaciones básicas
    if (!targetUserId || isNaN(targetUserId)) {
      return res.status(400).json({ success: false, error: 'ID_INVALIDO' /*...*/ });
    }
    if (currentUser.userId.toString() === targetUserId) {
      return res.status(400).json({ success: false, error: 'AUTO_ELIMINACION_NO_PERMITIDA' /*...*/ });
    }

    connection = await getConnection();

    // 3. Verificar que el usuario a eliminar existe
    const [existingUser] = await connection.execute(
      'SELECT ID, Nombre, rol FROM users WHERE ID = ?',
      [targetUserId]
    );

    if (existingUser.length === 0) {
      return res.status(404).json({ success: false, error: 'USUARIO_NO_ENCONTRADO' /*...*/ });
    }

    const userToDelete = existingUser[0];

    // =================================================================
    // 4. NUEVA VERIFICACIÓN: PROTECCIÓN DE ADMINS
    // Si el objetivo es un admin, solo otro admin puede eliminarlo.
    // =================================================================
    if (userToDelete.rol === 'admin' && currentUserRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'ACCESO_DENEGADO',
        message: 'Solo un administrador puede eliminar a otro administrador.'
      });
    }
    
    // =================================================================
    // 5. NUEVA VERIFICACIÓN: SALVAGUARDA DEL ÚLTIMO ADMIN
    // Si el objetivo es un admin, verificar que no sea el último.
    // =================================================================
    if (userToDelete.rol === 'admin') {
      const [adminCountResult] = await connection.execute(
        "SELECT COUNT(ID) as adminCount FROM users WHERE rol = 'admin'"
      );
      
      const adminCount = adminCountResult[0].adminCount;

      if (adminCount <= 1) {
        return res.status(409).json({ // 409 Conflict es un buen código de estado para esto
          success: false,
          error: 'ULTIMO_ADMIN',
          message: 'No se puede eliminar al último administrador del sistema. Debe existir al menos uno.'
        });
      }
    }

    // 6. Si todas las verificaciones pasan, proceder con la eliminación
    await connection.execute('DELETE FROM users WHERE ID = ?', [targetUserId]);

    res.status(200).json({
      success: true,
      message: 'Usuario eliminado exitosamente',
      data: {
        deletedUser: { id: userToDelete.ID, nombre: userToDelete.Nombre },
        deletedBy: { id: currentUser.userId, nombre: currentUser.nombre }
      }
    });

  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    // ... (tu manejo de errores de BD y error 500 general)
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