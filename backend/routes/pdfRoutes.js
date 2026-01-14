const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { requirePermission, PERMISSIONS } = require('../utils/permissions');
const { generateOrderPdf } = require('../controllers/pdfController');

/**
 * Generar PDF de Orden
 * POST porque enviamos parámetros complejos en el body (tope, factura, tipo)
 */
router.post(
    '/orders/:id',
    verifyToken,
    requirePermission(PERMISSIONS.VIEW_OWN_ORDERS), // Mismo permiso que ver orden
    generateOrderPdf
);

module.exports = router;