/**
 * CONTROLADOR DE AUTENTICACIÓN
 * - Lógica de registro de usuarios (validaciones, sanitización, encriptación)
 * - Validaciones de seguridad (SQL injection, XSS)
 * - Sistema de permisos basado en roles
 * - Interacción con la base de datos
 * - Ubicacion controllers/authController.js
 */

const bcrypt = require('bcrypt');
const validator = require('validator');
const { getConnection } = require('../config/database');
const { sanitizeInput, containsSQLInjection } = require('../utils/sanitizer');
const { checkPermission, PERMISSIONS } = require('../utils/permissions');

// Registrar nuevo usuario--------------------------------------------------------------------
const register = async (req, res) => {
  let connection;
  
  try {
    // 1. Validar campos permitidos
    const allowedFields = ['Nombre', 'Correo', 'Passwd'];
    const receivedFields = Object.keys(req.body);
    
    const extraFields = receivedFields.filter(field => !allowedFields.includes(field));
    if (extraFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'CAMPOS_NO_PERMITIDOS',
        message: `Los campos ${extraFields.join(', ')} no están permitidos`
      });
    }

    // 2. Validar campos requeridos
    const { Nombre, Correo, Passwd } = req.body;
    
    if (!Nombre || !Correo || !Passwd) {
      return res.status(400).json({
        success: false,
        error: 'CAMPOS_REQUERIDOS',
        message: 'Los campos Nombre, Correo y Passwd son obligatorios'
      });
    }

    // 3. Validar tipos
    if (typeof Nombre !== 'string' || typeof Correo !== 'string' || typeof Passwd !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'TIPO_DATOS_INVALIDO',
        message: 'Todos los campos deben ser de tipo string'
      });
    }

    // 4. Sanitizar
    const sanitizedNombre = sanitizeInput(Nombre);
    const sanitizedCorreo = sanitizeInput(Correo);
    const sanitizedPasswd = sanitizeInput(Passwd);

    // 5. Validaciones post-sanitización
    if (!sanitizedNombre || !sanitizedCorreo || !sanitizedPasswd) {
      return res.status(400).json({
        success: false,
        error: 'CAMPOS_VACIOS_POST_SANITIZACION',
        message: 'Los campos no pueden estar vacíos después de la sanitización'
      });
    }

    // 6. Verificar patrones maliciosos
    if (containsSQLInjection(sanitizedNombre) || containsSQLInjection(sanitizedCorreo) || containsSQLInjection(sanitizedPasswd)) {
      return res.status(400).json({
        success: false,
        error: 'INPUT_MALICIOSO',
        message: 'Los datos contienen caracteres o patrones no permitidos'
      });
    }

    // 7. Validar longitudes
    if (sanitizedNombre.length > 100 || sanitizedCorreo.length > 100 || sanitizedPasswd.length > 255) {
      return res.status(400).json({
        success: false,
        error: 'LONGITUD_EXCEDIDA',
        message: 'Uno o más campos exceden la longitud máxima'
      });
    }

    // 8. Validar email
    if (!validator.isEmail(sanitizedCorreo)) {
      return res.status(400).json({
        success: false,
        error: 'EMAIL_INVALIDO',
        message: 'El formato del correo electrónico no es válido'
      });
    }

    // 9. Validar contraseña mínima
    if (sanitizedPasswd.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'CONTRASEÑA_MUY_CORTA',
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // 10. Conectar a BD
    connection = await getConnection();

    // 11. Verificar email existente
    const [existingUsers] = await connection.execute(
      'SELECT ID FROM users WHERE Correo = ?',
      [sanitizedCorreo]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'CORREO_YA_EXISTE',
        message: 'Ya existe un usuario registrado con este correo'
      });
    }

    // 12. Encriptar contraseña
    const hashedPassword = await bcrypt.hash(sanitizedPasswd, 12);

    // 13. Insertar usuario con cuenta inactiva y rol por defecto
    const defaultRole = 'vendedor'; // Rol por defecto para nuevos registros
    const defaultEstado = 0; // Cuenta inactiva por defecto
    
    const [result] = await connection.execute(
      'INSERT INTO users (Nombre, Correo, Passwd, Estado, rol) VALUES (?, ?, ?, ?, ?)',
      [sanitizedNombre, sanitizedCorreo, hashedPassword, defaultEstado, defaultRole]
    );

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente. Tu cuenta está pendiente de activación por un administrador.',
      data: {
        id: result.insertId,
        nombre: sanitizedNombre,
        correo: sanitizedCorreo,
        estado: defaultEstado,
        rol: defaultRole
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      error: 'ERROR_SERVIDOR',
      message: 'Error interno del servidor'
    });
  } finally {
    if (connection) connection.release();
  }
};


