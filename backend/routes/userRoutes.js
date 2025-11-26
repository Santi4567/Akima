// Modificar/Reemplazar tu routes/userRoutes.js

const express = require('express');
const router = express.Router();

// Middlewares
const { verifyToken } = require('../middleware/auth');
const { requirePermission, PERMISSIONS } = require('../utils/permissions');
const { validateRegisterPayload, validateUpdatePayload } = require('../middleware/userValidator');

// Controladores
const { login } = require('../controllers/loginController'); // Login se mantiene separado
const {
    register,
    getAllUsers,
    getUserById,
    searchUserByName,
    updateUser,
    deleteUser,
    getProfile,
    updateSystemPermissions,
    getAvailablePermissions,
    createSystemRole,
    deleteSystemRole
} = require('../controllers/userController');


// --- RUTAS PÚBLICAS DE AUTENTICACIÓN ---

router.post('/login', login);

// CREAR USUARIO (Ahora es protegido y requiere permiso)
router.post(
    '/', 
    verifyToken, 
    validateRegisterPayload, 
    requirePermission(PERMISSIONS.ADD_USERS), // <--- El permiso
    register
);

// --- RUTAS PROTEGIDAS DE GESTIÓN DE USUARIOS ---

// Obtener el perfil del usuario logueado
router.get('/profile', verifyToken, getProfile);

// Obtener todos los usuarios
router.get('/', verifyToken, requirePermission(PERMISSIONS.VIEW_USERS), getAllUsers);

// Buscar usuarios por nombre
router.get('/search', verifyToken, requirePermission(PERMISSIONS.VIEW_USERS), searchUserByName);

// Obtener un usuario por ID
router.get('/:id', verifyToken, requirePermission(PERMISSIONS.VIEW_USERS), getUserById);

// Actualizar un usuario
router.put('/:id', verifyToken, validateUpdatePayload, updateUser);

// Eliminar un usuario
router.delete('/:id', verifyToken, requirePermission(PERMISSIONS.DELETE_USERS), deleteUser);

// =================================================================
// [NUEVO] RUTA DE ADMINISTRACIÓN DE PERMISOS
// =================================================================
router.put(
    '/admin/permissions',
    verifyToken,
    // Middleware en línea para doble seguridad: SOLO el rol 'admin' pasa.
    // (Aunque el controlador también lo valida, es bueno detenerlo aquí antes)
    (req, res, next) => {
        if (req.user.rol !== 'admin') {
             return res.status(403).json({ success: false, error: 'ACCESO_DENEGADO', message: 'Que intentas hacer??' });
        }
        next();
    },
    updateSystemPermissions // <--- 2. USAR EL NUEVO CONTROLADOR
);
/**
 * [GET] Obtener lista de todos los permisos disponibles
 */
router.get(
    '/admin/permissions-list',
    verifyToken,
    (req, res, next) => {
        if (req.user.rol !== 'admin') {
             return res.status(403).json({ success: false, error: 'ACCESO_DENEGADO', message: 'Nope' });
        }
        next();
    },
    getAvailablePermissions
);

/**
 * [SUPER ADMIN] Crear un nuevo Rol
 * POST /api/users/admin/roles
 */
router.post(
    '/admin/roles',
    verifyToken,
    (req, res, next) => {
        if (req.user.rol !== 'admin') return res.status(403).json({ message: 'Acceso denegado' });
        next();
    },
    createSystemRole
);
/**
 * [SUPER ADMIN] Eliminar un Rol existente
 * DELETE /api/users/admin/roles/:roleName
 */
router.delete(
    '/admin/roles/:roleName',
    verifyToken,
    (req, res, next) => {
        if (req.user.rol !== 'admin') return res.status(403).json({ message: 'Acceso denegado' });
        next();
    },
    deleteSystemRole
);

module.exports = router;