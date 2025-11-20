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
  EDIT_OWN_PROFILE: 'edit.own.profile',
  
  // Productos
  ADD_PRODUCTS: 'add.products',
  EDIT_PRODUCTS: 'edit.products',
  DELETE_PRODUCTS: 'delete.products',
  VIEW_PRODUCTS: 'view.products',

  // Categorias
  ADD_CATEGORY: 'add.category',
  VIEW_CATEGORY: 'view.category',
  EDIT_CATEGORY: 'edit.category',
  DELETE_CATEGORY: 'delete.category',

  // Proveedores
  ADD_SUPPLIERS: 'add.suppliers',
  EDIT_SUPPLIERS: 'edit.suppliers',
  DELETE_SUPPLIERS: 'delete.suppliers',
  VIEW_SUPPLIERS: 'view.suppliers',
  
  // Clientes
  ADD_CLIENTS: 'add.clients',
  EDIT_CLIENTS: 'edit.clients',
  DELETE_CLIENTS: 'delete.clients',
  VIEW_CLIENTS: 'view.clients',
  
  // Visitas (Todo plural)
  ADD_VISITS: 'add.visits',
  EDIT_VISITS: 'edit.visits',
  DELETE_VISITS: 'delete.visits',
  VIEW_OWN_VISITS: 'view.own.visits',
  VIEW_ALL_VISITS: 'view.all.visits',
  ASSIGN_VISITS: 'assign.visits', 

  // Oredenes/Pedidos 
  ADD_ORDER: 'add.order',
  VIEW_ALL_ORDERS : 'view.all.order', 
  VIEW_OWN_ORDERS: 'view.own.order', 
  EDIT_ORDER_CONTENT: 'edit.order.content', 
  EDIT_ORDER_STATUS: 'edit.order.status',
  CANCEL_ORDER: 'cancel.order',
  
  
  // Returns 
  ISSUE_REFUND: 'issue.refund',       
  EDIT_RETURN_STATUS: 'edit.return.status' 
};

/**
 * Verifica si un rol tiene un permiso específico.
 * Esta es ahora nuestra ÚNICA función para verificar permisos.
 * @param {string} userRole - El rol del usuario
 * @param {string} permission - El permiso a verificar
 * @returns {boolean} - true si tiene el permiso, false si no
 */
const checkPermission = (userRole, permission) => {
  if (!userRole || !permission) return false;
  
  permissions = loadPermissions();
  
  if (!permissions[userRole]) return false;
  if (permissions[userRole] === '*') return true;//verificacion de admin 
  if (Array.isArray(permissions[userRole])) {
    return permissions[userRole].includes(permission);
  }
  
  return false;
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
  requirePermission,
  requireAdmin,
  loadPermissions // Exportar función para recargar permisos manualmente
};