// routes/financeRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { 
    getFinanceDashboard, 
    getTopSellingProducts, 
    getLeastSellingProducts 
} = require('../controllers/financeController');

// Todas estas rutas requieren estar logueado
router.use(verifyToken);

// 1. Dashboard General (KPIs)
// GET /api/finance/dashboard
router.get('/dashboard', getFinanceDashboard);

// 2. Reporte: Más Vendidos
// GET /api/finance/reports/top-products
router.get('/reports/top-products', getTopSellingProducts);

// 3. Reporte: Menos Vendidos
// GET /api/finance/reports/least-sold
router.get('/reports/least-sold', getLeastSellingProducts);

module.exports = router;