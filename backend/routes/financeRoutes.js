const express = require('express');
const router = express.Router();

// Importamos middlewares
const { verifyToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/auth'); // <--- Usamos tu función vieja confiable

const { 
    getFinanceDashboard, 
    getTopSellingProducts, 
    getLeastSellingProducts,
    getSalesOverTime,
    getDebtsReport,
     getIncomeReport
} = require('../controllers/financeController');

// ==========================================
// MIDDLEWARES GLOBALES
// ==========================================

// 1. Login obligatorio
router.use(verifyToken);

// 2. Solo Admin (Tu función directa)
// Esto protege todo lo de abajo sin necesidad de configurar permisos extra
router.use(requireAdmin);


// ==========================================
// RUTAS
// ==========================================

router.get('/dashboard', getFinanceDashboard);
router.get('/reports/top-products', getTopSellingProducts);
router.get('/reports/least-sold', getLeastSellingProducts);
router.get('/reports/sales-chart', getSalesOverTime);


// 5. Tabla de Deudores (Cuentas por Cobrar)
router.get('/reports/debts', getDebtsReport);

// 6. Tabla de Ingresos (Flujo de Caja)
router.get('/reports/income', getIncomeReport);
module.exports = router;