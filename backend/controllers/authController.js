/**
 * CONTROLADOR DE AUTENTICACIÓN
 * - Lógica de registro de usuarios (validaciones, sanitización, encriptación)
 * - Lógica de login (verificación de credenciales, generación de JWT)
 * - Validaciones de seguridad (SQL injection, XSS)
 * - Interacción con la base de datos
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const { getConnection } = require('../config/database');
const { sanitizeInput, containsSQLInjection } = require('../utils/sanitizer');
const { JWT_SECRET } = require('../middleware/auth');

// Registrar nuevo usuario
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

    // 13. Insertar usuario
    const [result] = await connection.execute(
      'INSERT INTO users (Nombre, Correo, Passwd) VALUES (?, ?, ?)',
      [sanitizedNombre, sanitizedCorreo, hashedPassword]
    );

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        id: result.insertId,
        nombre: sanitizedNombre,
        correo: sanitizedCorreo
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

// Login de usuario
const login = async (req, res) => {
  let connection;
  
  try {
    // Validaciones similares al registro...
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

    const { Correo, Passwd } = req.body;
    
    if (!Correo || !Passwd) {
      return res.status(400).json({
        success: false,
        error: 'CAMPOS_REQUERIDOS',
        message: 'Los campos Correo y Passwd son obligatorios'
      });
    }

    const sanitizedCorreo = sanitizeInput(Correo);
    const sanitizedPasswd = sanitizeInput(Passwd);

    if (!sanitizedCorreo || !sanitizedPasswd) {
      return res.status(400).json({
        success: false,
        error: 'CAMPOS_VACIOS_POST_SANITIZACION',
        message: 'Los campos no pueden estar vacíos'
      });
    }

    if (containsSQLInjection(sanitizedCorreo) || containsSQLInjection(sanitizedPasswd)) {
      return res.status(400).json({
        success: false,
        error: 'INPUT_MALICIOSO',
        message: 'Los datos contienen caracteres no permitidos'
      });
    }

    if (!validator.isEmail(sanitizedCorreo)) {
      return res.status(400).json({
        success: false,
        error: 'EMAIL_INVALIDO',
        message: 'El formato del correo no es válido'
      });
    }

    connection = await getConnection();

    const [users] = await connection.execute(
      'SELECT ID, Nombre, Correo, Passwd, Estado, Admin FROM users WHERE Correo = ?',
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

    // VERIFICAR ESTADO
    if (!user.Estado) {
      return res.status(403).json({
        success: false,
        error: 'CUENTA_INACTIVA',
        message: 'Tu cuenta está inactiva. Contacta al administrador.'
      });
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(sanitizedPasswd, user.Passwd);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'CREDENCIALES_INVALIDAS',
        message: 'Correo o contraseña incorrectos'
      });
    }

    // Crear JWT
    const payload = {
      userId: user.ID,
      nombre: user.Nombre,
      correo: user.Correo,
      isAdmin: Boolean(user.Admin),
      iat: Math.floor(Date.now() / 1000),
      type: 'access_token'
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: '12h',
      issuer: 'akima-api',
      subject: user.ID.toString()
    });

    res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: {
        token: token,
        user: {
          id: user.ID,
          nombre: user.Nombre,
          correo: user.Correo,
          isAdmin: Boolean(user.Admin)
        },
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
  register,
  login
};
