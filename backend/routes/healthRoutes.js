// routes/healthRoutes.js
const express = require('express');
const router = express.Router();

/**
 * [PÚBLICO] Health Check
 * Verifica si la API está viva.
 */
router.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API de Akima operativa 🚀',
        server_time: new Date().toISOString(),
        uptime: process.uptime() // Cuántos segundos lleva prendido el proceso
    });
});

module.exports = router;