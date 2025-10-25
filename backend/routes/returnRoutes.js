// Crear nuevo archivo: routes/returnRoutes.js

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { requirePermission, PERMISSIONS } = require('../utils/permissions');
const { validateReturnPayload } = require('../middleware/returnValidator');
const { createReturn } = require('../controllers/returnController');

// Crear una nueva devolución/reembolso
router.post(
    '/',
    verifyToken,
    validateReturnPayload,
    requirePermission(PERMISSIONS.ISSUE_REFUND),
    createReturn
);

// ... (Aquí irían las rutas GET para ver y PUT para actualizar estado) ...

module.exports = router;