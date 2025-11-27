// Crear routes/companyRoutes.js

const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const fs = require('fs');

// --- Configuración Local de Multer (Para Logos) ---
const uploadDir = 'public/uploads/company';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB para logos está bien
    fileFilter: (req, file, cb) => {
        if (/jpeg|jpg|png|webp/.test(path.extname(file.originalname).toLowerCase())) {
            return cb(null, true);
        }
        cb(new Error('Solo imágenes (jpg, png, webp)'));
    }
});

// --- Imports ---
const { verifyToken } = require('../middleware/auth');
const { requirePermission, PERMISSIONS } = require('../utils/permissions');
const { validateCompanyPayload } = require('../middleware/companyValidator');
const { getCompanyInfo, updateCompanyInfo } = require('../controllers/companyController');

// --- Rutas ---

// Ver Info (Público para usuarios logueados)
router.get('/', verifyToken, getCompanyInfo);

// Editar Info (Solo Admin)
// Usamos upload.single('logo') para procesar la imagen si viene
router.put(
    '/',
    verifyToken,
    requirePermission(PERMISSIONS.MANAGE_COMPANY),
    upload.single('logo'), 
    validateCompanyPayload,
    updateCompanyInfo
);

module.exports = router;