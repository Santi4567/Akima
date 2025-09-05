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