// En utils/permissions.js

const fs = require('fs');
const path = require('path');

// Ruta al archivo JSON
const permissionsPath = path.join(__dirname, '../config/permissions.json');

// 1. LISTA MAESTRA DE PERMISOS VÁLIDOS
//=============================================================
// NOTA SI VAS A AGREGAR UN NUEVO PERMISO TAMBIEN AGREGALO EN 
// PERMISSION_GROUPS EN SU DEBIDO LUGAR
//=============================================================
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
  
  // Visitas
  ADD_VISITS: 'add.visits',
  EDIT_VISITS: 'edit.visits',
  DELETE_VISITS: 'delete.visits',
  ASSIGN_VISITS: 'assign.visits',
  VIEW_OWN_VISITS: 'view.own.visits',
  VIEW_ALL_VISITS: 'view.all.visits',

  // Pedidos (Orders)
  ADD_ORDER: 'add.order',
  EDIT_ORDER_CONTENT: 'edit.order.content',
  EDIT_ORDER_STATUS: 'edit.order.status',
  CANCEL_ORDER: 'cancel.order',
  VIEW_OWN_ORDERS: 'view.own.order',
  VIEW_ALL_ORDERS: 'view.all.order',
  
  // Devoluciones (Returns)
  ISSUE_REFUND: 'issue.refund',
  EDIT_RETURN_STATUS: 'edit.return.status',
  VIEW_RETURNS: 'view.returns',

  // --- Pagos (Finanzas) ---
  ADD_PAYMENT: 'add.payment',      // Registrar un cobro
  VIEW_PAYMENTS: 'view.payments',  // Ver historial de pagos de una orden

  // --- Configuración de Empresa ---
  MANAGE_COMPANY: 'manage.company',
  MANAGE_CONTENT: 'manage.content',

  // --- Inventario (Almacén) ---
  ADJUST_INVENTORY: 'adjust.inventory',
  VIEW_INVENTORY_LOGS: 'view.inventory.logs'
};

// ---------------------------------------------------------
// 2. LISTA AGRUPADA (PARA ENVIAR AL FRONTEND)
// AQUÍ SÍ usas el formato que quieres.
// Usamos las constantes de arriba para no equivocarnos al escribir.
// ---------------------------------------------------------
const PERMISSION_GROUPS = {
  USERS: [
    PERMISSIONS.ADD_USERS,
    PERMISSIONS.EDIT_USERS,
    PERMISSIONS.DELETE_USERS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.EDIT_OWN_PROFILE
  ],
  PRODUCTS: [
    PERMISSIONS.ADD_PRODUCTS,
    PERMISSIONS.EDIT_PRODUCTS,
    PERMISSIONS.DELETE_PRODUCTS,
    PERMISSIONS.VIEW_PRODUCTS
  ],
  CATEGORY: [
    PERMISSIONS.ADD_CATEGORY,
    PERMISSIONS.VIEW_CATEGORY,
    PERMISSIONS.EDIT_CATEGORY,
    PERMISSIONS.DELETE_CATEGORY
  ],
  SUPPLIER: [
    PERMISSIONS.ADD_SUPPLIERS,
    PERMISSIONS.EDIT_SUPPLIERS,
    PERMISSIONS.DELETE_SUPPLIERS,
    PERMISSIONS.VIEW_SUPPLIERS
  ],
  CLIENTS: [
    PERMISSIONS.ADD_CLIENTS,
    PERMISSIONS.EDIT_CLIENTS,
    PERMISSIONS.DELETE_CLIENTS,
    PERMISSIONS.VIEW_CLIENTS
  ],
  VISITS: [
    PERMISSIONS.ADD_VISITS,
    PERMISSIONS.EDIT_VISITS,
    PERMISSIONS.DELETE_VISITS,
    PERMISSIONS.ASSIGN_VISITS,
    PERMISSIONS.VIEW_OWN_VISITS,
    PERMISSIONS.VIEW_ALL_VISITS,
  ],
  ORDERS: [
    PERMISSIONS.ADD_ORDER,
    PERMISSIONS.EDIT_ORDER_CONTENT,
    PERMISSIONS.EDIT_ORDER_STATUS,
    PERMISSIONS.CANCEL_ORDER,
    PERMISSIONS.VIEW_OWN_ORDERS,
    PERMISSIONS.VIEW_ALL_ORDERS,
  ],
  RETURNS: [
    PERMISSIONS.ISSUE_REFUND,
    PERMISSIONS.EDIT_RETURN_STATUS,
    PERMISSIONS.VIEW_RETURNS,
  ],
  PAYMENTS: [
    PERMISSIONS.ADD_PAYMENT,
    PERMISSIONS.VIEW_PAYMENTS
  ],
  INVENTORY: [
    PERMISSIONS.ADJUST_INVENTORY,
    PERMISSIONS.VIEW_INVENTORY_LOGS
  ],
  COMPANY: [
    PERMISSIONS.MANAGE_COMPANY,
    PERMISSIONS.MANAGE_CONTENT
  ]
};

// Array plano para validación rápida
const VALID_PERMISSIONS_LIST = Object.values(PERMISSIONS);



// --- FUNCIONES DE AYUDA ---

// Carga los permisos leyendo el archivo directamente (Más seguro que require con caché)
const loadPermissions = () => {
  try {
    const data = fs.readFileSync(permissionsPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error cargando permisos:', error);
    return {};
  }
};

// Variable en memoria para acceso rápido
let permissions = loadPermissions();

// Función para actualizar el archivo y la variable en memoria
const updatePermissionsFile = (newPermissions) => {
    try {
        fs.writeFileSync(permissionsPath, JSON.stringify(newPermissions, null, 2), 'utf8');
        permissions = newPermissions; // Actualizar memoria inmediatamente
        return true;
    } catch (error) {
        console.error('Error al escribir permisos:', error);
        throw error;
    }
};

/**
 * Verifica si un permiso existe en la Lista Maestra
 */
const isValidSystemPermission = (permission) => {
    if (permission === '*') return true;
    return VALID_PERMISSIONS_LIST.includes(permission);
};

const checkPermission = (userRole, requiredPermission) => {
  if (!userRole || !requiredPermission) return false;
  
  // Usamos la variable en memoria que siempre está actualizada gracias a updatePermissionsFile
  // (Si prefieres recargar siempre desde disco, descomenta la siguiente línea, pero es más lento)
  // permissions = loadPermissions(); 
  
  if (!permissions[userRole]) return false;
  if (permissions[userRole] === '*') return true;
  if (Array.isArray(permissions[userRole])) {
    return permissions[userRole].includes(requiredPermission);
  }
  return false;
};

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

/**
 * Obtiene la lista de roles disponibles actualmente en el sistema.
 * @returns {string[]} Array de nombres de roles (ej: ['admin', 'gerente'])
 */

const getSystemRoles = () => {
    const perms = loadPermissions();
    return Object.keys(perms);
};

module.exports = {
  PERMISSIONS, // <- permisos Backend
  PERMISSION_GROUPS, //<--permisos agrupados front
  checkPermission,
  requirePermission,
  requireAdmin,
  loadPermissions,
  updatePermissionsFile,
  isValidSystemPermission,
  VALID_PERMISSIONS_LIST, //<- Si se ocupa
  getSystemRoles
};