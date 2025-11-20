/**
 * RUTAS PARA LA GESTIÓN DE CATEGORÍAS
 * - Protegidas con autenticación por token (verifyToken).
 * - Autorizadas por rol usando el middleware requirePermission.
 * - Utiliza los permisos definidos para productos como se solicitó.
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth'); // Asegúrate que la ruta sea correcta
const { requirePermission, PERMISSIONS } = require('../utils/permissions');
const {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
  searchCategoriesByName
} = require('../controllers/categoryController');


// POST /api/categories -> Crear una nueva categoría
router.post(
  '/',
  verifyToken,
  requirePermission(PERMISSIONS.ADD_CATEGORY), // Permiso para añadir
  createCategory
);

router.get(
  '/search',
  verifyToken,
  requirePermission(PERMISSIONS.VIEW_CATEGORY),
  searchCategoriesByName 
);


// GET /api/categories -> Obtener todas las categorías
router.get(
  '/',
  verifyToken,
  requirePermission(PERMISSIONS.VIEW_CATEGORY), // Permiso para ver
  getAllCategories
);

// PUT /api/categories/:id -> Actualizar una categoría existente
router.put(
  '/:id',
  verifyToken,
  requirePermission(PERMISSIONS.EDIT_CATEGORY), // Permiso para editar
  updateCategory
);

// DELETE /api/categories/:id -> Eliminar una categoría
router.delete(
  '/:id',
  verifyToken,
  requirePermission(PERMISSIONS.DELETE_CATEGORY), // Permiso para eliminar
  deleteCategory
);


module.exports = router;