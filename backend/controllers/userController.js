// Reemplazar/Crear el archivo: controllers/userController.js

const bcrypt = require('bcrypt');
const validator = require('validator');
const { getConnection } = require('../config/database');
const { sanitizeInput, containsSQLInjection } = require('../utils/sanitizer');
const { checkPermission, PERMISSIONS } = require('../utils/permissions');
const { loadPermissions } = require('../utils/permissions');

/**
 * [PÚBLICO] Registrar un nuevo usuario.
 * La cuenta se crea como inactiva y con rol 'vendedor' por defecto.
 */
const register = async (req, res) => {
    let connection;
    try {
        const { Nombre, Correo, Passwd } = req.body;
        if (!Nombre || !Correo || !Passwd) {
            return res.status(400).json({ success: false, error: 'CAMPOS_REQUERIDOS', message: 'Los campos Nombre, Correo y Passwd son obligatorios.' });
        }

        const sanitizedNombre = sanitizeInput(Nombre);
        const sanitizedCorreo = sanitizeInput(Correo);

        if (containsSQLInjection(sanitizedNombre) || containsSQLInjection(sanitizedCorreo) || containsSQLInjection(Passwd)) {
            return res.status(400).json({ success: false, error: 'INPUT_MALICIOSO', message: 'Los datos contienen patrones no permitidos.' });
        }
        if (!validator.isEmail(sanitizedCorreo)) {
            return res.status(400).json({ success: false, error: 'EMAIL_INVALIDO', message: 'El formato del correo no es válido.' });
        }

        connection = await getConnection();
        const [existing] = await connection.execute('SELECT ID FROM users WHERE Correo = ?', [sanitizedCorreo]);
        if (existing.length > 0) {
            return res.status(409).json({ success: false, error: 'CORREO_YA_EXISTE', message: 'El correo electrónico ya está registrado.' });
        }

        const hashedPassword = await bcrypt.hash(Passwd, 12);
        const [result] = await connection.execute(
            'INSERT INTO users (Nombre, Correo, Passwd, Estado, rol) VALUES (?, ?, ?, ?, ?)',
            [sanitizedNombre, sanitizedCorreo, hashedPassword, 0, 'vendedor']
        );

        res.status(201).json({ success: true, message: 'Usuario registrado. La cuenta está pendiente de activación.', data: { id: result.insertId } });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * [PROTEGIDO] Obtener el perfil del usuario actualmente autenticado
 * (ACTUALIZADO: Ahora también incluye la lista de permisos del usuario)
 */
const getProfile = (req, res) => {
    try {
        // 1. req.user es la información del token (userId, nombre, correo, rol)
        const currentUser = req.user; 

        // 2. Cargamos la estructura completa de permisos desde el archivo
        const allPermissions = loadPermissions();
        
        // 3. Buscamos los permisos específicos para el rol de este usuario
        let userPermissions = allPermissions[currentUser.rol];

        // 4. Manejamos el caso especial del Admin
        if (userPermissions === '*') {
            // Si es admin, le enviamos un array con el comodín.
            // El frontend puede interpretar "*" como "acceso total".
            userPermissions = ['*'];
        }

        // 5. Preparamos la respuesta
        const profileData = {
            id: currentUser.userId,
            nombre: currentUser.nombre,
            correo: currentUser.correo,
            rol: currentUser.rol,
            permissions: userPermissions || [] // Enviamos la lista de permisos
        };

        // 6. Enviamos el perfil completo
        res.status(200).json({ success: true, data: profileData });

    } catch (error) {
        console.error('Error al obtener el perfil:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR', message: 'No se pudo obtener la información del perfil.' });
    }
};

/**
 * [PROTEGIDO] Obtener una lista de todos los usuarios.
 */
const getAllUsers = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [users] = await connection.execute('SELECT ID, Nombre, Correo, Estado, rol FROM users ORDER BY Nombre ASC');
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * [PROTEGIDO] Obtener un usuario específico por su ID.
 */
const getUserById = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await getConnection();
        const [user] = await connection.execute('SELECT ID, Nombre, Correo, Estado, rol FROM users WHERE ID = ?', [id]);
        if (user.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
        }
        res.status(200).json({ success: true, data: user[0] });
    } catch (error) {
        console.error('Error al obtener usuario por ID:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * [PROTEGIDO] Buscar usuarios por nombre.
 */
const searchUserByName = async (req, res) => {
    let connection;
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ success: false, message: 'Debe proporcionar un término de búsqueda "q".' });
        }
        const sanitizedQuery = sanitizeInput(q);
        if (containsSQLInjection(sanitizedQuery)) {
            return res.status(400).json({ success: false, error: 'INPUT_MALICIOSO', message: 'El término de búsqueda contiene patrones no permitidos.' });
        }
        connection = await getConnection();
        const [users] = await connection.execute('SELECT ID, Nombre, Correo, rol FROM users WHERE Nombre LIKE ?', [`%${sanitizedQuery}%`]);
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        console.error('Error al buscar usuarios:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * [PROTEGIDO] Actualizar un usuario.
 * La lógica de permisos es mixta y se queda en el controlador.
 */
const updateUser = async (req, res) => {
    let connection;
    try {
        const targetUserId = req.params.id;
        const currentUser = req.user;
        const updates = req.body;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, error: 'SIN_DATOS', message: 'Debe proporcionar al menos un campo para actualizar.' });
        }
        
        // =================================================================
        // 1. LÓGICA DE PERMISOS
        // =================================================================
        const canEditOthers = checkPermission(currentUser.rol, PERMISSIONS.EDIT_USERS);
        const isOwner = currentUser.userId.toString() === targetUserId;
        const canEditOwn = isOwner && checkPermission(currentUser.rol, PERMISSIONS.EDIT_OWN_PROFILE);

        if (!canEditOthers && !canEditOwn) {
            return res.status(403).json({ success: false, error: 'ACCESO_DENEGADO', message: 'No tienes permisos para modificar este usuario.' });
        }
        // Un usuario no puede cambiar su propio rol o estado, ni el de otros, sin el permiso general.
        if ((updates.rol || updates.Estado !== undefined) && !canEditOthers) {
            return res.status(403).json({ success: false, error: 'ACCESO_DENEGADO', message: 'No tienes permisos para modificar el rol o estado de un usuario.' });
        }

        // =================================================================
        // 2. SANITIZACIÓN Y SEGURIDAD
        // =================================================================
        const sanitizedUpdates = {};
        for (const key in updates) {
            const value = updates[key];
            if (typeof value === 'string') {
                const sanitizedValue = sanitizeInput(value);
                if (containsSQLInjection(sanitizedValue)) {
                    return res.status(400).json({ success: false, error: 'INPUT_MALICIOSO', message: `El campo '${key}' contiene patrones no permitidos.` });
                }
                sanitizedUpdates[key] = sanitizedValue;
            } else {
                sanitizedUpdates[key] = value; // Copiar valores no-string (como boolean)
            }
        }
        
        // Validaciones específicas post-sanitización
        if (sanitizedUpdates.Correo && !validator.isEmail(sanitizedUpdates.Correo)) {
            return res.status(400).json({ success: false, error: 'EMAIL_INVALIDO', message: 'El formato del correo no es válido.' });
        }
        if (sanitizedUpdates.Passwd) {
            sanitizedUpdates.Passwd = await bcrypt.hash(sanitizedUpdates.Passwd, 12);
        }

        // =================================================================
        // 3. VALIDACIONES DE NEGOCIO Y BASE DE DATOS
        // =================================================================
        connection = await getConnection();

        // Verificar que el usuario a editar existe
        const [targetUserQuery] = await connection.execute('SELECT ID, Correo, rol FROM users WHERE ID = ?', [targetUserId]);
        if (targetUserQuery.length === 0) {
            return res.status(404).json({ success: false, message: 'El usuario que intentas modificar no existe.' });
        }
        const targetUser = targetUserQuery[0];

        // Regla: Solo un admin puede editar a otro admin
        if (targetUser.rol === 'admin' && currentUser.rol !== 'admin') {
            return res.status(403).json({ success: false, error: 'ACCESO_DENEGADO', message: 'Solo un administrador puede modificar a otro administrador.' });
        }
        
        // Regla: Verificar que el nuevo correo no esté en uso por otro usuario
        if (sanitizedUpdates.Correo && sanitizedUpdates.Correo !== targetUser.Correo) {
            const [existingEmail] = await connection.execute('SELECT ID FROM users WHERE Correo = ? AND ID != ?', [sanitizedUpdates.Correo, targetUserId]);
            if (existingEmail.length > 0) {
                return res.status(409).json({ success: false, error: 'CORREO_EN_USO', message: 'El correo electrónico ya está en uso por otra cuenta.' });
            }
        }
        
        // =================================================================
        // 4. EJECUTAR ACTUALIZACIÓN
        // =================================================================
        const updateFields = Object.keys(sanitizedUpdates).map(field => `${field} = ?`).join(', ');
        const queryParams = [...Object.values(sanitizedUpdates), targetUserId];
        
        const [result] = await connection.execute(`UPDATE users SET ${updateFields} WHERE ID = ?`, queryParams);

        if (result.affectedRows === 0) {
             return res.status(404).json({ success: false, message: 'No se encontró el usuario para actualizar.' });
        }

        res.status(200).json({ success: true, message: 'Usuario actualizado exitosamente.' });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * [PROTEGIDO] Eliminar un usuario.
 */
