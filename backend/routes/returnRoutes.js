// Crear nuevo archivo: routes/returnRoutes.js

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { requirePermission, PERMISSIONS } = require('../utils/permissions');
const { validateReturnPayload, validateReturnStatusPayload } = require('../middleware/returnValidator');
const { createReturn, updateReturnStatus } = require('../controllers/returnController');

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

// ... (Aquí irían las rutas GET para ver y PUT para actualizar estado) ...

module.exports = router;