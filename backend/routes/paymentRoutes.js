// Crear nuevo archivo: routes/paymentRoutes.js

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { requirePermission, PERMISSIONS } = require('../utils/permissions');
const { validatePaymentPayload } = require('../middleware/paymentValidator');
const { createPayment,
        getPaymentsByOrder,
        getAllPayments 
        } = require('../controllers/paymentController');

// Registrar un pago
router.post(
    '/',
    verifyToken,
    validatePaymentPayload,
    requirePermission(PERMISSIONS.ADD_PAYMENT),
    createPayment
);

// Ver historial de pagos de una orden
router.get(
    '/order/:orderId',
    verifyToken,
    requirePermission(PERMISSIONS.VIEW_PAYMENTS),
    getPaymentsByOrder
);

/**
 * Ver reporte global de pagos (Ingresos)
 * GET /api/payments
 */
router.get(
    '/',
    verifyToken,
    requirePermission(PERMISSIONS.VIEW_PAYMENTS), // Requiere permiso básico de ver pagos
    getAllPayments
);

module.exports = router;