// Modificar datos de usuario con sistema de permisos basado en roles--------------------------------------------------------------------------------------
const updateUser = async (req, res) => {
  let connection;
  
  try {
    const targetUserId = req.params.userId;
    const currentUser = req.user; // Información del usuario que viene en el token
    const currentUserRole = currentUser.rol || 'vendedor';
    const isOwner = currentUser.userId.toString() === targetUserId;

    console.log('=== DEBUG PERMISOS ===');
    console.log(`Usuario actual: ID ${currentUser.userId}, Rol: ${currentUserRole}`);
    console.log(`Usuario objetivo: ID ${targetUserId}`);
    console.log(`Es propietario: ${isOwner}`);

    // =================================================================
    // 1. NUEVA LÓGICA DE PERMISOS: SIMPLE, DIRECTA Y BASADA EN EL JSON
    // =================================================================
    
    // Se verifica si el usuario tiene permiso para esta acción.
    // O tiene el permiso general para editar otros usuarios (`edit.users`)...
    const canEditOthers = checkPermission(currentUserRole, PERMISSIONS.EDIT_USERS);
    // ...o es el propietario de la cuenta y tiene el permiso para editar su propio perfil (`edit.own.profile`).
    const canEditOwn = isOwner && checkPermission(currentUserRole, PERMISSIONS.EDIT_OWN_PROFILE);

    // Si no cumple ninguna de las dos condiciones, no tiene acceso.
    if (!canEditOthers && !canEditOwn) {
      return res.status(403).json({
        success: false,
        error: 'ACCESO_DENEGADO',
        message: 'No tienes los permisos necesarios para modificar esta información.'
      });
    }
    
    // Si llegamos aquí, el usuario tiene permiso para editar ALGO.
    // Ahora validamos los campos que está intentando modificar.

    const { Nombre, Correo, Passwd, Estado, rol } = req.body;
    const updates = {};
    const queryParams = [];

    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'SIN_CAMPOS',
        message: 'Debe proporcionar al menos un campo para actualizar'
      });
    }

    // 2. Procesar campos básicos (Nombre, Correo, Passwd)
    // El acceso general ya fue validado, así que procedemos con las validaciones de datos.
    if (Nombre !== undefined) {
      if (typeof Nombre !== 'string') return res.status(400).json({ success: false, error: 'TIPO_INVALIDO', message: 'El campo Nombre debe ser string' });
      const sanitizedNombre = sanitizeInput(Nombre);
      if (!sanitizedNombre || containsSQLInjection(sanitizedNombre) || sanitizedNombre.length > 100) {
        return res.status(400).json({ success: false, error: 'NOMBRE_INVALIDO', message: 'El nombre contiene caracteres no válidos o excede 100 caracteres' });
      }
      updates.Nombre = sanitizedNombre;
      queryParams.push(sanitizedNombre);
    }

    if (Correo !== undefined) {
      if (typeof Correo !== 'string') return res.status(400).json({ success: false, error: 'TIPO_INVALIDO', message: 'El campo Correo debe ser string' });
      const sanitizedCorreo = sanitizeInput(Correo);
      if (!sanitizedCorreo || containsSQLInjection(sanitizedCorreo) || !validator.isEmail(sanitizedCorreo) || sanitizedCorreo.length > 100) {
        return res.status(400).json({ success: false, error: 'CORREO_INVALIDO', message: 'El formato del correo no es válido, contiene caracteres no válidos o excede 100 caracteres' });
      }
      updates.Correo = sanitizedCorreo;
      queryParams.push(sanitizedCorreo);
    }

    if (Passwd !== undefined) {
      if (typeof Passwd !== 'string') return res.status(400).json({ success: false, error: 'TIPO_INVALIDO', message: 'El campo Passwd debe ser string' });
      const sanitizedPasswd = sanitizeInput(Passwd);
      if (!sanitizedPasswd || containsSQLInjection(sanitizedPasswd) || sanitizedPasswd.length < 6 || sanitizedPasswd.length > 255) {
        return res.status(400).json({ success: false, error: 'CONTRASEÑA_INVALIDA', message: 'La contraseña debe tener entre 6 y 255 caracteres y no contener caracteres no permitidos.' });
      }
      const hashedPassword = await bcrypt.hash(sanitizedPasswd, 12);
      updates.Passwd = hashedPassword;
      queryParams.push(hashedPassword);
    }

    // =================================================================
    // 3. VERIFICACIÓN A NIVEL DE CAMPO PARA DATOS SENSIBLES (Estado y Rol)
    // =================================================================
    // Solo permitimos modificar 'Estado' y 'rol' si el usuario tiene el permiso general 'edit.users'.
    const canManageUsers = checkPermission(currentUserRole, PERMISSIONS.EDIT_USERS);

    if (Estado !== undefined) {
      if (!canManageUsers) {
        return res.status(403).json({ success: false, error: 'CAMPO_NO_PERMITIDO', message: 'No tienes permisos para modificar el estado de un usuario.' });
      }
      if (typeof Estado !== 'boolean') return res.status(400).json({ success: false, error: 'TIPO_INVALIDO', message: 'El campo Estado debe ser booleano (true/false)' });
      updates.Estado = Estado;
      queryParams.push(Estado);
    }

    if (rol !== undefined) {
      if (!canManageUsers) {
        return res.status(403).json({ success: false, error: 'CAMPO_NO_PERMITIDO', message: 'No tienes permisos para modificar el rol de un usuario.' });
      }
      if (typeof rol !== 'string') return res.status(400).json({ success: false, error: 'TIPO_INVALIDO', message: 'El campo rol debe ser string' });
      const sanitizedRol = sanitizeInput(rol);
      const validRoles = ['admin', 'gerente', 'vendedor', 'administracion'];
      if (!validRoles.includes(sanitizedRol)) {
        return res.status(400).json({ success: false, error: 'ROL_NO_VALIDO', message: `El rol debe ser uno de: ${validRoles.join(', ')}` });
      }
      updates.rol = sanitizedRol;
      queryParams.push(sanitizedRol);
    }

    // =================================================================
    // 4. EL RESTO DE LA LÓGICA DE BASE DE DATOS SE MANTIENE IGUAL
    // =================================================================
    connection = await getConnection();

    const [existingUserQuery] = await connection.execute('SELECT ID, Correo, rol FROM users WHERE ID = ?', [targetUserId]);

    if (existingUserQuery.length === 0) {
      return res.status(404).json({ success: false, error: 'USUARIO_NO_ENCONTRADO', message: 'El usuario especificado no existe' });
    }
    
    const targetUser = existingUserQuery[0];

    // Protección especial: Solo un admin puede editar a otro admin. ¡Esto es muy importante!
    if (targetUser.rol === 'admin' && currentUserRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'ACCESO_DENEGADO', message: 'Solo un administrador puede modificar a otro administrador.' });
    }

    // Verificar duplicado de correo si se está modificando
    if (updates.Correo && updates.Correo !== targetUser.Correo) {
      const [duplicateCheck] = await connection.execute('SELECT ID FROM users WHERE Correo = ? AND ID != ?', [updates.Correo, targetUserId]);
      if (duplicateCheck.length > 0) {
        return res.status(409).json({ success: false, error: 'CORREO_EN_USO', message: 'El correo electrónico ya está en uso por otro usuario.' });
      }
    }

    // Construir y ejecutar query de actualización
    const updateFields = Object.keys(updates).map(field => `${field} = ?`).join(', ');
    queryParams.push(targetUserId);
    
    await connection.execute(`UPDATE users SET ${updateFields} WHERE ID = ?`, queryParams);

    const [updatedUser] = await connection.execute('SELECT ID, Nombre, Correo, Estado, rol FROM users WHERE ID = ?', [targetUserId]);

    res.status(200).json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: { user: updatedUser[0] }
    });

  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ success: false, error: 'ERROR_SERVIDOR', message: 'Error interno del servidor' });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  register,
  updateUser
};