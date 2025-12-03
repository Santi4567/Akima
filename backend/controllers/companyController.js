// Crear controllers/companyController.js

const { getConnection } = require('../config/database');
const { sanitizeInput, containsSQLInjection } = require('../utils/sanitizer');
const fs = require('fs');
const path = require('path');

/**
 * [PÚBLICO/PROTEGIDO] Obtener información de la empresa
 * Devuelve el registro ID=1
 */
const getCompanyInfo = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.execute('SELECT * FROM company_info WHERE id = 1');
        
        if (rows.length === 0) {
            return res.status(200).json({ success: true, data: {} }); // Retornar vacío si no se ha configurado
        }

        res.status(200).json({ success: true, data: rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * [ADMIN] Actualizar información de la empresa
 * Maneja datos de texto y subida de logo (opcional).
 */
const updateCompanyInfo = async (req, res) => {
    let connection;
    try {
        const updates = req.body;
        const file = req.file; // Si se subió un logo

        // 1. Sanitización
        const sanitizedUpdates = {};
        for (const key in updates) {
            const value = updates[key];
            const cleanValue = sanitizeInput(value);
            if (containsSQLInjection(cleanValue)) {
                if (file) fs.unlinkSync(file.path); // Borrar foto si hay error
                return res.status(400).json({ success: false, error: 'INPUT_MALICIOSO' });
            }
            sanitizedUpdates[key] = cleanValue;
        }

        // 2. Manejo del Logo
        if (file) {
            sanitizedUpdates.logo_path = `/uploads/company/${file.filename}`;
        }

        connection = await getConnection();

        // 3. Verificar si ya existe el registro ID=1
        const [existing] = await connection.execute('SELECT id, logo_path FROM company_info WHERE id = 1');

        if (existing.length === 0) {
            // CREAR (INSERT)
            if (!sanitizedUpdates.name) {
                 if (file) fs.unlinkSync(file.path);
                 return res.status(400).json({ success: false, message: 'El nombre es obligatorio para la configuración inicial.' });
            }
            
            const fields = Object.keys(sanitizedUpdates);
            const values = Object.values(sanitizedUpdates);
            const placeholders = fields.map(() => '?').join(', ');

            await connection.execute(
                `INSERT INTO company_info (id, ${fields.join(', ')}) VALUES (1, ${placeholders})`,
                values
            );

        } else {
            // ACTUALIZAR (UPDATE)
            
            // Si subieron logo nuevo, borramos el viejo para no acumular basura
            if (file && existing[0].logo_path) {
                const oldPath = path.join(__dirname, '../public', existing[0].logo_path);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }

            const fields = Object.keys(sanitizedUpdates).map(f => `${f} = ?`).join(', ');
            const values = [...Object.values(sanitizedUpdates), 1]; // ID=1 al final

            if (fields.length > 0) {
                await connection.execute(`UPDATE company_info SET ${fields} WHERE id = ?`, values);
            }
        }

        res.status(200).json({ 
            success: true, 
            message: 'Información de la empresa actualizada.',
            data: { ...sanitizedUpdates }
        });

    } catch (error) {
        if (req.file) fs.unlinkSync(req.file.path); // Limpieza en error
        console.error(error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

const getImageCompany = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.execute('SELECT logo_path FROM company_info WHERE id = 1');
        
        if (rows.length === 0) {
            return res.status(200).json({ success: true, data: {} }); // Retornar vacío si no se ha configurado
        }

        res.status(200).json({ success: true, data: rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = { getCompanyInfo, updateCompanyInfo, getImageCompany};