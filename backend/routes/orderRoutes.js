// Crear nuevo archivo: routes/orderRoutes.js

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { requirePermission, PERMISSIONS } = require('../utils/permissions');
const { validateOrderPayload, validateStatusPayload, validateAddOrderItemPayload} = require('../middleware/orderValidator');
const {
    createOrder,
    getOrders,
    updateOrderStatus,
    cancelOrder,
    getOrderItems,
    addOrderItem, 
    removeOrderItem
} = require('../controllers/orderController');

// Crear un nuevo pedido
router.post(
    '/',
    verifyToken,
    validateOrderPayload,
    requirePermission(PERMISSIONS.ADD_ORDER),
    createOrder
);

// Obtener pedidos (unificado para 'mis pedidos' o 'todos')
router.get(
    '/',
    verifyToken,
    requirePermission(PERMISSIONS.VIEW_OWN_ORDERS), // El controlador decide si muestra 'todos'
    getOrders
);

// Actualizar el ESTADO de un pedido (Almacén)
router.put(
    '/:id/status',
    verifyToken,
    validateStatusPayload,
    requirePermission(PERMISSIONS.EDIT_ORDER_STATUS),
    updateOrderStatus
);

// Cancelar un pedido (Admin/Gerente)
router.put(
    '/:id/cancel',
    verifyToken,
    requirePermission(PERMISSIONS.CANCEL_ORDER),
    cancelOrder
);

/**
 * ver items a un pedido existente (Solo pending)
 * GET /api/orders/:id/items
 */
router.get(
    '/:id/items',
    verifyToken,
    requirePermission(PERMISSIONS.VIEW_OWN_ORDERS), // Permiso mínimo requerido
    getOrderItems
);

/**
 * Agregar item a un pedido existente (Solo pending)
 * POST /api/orders/:id/items
 */
router.post(
    '/:id/items',
    verifyToken,
    validateAddOrderItemPayload,
    requirePermission(PERMISSIONS.EDIT_ORDER_CONTENT),
    addOrderItem
);

/**
 * Eliminar item de un pedido existente (Solo pending)
 * DELETE /api/orders/:id/items/:itemId
 */
router.delete(
    '/:id/items/:itemId',
    verifyToken,
    requirePermission(PERMISSIONS.EDIT_ORDER_CONTENT),
    removeOrderItem
);

module.exports = router;