// Crear nuevo archivo: routes/clientRoutes.js

const express = require('express');
const router = express.Router();

// Middlewares
const { verifyToken } = require('../middleware/auth');
const { requirePermission, PERMISSIONS } = require('../utils/permissions');
const { validateClientPayload } = require('../middleware/clientValidator'); // El que creamos en el paso anterior

// Controladores
const {
    createClient,
    getAllClients,
    getClientById,
    searchClientByName,
    updateClient,
    deleteClient
} = require('../controllers/clientController');

// [C]REATE: Crear un nuevo cliente
router.post(
    '/',
    verifyToken,
    validateClientPayload, // Valida la 'forma' de los datos
    requirePermission(PERMISSIONS.ADD_CLIENTS),
    createClient
);

// [R]EAD: Obtener todos los clientes
router.get(
    '/',
    verifyToken,
    requirePermission(PERMISSIONS.VIEW_CLIENTS),
    getAllClients
);

// [R]EAD: Buscador por nombre
router.get(
    '/search',
    verifyToken,
    requirePermission(PERMISSIONS.VIEW_CLIENTS),
    searchClientByName
);

// [R]EAD: Obtener un cliente por ID
router.get(
    '/:id',
    verifyToken,
    requirePermission(PERMISSIONS.VIEW_CLIENTS),
    getClientById
);

// [U]PDATE: Actualizar un cliente
router.put(
    '/:id',
    verifyToken,
    validateClientPayload, // Reutiliza el mismo validador
    requirePermission(PERMISSIONS.EDIT_CLIENTS),
    updateClient
);

// [D]ELETE: Eliminar un cliente
router.delete(
    '/:id',
    verifyToken,
    requirePermission(PERMISSIONS.DELETE_CLIENTS),
    deleteClient
);

module.exports = router;