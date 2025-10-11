// Crear nuevo archivo: routes/productRoutes.js

const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/auth');
const { requirePermission, PERMISSIONS } = require('../utils/permissions');
const { validateProductPayload } = require('../middleware/productValidator');
const {
    createProduct,
    updateProduct,
    getAllProducts,
    searchProducts,
    deleteProduct
} = require('../controllers/productController');

// Crear un nuevo producto
router.post(
    '/',
    verifyToken,
    validateProductPayload,
    requirePermission(PERMISSIONS.ADD_PRODUCTS),
    createProduct
);

// Obtener todos los productos
router.get(
    '/',
    verifyToken,
    requirePermission(PERMISSIONS.VIEW_PRODUCTS),
    getAllProducts
);

// Buscar productos por nombre
router.get(
    '/search',
    verifyToken,
    requirePermission(PERMISSIONS.VIEW_PRODUCTS),
    searchProducts
);

// Actualizar un producto
router.put(
    '/:id',
    verifyToken,
    validateProductPayload,
    requirePermission(PERMISSIONS.EDIT_PRODUCTS),
    updateProduct
);

// Eliminar un producto
router.delete(
    '/:id',
    verifyToken,
    requirePermission(PERMISSIONS.DELETE_PRODUCTS),
    deleteProduct
);

module.exports = router;