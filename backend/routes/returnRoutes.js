// Crear nuevo archivo: routes/returnRoutes.js

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { requirePermission, PERMISSIONS } = require('../utils/permissions');
const { validateReturnPayload, validateReturnStatusPayload } = require('../middleware/returnValidator');
const { createReturn, 
    updateReturnStatus,
    getReturns, 
    getReturnById
} = require('../controllers/returnController');

// Crear una nueva devolución/reembolso
router.post(
    '/',
    verifyToken,
    validateReturnPayload,
    requirePermission(PERMISSIONS.ISSUE_REFUND),
    createReturn
);
router.put(
    '/:id/status',
    verifyToken,
    validateReturnStatusPayload, // El nuevo middleware
    requirePermission(PERMISSIONS.EDIT_RETURN_STATUS), // El permiso que definimos
    updateReturnStatus // El nuevo controlador
);

// Ver lista de devoluciones
router.get(
    '/',
    verifyToken,
    // CAMBIO: Ahora solo pide permiso de ver órdenes
    requirePermission(PERMISSIONS.VIEW_ALL_ORDERS), 
    getReturns
);

// Ver detalle de una devolución
router.get(
    '/:id',
    verifyToken,
    // CAMBIO: Ahora solo pide permiso de ver órdenes
    requirePermission(PERMISSIONS.VIEW_ALL_ORDERS), 
    getReturnById
);


module.exports = router;