// Crear nuevo archivo: routes/orderRoutes.js

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { requirePermission, PERMISSIONS } = require('../utils/permissions');
const { validateOrderPayload, validateStatusPayload } = require('../middleware/orderValidator');
const {
    createOrder,
    getOrders,
    updateOrderStatus,
    cancelOrder
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

module.exports = router;