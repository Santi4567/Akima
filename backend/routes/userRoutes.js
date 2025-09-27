/**
 * RUTAS DE USUARIOS (PROTEGIDAS)
 * - GET /profile: Obtener perfil del usuario autenticado
 * - PUT /:userId: Modificar usuario
 * - DELETE /:userId: Eliminar usuario (solo admin)
 * - GET /admin/*: Rutas solo para administradores
 * - POST /admin/reload-permissions: Recargar permisos del sistema
 * - Aplica middlewares de autenticación y autorización
 * - Define endpoints que requieren token válido
 * - Ubicacion  routes/userRoutes.js 
 */

const express = require('express');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { updateUser } = require('../controllers/authController');
const { deleteUser } = require('../controllers/deleteUserController');
const { reloadPermissions, getSystemInfo } = require('../controllers/adminController');
const router = express.Router();

// ===== RUTAS DE USUARIO =====

// Ruta para obtener perfil (protegida)
router.get('/profile', verifyToken, (req, res) => {
  res.json({
    success: true,
    message: 'Perfil del usuario',
    data: {
      user: {
        id: req.user.userId,
        nombre: req.user.nombre,
        correo: req.user.correo,
        rol: req.user.rol
      }
    }
  });
});

// Ruta para modificar usuario (protegida)
router.put('/:userId', verifyToken, updateUser);

// Ruta para eliminar usuario (solo admin)
router.delete('/:userId', verifyToken, requireAdmin, deleteUser);

// ===== RUTAS ADMINISTRATIVAS (Solo Admin) =====

// Obtener lista de todos los usuarios
router.get('/admin/all', verifyToken, requireAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'Lista de usuarios (solo admin)',
    data: {
      user: req.user,
      message: 'Aquí irían todos los usuarios'
    }
  });
});

// Recargar permisos del sistema
router.post('/admin/reload-permissions', verifyToken, requireAdmin, reloadPermissions);

// Obtener información del sistema
router.get('/admin/system-info', verifyToken, requireAdmin, getSystemInfo);

module.exports = router;