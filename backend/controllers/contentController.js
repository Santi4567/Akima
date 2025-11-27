// Crear controllers/contentController.js

const { getConnection } = require('../config/database');
const fs = require('fs');
const path = require('path');
const { sanitizeInput } = require('../utils/sanitizer');

/**
 * [PÚBLICO/PROTEGIDO] Obtener Banners Activos
 * Ordenados por display_order
 */
const getBanners = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        // Solo traemos los activos y ordenados
        const [banners] = await connection.execute(
            'SELECT * FROM website_banners WHERE is_active = 1 ORDER BY display_order ASC, created_at DESC'
        );
        res.status(200).json({ success: true, data: banners });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * [ADMIN] Subir Nuevo Banner
 */
const uploadBanner = async (req, res) => {
    let connection;
    
    // 1. Validación básica de archivo
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No se subió ninguna imagen.' });
    }

    try {
        const { title, link_url, display_order, is_active } = req.body;
        const imagePath = `/uploads/banners/${req.file.filename}`;

        // Sanitización
        const cleanTitle = title ? sanitizeInput(title) : null;
        const cleanLink = link_url ? sanitizeInput(link_url) : null;
        const order = display_order ? parseInt(display_order) : 0;
        const active = is_active !== undefined ? (is_active === 'true' || is_active === '1' ? 1 : 0) : 1;

        connection = await getConnection();

        // =================================================================
        // NUEVA VALIDACIÓN: Verificar duplicado de Orden
        // =================================================================
        // Solo verificamos si el orden es mayor a 0 (el 0 se usa como "sin orden")
        if (order > 0) {
            const [existing] = await connection.execute(
                'SELECT id FROM website_banners WHERE display_order = ?',
                [order]
            );

            if (existing.length > 0) {
                // ¡IMPORTANTE! Borrar el archivo físico porque Multer ya lo subió
                if (req.file) fs.unlinkSync(req.file.path);

                return res.status(409).json({ 
                    success: false, 
                    error: 'ORDEN_DUPLICADO', 
                    message: `El orden #${order} ya está ocupado por otro banner. Elige otro número.` 
                });
            }
        }

        // 3. Insertar si pasó la validación
        const [result] = await connection.execute(
            'INSERT INTO website_banners (image_path, title, link_url, display_order, is_active) VALUES (?, ?, ?, ?, ?)',
            [imagePath, cleanTitle, cleanLink, order, active]
        );

        res.status(201).json({ 
            success: true, 
            message: 'Banner subido exitosamente.',
            data: { id: result.insertId, image_path: imagePath, display_order: order }
        });

    } catch (error) {
        // Borrar archivo si falla algo interno
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        console.error(error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};
/**
 * [ADMIN] Eliminar Banner
 */
const deleteBanner = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await getConnection();

        // 1. Obtener ruta para borrar archivo
        const [rows] = await connection.execute('SELECT image_path FROM website_banners WHERE id = ?', [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Banner no encontrado.' });
        }

        // 2. Borrar de BD
        await connection.execute('DELETE FROM website_banners WHERE id = ?', [id]);

        // 3. Borrar archivo físico
        const fullPath = path.join(__dirname, '../public', rows[0].image_path);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }

        res.status(200).json({ success: true, message: 'Banner eliminado.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};



module.exports = { getBanners, uploadBanner, deleteBanner };