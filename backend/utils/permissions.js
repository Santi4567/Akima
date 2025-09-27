/**
 * SISTEMA DE PERMISOS SIMPLIFICADO
 * - Gestión de permisos basado en roles
 * - Permisos: add, edit, delete, view para cada tabla
 * - Ubicación: utils/permissions.js
 */

const fs = require('fs');
const path = require('path');

// Función para cargar/recargar permisos desde archivo JSON
const loadPermissions = () => {
  try {
    const permissionsPath = path.join(__dirname, '../config/permissions.json');
    delete require.cache[require.resolve('../config/permissions.json')]; // Limpiar cache
    return JSON.parse(fs.readFileSync(permissionsPath, 'utf8'));
  } catch (error) {
    console.error('Error cargando permisos:', error);
    return {};
  }
};

// Cargar permisos inicialmente
let permissions = loadPermissions();

/**
 * Constantes de permisos disponibles
 */
const PERMISSIONS = {
  // Usuarios
  ADD_USERS: 'add.users',
  EDIT_USERS: 'edit.users',
  DELETE_USERS: 'delete.users',
  VIEW_USERS: 'view.users',
  
  // Productos
  ADD_PRODUCTS: 'add.products',
  EDIT_PRODUCTS: 'edit.products',
  DELETE_PRODUCTS: 'delete.products',
  VIEW_PRODUCTS: 'view.products',
  
  // Clientes
  ADD_CLIENTS: 'add.clients',
  EDIT_CLIENTS: 'edit.clients',
  DELETE_CLIENTS: 'delete.clients',
  VIEW_CLIENTS: 'view.clients',
  
  // Ventas
  VIEW_SALES: 'view.sales',
  
  // Inventario
  VIEW_INVENTORY: 'view.inventory',
  EDIT_INVENTORY: 'edit.inventory'
};

/**
 * Verifica si un rol tiene un permiso específico
 * Ahora recarga permisos en cada verificación para cambios dinámicos
 * @param {string} userRole - El rol del usuario
 * @param {string} permission - El permiso a verificar
 * @returns {boolean} - true si tiene el permiso, false si no
 */
const checkPermission = (userRole, permission) => {
  if (!userRole || !permission) {
    return false;
  }
  
  // Recargar permisos para obtener cambios recientes
  permissions = loadPermissions();
  
  // Si no existe el rol en el sistema de permisos
  if (!permissions[userRole]) {
    return false;
  }
  
  // Si el rol tiene permisos totales (*)
  if (permissions[userRole] === '*') {
    return true;
  }
  
  // Si el rol tiene permisos específicos (array)
  if (Array.isArray(permissions[userRole])) {
    return permissions[userRole].includes(permission);
  }
  
  return false;
};

/**
 * Verifica si un usuario puede editar su propia información
 * Solo los vendedores NO pueden editarse a sí mismos
 * @param {string} userRole - El rol del usuario
 * @returns {boolean}
 */
const canEditOwnProfile = (userRole) => {
  // Los vendedores NO pueden editar su propia información
  if (userRole === 'vendedor') {
    return false;
  }
  
  // Los demás roles sí pueden (con restricciones en los campos)
  return ['admin', 'gerente', 'administracion'].includes(userRole);
};

/**
 * Obtiene los campos que un rol puede editar en usuarios
 * @param {string} userRole - El rol del usuario
 * @param {boolean} isOwner - Si está editando su propio perfil
 * @returns {array} - Array de campos permitidos
 */
const getAllowedUserFields = (userRole, isOwner = false) => {
  // Admin puede editar todo
  if (userRole === 'admin') {
    return ['Nombre', 'Correo', 'Passwd', 'Estado', 'rol'];
  }
  
  // Administración puede gestionar usuarios completamente
  if (userRole === 'administracion') {
    return ['Nombre', 'Correo', 'Passwd', 'Estado', 'rol'];
  }
  
  // Gerente
  if (userRole === 'gerente') {
    if (isOwner) {
      // Editando su propio perfil: solo campos básicos
      return ['Nombre', 'Correo', 'Passwd'];
    } else {
      // Editando otro usuario: sin contraseña ni rol
      return ['Nombre', 'Correo', 'Estado'];
    }
  }
  
  // Vendedor no puede editar nada
  if (userRole === 'vendedor') {
    return [];
  }
  
  return [];
};

/**
 * Middleware para verificar permisos específicos en rutas
 * @param {string} requiredPermission - El permiso requerido
 * @returns {function} - Middleware de Express
 */
const requirePermission = (requiredPermission) => {
  return (req, res, next) => {
    const userRole = req.user?.rol || 'vendedor';
    
    if (!checkPermission(userRole, requiredPermission)) {
      return res.status(403).json({
        success: false,
        error: 'PERMISO_DENEGADO',
        message: `No tienes permisos para: ${requiredPermission}`
      });
    }
    
    next();
  };
};

/**
 * Middleware para verificar si es admin (equivalente al anterior requireAdmin)
 * @returns {function} - Middleware de Express
 */
const requireAdmin = (req, res, next) => {
  const userRole = req.user?.rol || 'vendedor';
  
  if (userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'ACCESO_DENEGADO',
      message: 'Se requieren permisos de administrador'
    });
  }
  
  next();
};

module.exports = {
  PERMISSIONS,
  checkPermission,
  canEditOwnProfile,
  getAllowedUserFields,
  requirePermission,
  requireAdmin,
  loadPermissions // Exportar función para recargar permisos manualmente
};