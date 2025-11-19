// Crear nuevo archivo: routes/productRoutes.js

const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/auth');
const { requirePermission, PERMISSIONS } = require('../utils/permissions');
const { validateProductPayload } = require('../middleware/productValidator');
//  Imagenes
const upload = require('../middleware/upload'); // <-- Importar Multer
const { uploadProductImage,
        deleteProductImage,
        getProductImages
 } = require('../controllers/productController');

 //Productos 
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

//===========================================
// Imagenes 
//===========================================
/**
 * Subir imagen de producto
 * Permiso: edit.products (o add.products, según tu lógica)
 */
router.post(
    '/:id/images',
    verifyToken,
    requirePermission(PERMISSIONS.EDIT_PRODUCTS), // Solo quien puede editar productos sube fotos
    upload.single('image'), // 'image' es el nombre del campo en el Form-Data
    uploadProductImage
);
router.delete(
    '/images/:id', // El :id es el ID de la IMAGEN (de la tabla product_images), no del producto
    verifyToken,
    requirePermission(PERMISSIONS.EDIT_PRODUCTS),
    deleteProductImage
);
/**
 * Obtener imágenes de un producto
 * URL: GET /api/products/:id/images
 */
router.get(
    '/:id/images',
    verifyToken,
    requirePermission(PERMISSIONS.VIEW_PRODUCTS),
    getProductImages
);

module.exports = router;