/**
 * CONTROLADOR DE AUTENTICACIÓN
 * - Lógica de login de usuarios (validaciones, sanitización, JWT)
 * - Validaciones de seguridad (SQL injection, XSS)
 * - Sistema basado en roles
 * - Interacción con la base de datos
 * - Ubicacion controllers/loginController.js
 */
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const { getConnection } = require('../config/database');
const { sanitizeInput, containsSQLInjection } = require('../utils/sanitizer');
const { JWT_SECRET } = require('../middleware/auth');

// Login de usuario -----------------------------------------------------------------------------------
const login = async (req, res) => {
  let connection;
  
  try {
    // 1. Validar campos permitidos
    const allowedFields = ['Correo', 'Passwd'];
    const receivedFields = Object.keys(req.body);
    
    const extraFields = receivedFields.filter(field => !allowedFields.includes(field));
    if (extraFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'CAMPOS_NO_PERMITIDOS',
        message: `Solo se permiten los campos: ${allowedFields.join(', ')}`
      });
    }

    // 2. Validar campos requeridos
    const { Correo, Passwd } = req.body;
    
    if (!Correo || !Passwd) {
      return res.status(400).json({
        success: false,
        error: 'CAMPOS_REQUERIDOS',
        message: 'Los campos Correo y Passwd son obligatorios'
      });
    }

    // 3. Sanitizar inputs
    const sanitizedCorreo = sanitizeInput(Correo);
    const sanitizedPasswd = sanitizeInput(Passwd);

    if (!sanitizedCorreo || !sanitizedPasswd) {
      return res.status(400).json({
        success: false,
        error: 'CAMPOS_VACIOS',
        message: 'Los campos no pueden estar vacíos'
      });
    }

    // 4. Verificar patrones maliciosos
    if (containsSQLInjection(sanitizedCorreo) || containsSQLInjection(sanitizedPasswd)) {
      return res.status(400).json({
        success: false,
        error: 'INPUT_MALICIOSO',
        message: 'Los datos contienen caracteres no permitidos'
      });
    }

    // 5. Validar formato de email
    if (!validator.isEmail(sanitizedCorreo)) {
      return res.status(400).json({
        success: false,
        error: 'EMAIL_INVALIDO',
        message: 'El formato del correo no es válido'
      });
    }

    // 6. Conectar a base de datos
    connection = await getConnection();

    // 7. Buscar usuario por correo (SIN columna Admin, CON columna rol)
    const [users] = await connection.execute(
      'SELECT ID, Nombre, Correo, Passwd, Estado, rol FROM users WHERE Correo = ?',
      [sanitizedCorreo]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'CREDENCIALES_INVALIDAS',
        message: 'Correo o contraseña incorrectos'
      });
    }

    const user = users[0];

    // 8. Verificar estado de la cuenta
    if (!user.Estado) {
      return res.status(403).json({
        success: false,
        error: 'CUENTA_INACTIVA',
        message: 'Tu cuenta está inactiva. Contacta al administrador.'
      });
    }

    // 9. Verificar contraseña
    const isPasswordValid = await bcrypt.compare(sanitizedPasswd, user.Passwd);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'CREDENCIALES_INVALIDAS',
        message: 'Correo o contraseña incorrectos'
      });
    }

    // 10. Crear JWT con información del rol
    const userRole = user.rol || 'vendedor'; // Rol por defecto si es null
    
    const payload = {
     // userId: user.ID,
     // nombre: user.Nombre,
     // correo: user.Correo,
     // rol: userRole,
      iat: Math.floor(Date.now() / 1000),
      type: 'access_token'
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: '12h',
      issuer: 'akima-api',
      subject: user.ID.toString()
    });

    // 11. Respuesta exitosa
    res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: {
        token: token,
        // user: {
        //  id: user.ID,
        //  nombre: user.Nombre,
        //  correo: user.Correo,
        //  rol: userRole
        //},
        tokenInfo: {
          type: 'Bearer',
          expiresIn: '12h',
          expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      error: 'ERROR_SERVIDOR',
      message: 'Error interno del servidor'
    });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  login
};