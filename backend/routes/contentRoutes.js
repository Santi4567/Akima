// Crear routes/contentRoutes.js

const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const fs = require('fs');

// --- Configuración Multer Local ---
const uploadDir = 'public/uploads/banners';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'banner-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB (Banners pueden ser grandes)
    fileFilter: (req, file, cb) => {
        if (/jpeg|jpg|png|webp/.test(path.extname(file.originalname).toLowerCase())) {
            return cb(null, true);
        }
        cb(new Error('Solo imágenes válidas (jpg, png, webp)'));
    }
});

// --- Imports ---
const { verifyToken } = require('../middleware/auth');
const { requirePermission, PERMISSIONS } = require('../utils/permissions');
const { getBanners, uploadBanner, deleteBanner } = require('../controllers/contentController');

// --- Rutas ---

// Ver Banners (Público o Protegido según prefieras, aquí lo pongo protegido básico)
router.get('/', getBanners);

// Subir Banner (Admin/Marketing)
router.post(
    '/',
    verifyToken,
    requirePermission(PERMISSIONS.MANAGE_CONTENT),
    upload.single('image'),
    uploadBanner
);

// Borrar Banner
router.delete(
    '/:id',
    verifyToken,
    requirePermission(PERMISSIONS.MANAGE_CONTENT),
    deleteBanner
);

module.exports = router;