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
    getProfile
} = require('../controllers/userController');


// --- RUTAS PÚBLICAS DE AUTENTICACIÓN ---
router.post('/register', validateRegisterPayload, register);
router.post('/login', login);


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


module.exports = router;