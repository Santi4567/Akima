// Reemplazar/Crear el archivo: controllers/userController.js

const bcrypt = require('bcrypt');
const validator = require('validator');
const { getConnection } = require('../config/database');
const { sanitizeInput, containsSQLInjection } = require('../utils/sanitizer');
const { checkPermission, PERMISSIONS } = require('../utils/permissions');
const { 
    updatePermissionsFile, 
    loadPermissions, 
    isValidSystemPermission,
    VALID_PERMISSIONS_LIST,
    getSystemRoles 
} = require('../utils/permissions');

/**
 * [PÚBLICO] Registrar un nuevo usuario.
 * La cuenta se crea como inactiva y con rol 'vendedor' por defecto.
 */
const register = async (req, res) => {
    let connection;
    try {
        // 1. Obtener datos del body
        const { Nombre, Correo, Passwd, Estado, rol, phone, address, sex } = req.body;

        // 2. Validar campos obligatorios básicos
        if (!Nombre || !Correo || !Passwd) {
            return res.status(400).json({ success: false, error: 'CAMPOS_REQUERIDOS', message: 'Los campos Nombre, Correo y Passwd son obligatorios.' });
        }

        // 3. Sanitización de todos los campos
        const sanitizedNombre = sanitizeInput(Nombre);
        const sanitizedCorreo = sanitizeInput(Correo);
        // Los opcionales pueden venir null/undefined, así que los validamos antes de sanitizar
        const sanitizedPhone = phone ? sanitizeInput(phone) : null;
        const sanitizedAddress = address ? sanitizeInput(address) : null;
        const sanitizedSex = sex ? sanitizeInput(sex) : null;

        // 4. Verificar patrones maliciosos (SQL Injection) en los campos de texto
        if (containsSQLInjection(sanitizedNombre) || containsSQLInjection(sanitizedCorreo) || containsSQLInjection(Passwd)) {
            return res.status(400).json({ success: false, error: 'INPUT_MALICIOSO', message: 'Los datos contienen patrones no permitidos.' });
        }
        if (sanitizedPhone && containsSQLInjection(sanitizedPhone)) {
             return res.status(400).json({ success: false, error: 'INPUT_MALICIOSO', message: 'El teléfono contiene patrones no permitidos.' });
        }
        if (sanitizedAddress && containsSQLInjection(sanitizedAddress)) {
             return res.status(400).json({ success: false, error: 'INPUT_MALICIOSO', message: 'La dirección contiene patrones no permitidos.' });
        }

        // 5. Validar formato de email
        if (!validator.isEmail(sanitizedCorreo)) {
            return res.status(400).json({ success: false, error: 'EMAIL_INVALIDO', message: 'El formato del correo no es válido.' });
        }

        connection = await getConnection();

        // 6. Validar Correo Duplicado
        const [existing] = await connection.execute('SELECT ID FROM users WHERE Correo = ?', [sanitizedCorreo]);
        if (existing.length > 0) {
            return res.status(409).json({ success: false, error: 'CORREO_YA_EXISTE', message: 'El correo electrónico ya está registrado.' });
        }

        // (Opcional) Validar Teléfono Duplicado si se proporcionó uno
        if (sanitizedPhone) {
            const [existingPhone] = await connection.execute('SELECT ID FROM users WHERE phone = ?', [sanitizedPhone]);
            if (existingPhone.length > 0) {
                return res.status(409).json({ success: false, error: 'TELEFONO_YA_EXISTE', message: 'El número de teléfono ya está registrado.' });
            }
        }

        // 7. Encriptar contraseña
        const hashedPassword = await bcrypt.hash(Passwd, 12);

        // 8. Definir valores por defecto si no se enviaron
        // Como es un CRM privado, si el admin no especifica, asumimos 'vendedor' e 'inactivo' (0) o 'activo' (1) según prefieras.
        // Aquí lo dejaré activo (1) por defecto si lo crea un admin.
        const rolToSave = rol || 'vendedor';
        const estadoToSave = Estado !== undefined ? Estado : 1; 

        // 9. Insertar en la Base de Datos
        const [result] = await connection.execute(
            'INSERT INTO users (Nombre, Correo, Passwd, Estado, rol, phone, address, sex) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
                sanitizedNombre, 
                sanitizedCorreo, 
                hashedPassword, 
                estadoToSave, 
                rolToSave,
                sanitizedPhone,
                sanitizedAddress,
                sanitizedSex
            ]
        );

        res.status(201).json({ 
            success: true, 
            message: 'Usuario creado exitosamente.', 
            data: { 
                id: result.insertId,
                nombre: sanitizedNombre,
                correo: sanitizedCorreo,
                rol: rolToSave
            } 
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * [PROTEGIDO] Obtener el perfil del usuario actualmente autenticado
 * Ahora también incluye la lista de permisos del usuario)
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
        const [users] = await connection.execute('SELECT ID, Nombre, Correo, Estado, phone, rol FROM users ORDER BY Nombre ASC');
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
        const [user] = await connection.execute('SELECT ID, Nombre, Correo, Estado, phone, rol FROM users WHERE ID = ?', [id]);
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
 * - Lógica de permisos mixta (propio vs otros).
 * - Manejo de campos sensibles (rol, estado).
 * - Actualización dinámica de campos.
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
        
        // 1. LÓGICA DE PERMISOS
        const canEditOthers = checkPermission(currentUser.rol, PERMISSIONS.EDIT_USERS);
        const isOwner = currentUser.userId.toString() === targetUserId;
        const canEditOwn = isOwner && checkPermission(currentUser.rol, PERMISSIONS.EDIT_OWN_PROFILE);

        // Si no tiene permiso ni para otros ni para sí mismo -> Acceso Denegado
        if (!canEditOthers && !canEditOwn) {
            return res.status(403).json({ success: false, error: 'ACCESO_DENEGADO', message: 'No tienes permisos para modificar este usuario.' });
        }

        // Protección de campos sensibles: 'rol' y 'Estado'
        // Solo alguien con permiso de editar OTROS (como un admin/gerente) puede cambiarlos.
        // Un usuario normal no puede cambiarse su propio rol ni estado.
        if ((updates.rol || updates.Estado !== undefined) && !canEditOthers) {
            return res.status(403).json({ success: false, error: 'ACCESO_DENEGADO', message: 'No tienes permisos para modificar el rol o estado de un usuario.' });
        }

        // 2. SANITIZACIÓN Y PREPARACIÓN
        const sanitizedUpdates = {};
        
        for (const key in updates) {
            const value = updates[key];
            
            // Solo procesamos campos conocidos para evitar basura en la BD
            // (Aunque el validador middleware ya debió filtrar los campos extraños, esto es doble seguridad)
            if (['Nombre', 'Correo', 'Passwd', 'Estado', 'rol', 'phone', 'address', 'sex'].includes(key)) {
                
                if (typeof value === 'string') {
                    const sanitizedValue = sanitizeInput(value);
                    if (containsSQLInjection(sanitizedValue)) {
                        return res.status(400).json({ success: false, error: 'INPUT_MALICIOSO', message: `El campo '${key}' contiene patrones no permitidos.` });
                    }
                    sanitizedUpdates[key] = sanitizedValue;
                } else {
                    sanitizedUpdates[key] = value; // Para booleanos o números
                }
            }
        }
        
        // 3. VALIDACIONES ESPECÍFICAS POST-SANITIZACIÓN
        
        // Validar Email
        if (sanitizedUpdates.Correo && !validator.isEmail(sanitizedUpdates.Correo)) {
            return res.status(400).json({ success: false, error: 'EMAIL_INVALIDO', message: 'El formato del correo no es válido.' });
        }
        
        // Validar Teléfono (Solo números, para WhatsApp)
        if (sanitizedUpdates.phone && !/^[0-9]+$/.test(sanitizedUpdates.phone)) {
             return res.status(400).json({ success: false, error: 'TELEFONO_INVALIDO', message: 'El teléfono debe contener solo números.' });
        }

        // Encriptar Contraseña si se está actualizando
        if (sanitizedUpdates.Passwd) {
            sanitizedUpdates.Passwd = await bcrypt.hash(sanitizedUpdates.Passwd, 12);
        }

        // 4. VALIDACIONES DE NEGOCIO Y BD
        connection = await getConnection();

        // Verificar que el usuario a editar existe y obtener sus datos actuales
        const [targetUserQuery] = await connection.execute('SELECT ID, Correo, rol, phone FROM users WHERE ID = ?', [targetUserId]);
        if (targetUserQuery.length === 0) {
            return res.status(404).json({ success: false, message: 'El usuario que intentas modificar no existe.' });
        }
        const targetUser = targetUserQuery[0];

        // Regla: Solo un admin puede editar a otro admin
        if (targetUser.rol === 'admin' && currentUser.rol !== 'admin') {
            return res.status(403).json({ success: false, error: 'ACCESO_DENEGADO', message: 'Solo un administrador puede modificar a otro administrador.' });
        }
        
        // Regla: Verificar duplicado de Correo
        if (sanitizedUpdates.Correo && sanitizedUpdates.Correo !== targetUser.Correo) {
            const [existingEmail] = await connection.execute('SELECT ID FROM users WHERE Correo = ? AND ID != ?', [sanitizedUpdates.Correo, targetUserId]);
            if (existingEmail.length > 0) {
                return res.status(409).json({ success: false, error: 'CORREO_EN_USO', message: 'El correo electrónico ya está en uso por otra cuenta.' });
            }
        }

        // Regla: Verificar duplicado de Teléfono
        if (sanitizedUpdates.phone && sanitizedUpdates.phone !== targetUser.phone) {
            const [existingPhone] = await connection.execute('SELECT ID FROM users WHERE phone = ? AND ID != ?', [sanitizedUpdates.phone, targetUserId]);
            if (existingPhone.length > 0) {
                return res.status(409).json({ success: false, error: 'TELEFONO_EN_USO', message: 'El teléfono ya está registrado en otra cuenta.' });
            }
        }
        
        // 5. EJECUTAR ACTUALIZACIÓN DINÁMICA
        // Construimos la query solo con los campos que se enviaron
        const updateFields = Object.keys(sanitizedUpdates).map(field => `${field} = ?`).join(', ');
        const queryParams = [...Object.values(sanitizedUpdates), targetUserId];
        
        if (updateFields.length === 0) {
             return res.status(400).json({ success: false, message: 'No hay campos válidos para actualizar.' });
        }

        await connection.execute(`UPDATE users SET ${updateFields} WHERE ID = ?`, queryParams);

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
//==================================================seccion de permisos=================================================

/**
 * [SUPER ADMIN] Actualizar permisos del sistema
 * - Fusiona cambios (no borra roles que no envíes).
 * - Valida que los permisos existan en la Lista Maestra.
 * - Sanitiza entradas.
 */
const updateSystemPermissions = async (req, res) => {
    try {
        const currentUser = req.user;
        const updates = req.body;

        // 1. SEGURIDAD: Solo admin
        if (currentUser.rol !== 'admin') {
            return res.status(403).json({ success: false, error: 'ACCESO_PROHIBIDO', message: 'Solo el Super Admin puede modificar permisos.' });
        }

        if (typeof updates !== 'object' || updates === null) {
            return res.status(400).json({ success: false, message: 'El cuerpo debe ser un objeto JSON.' });
        }

        const currentPermissions = loadPermissions();
        const newPermissions = { ...currentPermissions };

        // 3. PROCESAR Y VALIDAR
        for (const [rawRole, perms] of Object.entries(updates)) {
            
            // A. El Rol SÍ lo sanitizamos (es una clave dinámica y podría usarse mal)
            // Pero relajamos la validación SQLi aquí también si confías en tus inputs, 
            // aunque mantenerla para el nombre del rol es buena práctica.
            const role = sanitizeInput(rawRole);
            
            // B. Estructura
            if (perms !== '*' && !Array.isArray(perms)) {
                return res.status(400).json({ success: false, message: `Los permisos para '${role}' deben ser un array o '*'.` });
            }

            // C. VALIDAR PERMISOS
            if (Array.isArray(perms)) {
                // Eliminamos duplicados
                const uniquePerms = [...new Set(perms)];

                for (const p of uniquePerms) {
                    if (typeof p !== 'string') return res.status(400).json({ success: false, message: `Permiso inválido en '${role}'.` });
                    
                    // =================================================================
                    // CAMBIO: ELIMINADA LA VALIDACIÓN DE SQL INJECTION AQUÍ
                    // =================================================================
                    // Ya no usamos containsSQLInjection(p).
                    // Confiamos 100% en la Lista Maestra.
                    
                    // Validación contra Whitelist (La única que importa)
                    if (!isValidSystemPermission(p)) {
                        return res.status(400).json({ 
                            success: false, 
                            error: 'PERMISO_INEXISTENTE', 
                            message: `El permiso '${p}' no existe en el sistema.` 
                        });
                    }
                }
                newPermissions[role] = uniquePerms;
            } else {
                newPermissions[role] = perms;
            }
        }

        // 4. Proteger Admin
        if (!newPermissions['admin'] || newPermissions['admin'] !== '*') {
            return res.status(400).json({ success: false, error: 'PROTECCION_ADMIN', message: 'No se puede modificar el rol de admin.' });
        }

        updatePermissionsFile(newPermissions);

        res.status(200).json({ 
            success: true, 
            message: 'Permisos actualizados correctamente.',
            data: newPermissions 
        });

    } catch (error) {
        console.error('Error al actualizar permisos:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    }
};
/**
 * [SOLO ADMIN] Obtener la lista maestra de todos los permisos disponibles
 * Útil para mostrar opciones en el Frontend al editar roles.
 */
const getAvailablePermissions = (req, res) => {
    try {
        // Seguridad extra: Solo admin
        if (req.user.rol !== 'admin') {
            return res.status(403).json({ success: false, message: 'Acceso denegado.' });
        }

        res.status(200).json({ 
            success: true, 
            message: 'Lista de permisos del sistema obtenida.',
            // Esto devuelve: ['add.users', 'edit.users', 'view.products', ...]
            data: VALID_PERMISSIONS_LIST 
        });

    } catch (error) {
        console.error('Error al obtener lista de permisos:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    }
};

/**
 * [SUPER ADMIN] Crear un nuevo ROL en el sistema
 */
const createSystemRole = async (req, res) => {
    try {
        const currentUser = req.user;
        const { roleName } = req.body;

        // 1. Seguridad
        if (currentUser.rol !== 'admin') {
            return res.status(403).json({ success: false, message: 'Solo el Super Admin puede crear roles.' });
        }

        // 2. Validar input
        if (!roleName || typeof roleName !== 'string') {
            return res.status(400).json({ success: false, message: 'Se requiere el campo "roleName" (texto).' });
        }

        // 3. Sanitizar nombre del rol (Solo letras minúsculas, números y guiones bajos)
        // Esto es importante para que sea una "clave" válida en JSON y fácil de usar.
        const cleanRoleName = sanitizeInput(roleName).toLowerCase().replace(/[^a-z0-9_]/g, '');

        if (cleanRoleName.length < 3) {
            return res.status(400).json({ success: false, message: 'El nombre del rol es muy corto o contiene caracteres inválidos.' });
        }

        // 4. Verificar si ya existe
        const currentRoles = getSystemRoles();
        if (currentRoles.includes(cleanRoleName)) {
            return res.status(409).json({ success: false, message: `El rol '${cleanRoleName}' ya existe.` });
        }

        // 5. Guardar el nuevo rol
        const currentPermissions = loadPermissions();
        
        // Lo inicializamos como un array vacío (sin permisos)
        currentPermissions[cleanRoleName] = [];

        updatePermissionsFile(currentPermissions);

        res.status(201).json({ 
            success: true, 
            message: `Rol '${cleanRoleName}' creado exitosamente. Ahora puedes asignarle permisos.`,
            data: { role: cleanRoleName } 
        });

    } catch (error) {
        console.error('Error al crear rol:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    }
};

/**
 * [SUPER ADMIN] Eliminar un Rol del sistema
 */
const deleteSystemRole = async (req, res) => {
    try {
        const currentUser = req.user;
        // Recibimos el nombre del rol por la URL (ej: /admin/roles/logistica)
        const roleName = req.params.roleName; 

        // 1. Seguridad: Solo admin
        if (currentUser.rol !== 'admin') {
            return res.status(403).json({ success: false, message: 'Solo el Super Admin puede eliminar roles.' });
        }

        // 2. Sanitizar el nombre del rol
        const cleanRoleName = sanitizeInput(roleName);

        // 3. PROTECCIÓN CRÍTICA: No borrar al admin
        if (cleanRoleName === 'admin') {
            return res.status(400).json({ 
                success: false, 
                error: 'PROTECCION_SISTEMA', 
                message: 'No se puede eliminar el rol de sistema "admin".' 
            });
        }

        // 4. Cargar permisos actuales
        const currentPermissions = loadPermissions();

        // 5. Verificar que el rol exista
        if (!currentPermissions[cleanRoleName]) {
            return res.status(404).json({ success: false, message: `El rol '${cleanRoleName}' no existe.` });
        }

        // 6. Eliminar el rol del objeto
        delete currentPermissions[cleanRoleName];

        // 7. Guardar cambios en el archivo
        updatePermissionsFile(currentPermissions);

        res.status(200).json({ 
            success: true, 
            message: `Rol '${cleanRoleName}' eliminado correctamente del sistema.` 
        });

    } catch (error) {
        console.error('Error al eliminar rol:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    }
};

/**
 * [SUPER ADMIN] Obtener estadísticas de roles
 * Devuelve la lista de roles y cuántos usuarios tienen asignado cada uno.
 */
const getRolesWithUserCount = async (req, res) => {
    let connection;
    try {
        // 1. Seguridad: Solo Admin
        if (req.user.rol !== 'admin') {
            return res.status(403).json({ success: false, message: 'Acceso denegado. Solo administradores.' });
        }

        // 2. Obtener los roles definidos en el sistema (JSON)
        const systemRoles = getSystemRoles();

        connection = await getConnection();

        // 3. Obtener el conteo real desde la Base de Datos
        // Esto nos devuelve algo como: [ { rol: 'admin', total: 2 }, { rol: 'vendedor', total: 10 } ]
        const [dbCounts] = await connection.execute(
            'SELECT rol, COUNT(ID) as total FROM users GROUP BY rol'
        );

        // 4. Procesar y Fusionar Datos
        // Convertimos el array de la BD a un objeto para búsqueda rápida: { "admin": 2, "vendedor": 10 }
        const countsMap = {};
        dbCounts.forEach(row => {
            countsMap[row.rol] = row.total;
        });

        // Mapeamos los roles del sistema y le asignamos su conteo (o 0 si no hay nadie)
        const stats = systemRoles.map(roleName => ({
            role: roleName,
            count: countsMap[roleName] || 0 // Si no existe en el mapa, es 0
        }));

        res.status(200).json({ 
            success: true, 
            message: 'Estadísticas de roles obtenidas.',
            data: stats 
        });

    } catch (error) {
        console.error('Error al obtener estadísticas de roles:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};
/**
 * [PROTEGIDO] Obtener lista simple de roles disponibles
 * Útil para llenar selects/dropdowns en el Frontend.
 */
const getRolesList = (req, res) => {
    try {
        // 1. Obtener las claves del JSON (ej: ['admin', 'gerente', 'vendedor'])
        const roles = getSystemRoles();

        res.status(200).json({ 
            success: true, 
            message: 'Lista de roles obtenida.',
            data: roles 
        });

    } catch (error) {
        console.error('Error al obtener roles:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    }
};

/**
 * [PROTEGIDO] Obtener los permisos de un rol específico
 * URL: GET /api/users/roles/:roleName/permissions
 */
const getRolePermissions = (req, res) => {
    try {
        const { roleName } = req.params;

        // 1. Cargar la configuración
        const allPermissions = loadPermissions();

        // 2. Verificar si el rol existe
        // Usamos hasOwnProperty para seguridad
        if (!Object.prototype.hasOwnProperty.call(allPermissions, roleName)) {
            return res.status(404).json({ success: false, message: `El rol '${roleName}' no existe en el sistema.` });
        }

        // 3. Devolver los permisos
        const permissions = allPermissions[roleName];

        res.status(200).json({ 
            success: true, 
            message: `Permisos del rol '${roleName}' obtenidos.`,
            data: permissions 
        });

    } catch (error) {
        console.error('Error al obtener permisos del rol:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    }
};

module.exports = {
    register,
    getProfile,
    getAllUsers,
    getUserById,
    searchUserByName,
    updateUser,
    deleteUser,
    updateSystemPermissions,
    getAvailablePermissions,
    createSystemRole,
    deleteSystemRole,
    getRolesWithUserCount,
    getRolesList,
    getRolePermissions
};