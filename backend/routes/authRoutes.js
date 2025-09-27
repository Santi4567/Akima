/**
 * RUTAS DE AUTENTICACIÓN
 * - POST /register: Registro de nuevos usuarios
 * - POST /login: Inicio de sesión
 * - Conecta las rutas HTTP con los controladores
 * - Define los endpoints públicos de autenticación
 * - Ubicacion routes/authRoutes.js
 */

const express = require('express');
const { register } = require('../controllers/authController');
const { login } = require('../controllers/loginController');


const router = express.Router();

router.post('/register', register);
router.post('/login', login);

module.exports = router;
