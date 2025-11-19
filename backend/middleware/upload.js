const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Asegurarnos de que la carpeta exista, si no, la creamos
const uploadDir = 'public/uploads/products';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 1. Configuración de Almacenamiento (Dónde y con qué nombre)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); // Carpeta destino
    },
    filename: function (req, file, cb) {
        // Generamos un nombre único: timestamp + numero aleatorio + extensión original
        // Ej: 1763059200-55432-mi-imagen.png
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// 2. Filtro de Archivos (Seguridad: Solo imágenes)
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const mimeType = allowedTypes.test(file.mimetype);
    const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimeType && extName) {
        return cb(null, true);
    }
    cb(new Error('Error: Tipo de archivo no permitido. Solo JPEG, PNG y WEBP.'));
};

// 3. Inicializar Multer
const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 }, // Límite de 5MB
    fileFilter: fileFilter
});

module.exports = upload;