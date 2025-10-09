// Crear nuevo archivo: routes/supplierRoutes.js

const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/auth');
const { requirePermission, PERMISSIONS } = require('../utils/permissions');
const { validateSupplierPayload } = require('../middleware/supplierValidator');
const {
    createSupplier,
    getAllSuppliers,
    updateSupplier,
    deleteSupplier,
    searchSuppliers
} = require('../controllers/supplierController');

// Crear un nuevo proveedor
router.post(
    '/',
    verifyToken,
    validateSupplierPayload, // Valida campos y longitud
    requirePermission(PERMISSIONS.ADD_SUPPLIERS),
    createSupplier
);

// Obtener todos los proveedores
router.get(
    '/',
    verifyToken,
    requirePermission(PERMISSIONS.VIEW_SUPPLIERS),
    getAllSuppliers
);

// Buscar proveedores por nombre
router.get(
    '/search',
    verifyToken,
    requirePermission(PERMISSIONS.VIEW_SUPPLIERS),
    searchSuppliers
);

// Actualizar un proveedor
router.put(
    '/:id',
    verifyToken,
    validateSupplierPayload, // Valida campos y longitud
    requirePermission(PERMISSIONS.EDIT_SUPPLIERS),
    updateSupplier
);

// Eliminar un proveedor
router.delete(
    '/:id',
    verifyToken,
    requirePermission(PERMISSIONS.DELETE_SUPPLIERS),
    deleteSupplier
);

module.exports = router;