const deleteUser = async (req, res) => {
    let connection;
    try {
        const targetUserId = req.params.id;
        const currentUser = req.user;

        if (currentUser.userId.toString() === targetUserId) {
            return res.status(400).json({ success: false, message: 'No puedes eliminar tu propia cuenta.' });
        }

        connection = await getConnection();
        const [userToDelete] = await connection.execute('SELECT rol FROM users WHERE ID = ?', [targetUserId]);
        if (userToDelete.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuario a eliminar no encontrado.' });
        }

        if (userToDelete[0].rol === 'admin' && currentUser.rol !== 'admin') {
            return res.status(403).json({ success: false, message: 'Solo un administrador puede eliminar a otro administrador.' });
        }
        if (userToDelete[0].rol === 'admin') {
            const [adminCount] = await connection.execute("SELECT COUNT(ID) as count FROM users WHERE rol = 'admin'");
            if (adminCount[0].count <= 1) {
                return res.status(409).json({ success: false, message: 'No se puede eliminar al último administrador.' });
            }
        }

        await connection.execute('DELETE FROM users WHERE ID = ?', [targetUserId]);
        res.status(200).json({ success: true, message: 'Usuario eliminado exitosamente.' });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = {
    register,
    getProfile,
    getAllUsers,
    getUserById,
    searchUserByName,
    updateUser,
    deleteUser
};