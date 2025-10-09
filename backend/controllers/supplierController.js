//Este archivo tendrá la lógica de negocio, interactuando con la base de datos.
//Esta conectado con el middleware/supplierValidator y el routes/
const { getConnection } = require('../config/database');
const { sanitizeInput } = require('../utils/sanitizer');

// Crear un nuevo proveedor
const createSupplier = async (req, res) => {
    let connection;
    try {
        const supplierData = req.body;
        // Sanitizar todos los campos de texto antes de usarlos
        for (const key in supplierData) {
            if (typeof supplierData[key] === 'string') {
                supplierData[key] = sanitizeInput(supplierData[key]);
            }
        }
        
        connection = await getConnection();
        // Validar que el nombre no exista
        const [existing] = await connection.execute('SELECT id FROM suppliers WHERE LOWER(name) = LOWER(?)', [supplierData.name]);
        if (existing.length > 0) {
            return res.status(409).json({ success: false, error: 'PROVEEDOR_DUPLICADO', message: `El proveedor '${supplierData.name}' ya existe.` });
        }

        // Insertar en la base de datos
        const fields = Object.keys(supplierData);
        const values = Object.values(supplierData);
        const placeholders = fields.map(() => '?').join(', ');
        
        const [result] = await connection.execute(`INSERT INTO suppliers (${fields.join(', ')}) VALUES (${placeholders})`, values);

        res.status(201).json({ success: true, message: 'Proveedor creado exitosamente.', data: { id: result.insertId, ...supplierData } });
    } catch (error) {
        console.error('Error al crear proveedor:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

// Obtener todos los proveedores
const getAllSuppliers = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [suppliers] = await connection.execute('SELECT * FROM suppliers ORDER BY name ASC');
        res.status(200).json({ success: true, data: suppliers });
    } catch (error) {
        console.error('Error al obtener proveedores:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

// Actualizar un proveedor
const updateSupplier = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const supplierData = req.body;

        if (Object.keys(supplierData).length === 0) {
            return res.status(400).json({ success: false, message: 'Debe proporcionar al menos un campo para actualizar.' });
        }

        // Sanitizar
        for (const key in supplierData) {
            if (typeof supplierData[key] === 'string') {
                supplierData[key] = sanitizeInput(supplierData[key]);
            }
        }

        connection = await getConnection();
        // Validar duplicado de nombre si se está actualizando
        if (supplierData.name) {
            const [existing] = await connection.execute('SELECT id FROM suppliers WHERE LOWER(name) = LOWER(?) AND id != ?', [supplierData.name, id]);
            if (existing.length > 0) {
                return res.status(409).json({ success: false, error: 'PROVEEDOR_DUPLICADO', message: `El nombre de proveedor '${supplierData.name}' ya está en uso.` });
            }
        }

        // Construir y ejecutar query
        const fields = Object.keys(supplierData).map(field => `${field} = ?`).join(', ');
        const values = [...Object.values(supplierData), id];
        const [result] = await connection.execute(`UPDATE suppliers SET ${fields} WHERE id = ?`, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Proveedor no encontrado.' });
        }

        res.status(200).json({ success: true, message: 'Proveedor actualizado exitosamente.' });
    } catch (error) {
        console.error('Error al actualizar proveedor:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

// Eliminar un proveedor
const deleteSupplier = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await getConnection();
        // Mejora a futuro: Verificar si este proveedor tiene productos asociados antes de borrar.
        const [result] = await connection.execute('DELETE FROM suppliers WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Proveedor no encontrado.' });
        }
        res.status(200).json({ success: true, message: 'Proveedor eliminado exitosamente.' });
    } catch (error) {
        console.error('Error al eliminar proveedor:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

// Buscar proveedores por nombre
const searchSuppliers = async (req, res) => {
    let connection;
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ success: false, message: 'Debe proporcionar un término de búsqueda "q".' });
        }
        const sanitizedQuery = sanitizeInput(q);
        connection = await getConnection();
        const [suppliers] = await connection.execute('SELECT * FROM suppliers WHERE name LIKE ?', [`%${sanitizedQuery}%`]);
        res.status(200).json({ success: true, data: suppliers });
    } catch (error) {
        console.error('Error al buscar proveedores:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = {
    createSupplier,
    getAllSuppliers,
    updateSupplier,
    deleteSupplier,
    searchSuppliers
};