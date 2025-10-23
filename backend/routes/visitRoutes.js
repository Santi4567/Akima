const express = require('express');
const router = express.Router();

// Middlewares
const { verifyToken } = require('../middleware/auth');
const { requirePermission, PERMISSIONS } = require('../utils/permissions');
const { validateVisitPayload } = require('../middleware/visitValidator');

// Controladores
const {
    createVisit,
    updateVisit,
    getVisits, 
    deleteVisit
} = require('../controllers/visitController');


// Agendar una nueva visita
router.post(
    '/',
    verifyToken,
    validateVisitPayload,
    requirePermission(PERMISSIONS.ADD_VISITS),
    createVisit
);

// =================================================================
// RUTA DE LECTURA UNIFICADA
// =================================================================
router.get(
    '/',
    verifyToken,
    // Verificamos el permiso más básico. El controlador decidirá si puede ver más.
    requirePermission(PERMISSIONS.VIEW_OWN_VISITS), 
    getVisits
);

// Actualizar una visita (completar, reagendar, añadir notas)
router.put(
    '/:id',
    verifyToken,
    validateVisitPayload,
    requirePermission(PERMISSIONS.EDIT_VISITS),
    updateVisit
);

// Eliminar (cancelar) una visita
router.delete(
    '/:id',
    verifyToken,
    requirePermission(PERMISSIONS.DELETE_VISITS),
    deleteVisit
);

module.exports = router;