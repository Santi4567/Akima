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
        getProductImages,
 } = require('../controllers/productController');

 //Productos 
const {
    createProduct,
    updateProduct,
    getAllProducts,
    searchProducts,
    deleteProduct
} = require('../controllers/productController');

//Publicos -catalogo web
const { getWebCatalog,
        getWebProductById,
        searchWebProducts
 } = require('../controllers/productController');

 // Inventario 
const { 
    getInventoryLogs,
    updateProductStock,
    getProductInventoryLogs 
} = require('../controllers/productController');
const { 
    // validador de stock
    validateStockUpdate 
} = require('../middleware/productValidator');

//===========================================
// Rutas privadas Productos
//===========================================

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
// Rutas privadas Inventario
//===========================================

/**
 * Ver bitácora de movimientos de inventario
 * GET /api/products/inventory-logs
 */
router.get(
    '/inventory-logs',
    verifyToken,
    requirePermission(PERMISSIONS.VIEW_INVENTORY_LOGS),
    getInventoryLogs
);

// GET /api/products/:id/inventory-logs
router.get(
    '/:id/inventory-logs',
    verifyToken,
    requirePermission(PERMISSIONS.VIEW_INVENTORY_LOGS),
    getProductInventoryLogs
);

/**
 * Ajuste manual de inventario
 * PUT /api/products/:id/inventory
 */
router.put(
    '/:id/inventory',
    verifyToken,
    requirePermission(PERMISSIONS.ADJUST_INVENTORY), // Permiso exclusivo de almacén
    validateStockUpdate,
    updateProductStock
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


// =================================================================
// RUTAS PÚBLICAS (CATÁLOGO WEB)
// =================================================================

/**
 * Obtener catálogo completo para la tienda online
 * Sin autenticación requerida. Solo productos activos.
 */
router.get('/catalog', getWebCatalog);

// GET /api/products/catalog/search?q=teclado
router.get('/catalog/search', searchWebProducts);

// GET /api/products/catalog/:id
router.get('/catalog/:id', getWebProductById);




module.exports = router;