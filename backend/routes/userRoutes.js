/**
 * RUTAS DE USUARIOS (PROTEGIDAS)
 * - GET /profile: Obtener perfil del usuario autenticado
 * - GET /admin/*: Rutas solo para administradores
 * - Aplica middlewares de autenticación y autorización
 * - Define endpoints que requieren token válido
 * - Ubicacion  routes/userRoutes.js 
 */
const express = require('express');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Ruta para obtener perfil (protegida)
router.get('/profile', verifyToken, (req, res) => {
  res.json({
    success: true,
    message: 'Perfil del usuario',
    data: {
      user: req.user
    }
  });
});

// Ruta solo para admins
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

module.exports = router;