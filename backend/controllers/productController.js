// En controllers/productController.js

const { getConnection } = require('../config/database');
const { sanitizeInput, containsSQLInjection, sanitizeJsonObject, jsonObjectContainsSQLInjection } = require('../utils/sanitizer');

/**
 * Crear un nuevo producto
 */
const createProduct = async (req, res) => {
    let connection;
    try {
        const productData = req.body;

        // 1. Sanitización de todos los campos
        for (const key in productData) {
            if (typeof productData[key] === 'string') {
                productData[key] = sanitizeInput(productData[key]);
            }
        }
        if (productData.custom_fields) {
             if (jsonObjectContainsSQLInjection(productData.custom_fields)) {
                return res.status(400).json({ success: false, error: 'INPUT_MALICIOSO', message: `El campo 'custom_fields' contiene patrones no permitidos.` });
            }
            const sanitizedCustomFields = sanitizeJsonObject(productData.custom_fields);
            productData.custom_fields = JSON.stringify(sanitizedCustomFields);
        }

        // 2. Detección de patrones maliciosos post-sanitización
        for (const key in productData) {
            if (typeof productData[key] === 'string' && key !== 'custom_fields' && containsSQLInjection(productData[key])) {
                return res.status(400).json({ success: false, error: 'INPUT_MALICIOSO', message: `El campo '${key}' contiene patrones no permitidos.` });
            }
        }

        connection = await getConnection();
        
        // 3. Validaciones de negocio
        const { category_id, supplier_id, sku, name } = productData;
        if (category_id) {
            const [category] = await connection.execute('SELECT id FROM categories WHERE id = ?', [category_id]);
            if (category.length === 0) return res.status(404).json({ success: false, message: 'La categoría especificada no existe.' });
        }
        if (supplier_id) {
            const [supplier] = await connection.execute('SELECT id FROM suppliers WHERE id = ?', [supplier_id]);
            if (supplier.length === 0) return res.status(404).json({ success: false, message: 'El proveedor especificado no existe.' });
        }
        const [existingSku] = await connection.execute('SELECT id FROM products WHERE sku = ?', [sku]);
        if (existingSku.length > 0) return res.status(409).json({ success: false, message: `El SKU '${sku}' ya está en uso.` });

        const [existingName] = await connection.execute('SELECT id FROM products WHERE name = ?', [name]);
        if (existingName.length > 0) return res.status(409).json({ success: false, message: `El producto con nombre '${name}' ya existe.` });

        // 4. Inserción en la base de datos
        const fields = Object.keys(productData);
        const values = Object.values(productData);
        const placeholders = fields.map(() => '?').join(', ');
        
        const [result] = await connection.execute(`INSERT INTO products (${fields.join(', ')}) VALUES (${placeholders})`, values);
        res.status(201).json({ success: true, message: 'Producto creado exitosamente.', data: { id: result.insertId } });

    } catch (error) {
        console.error('Error al crear producto:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * Actualizar un producto
 */
const updateProduct = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const productData = req.body;

        if (Object.keys(productData).length === 0) {
            return res.status(400).json({ success: false, error: 'SIN_DATOS', message: 'Debe proporcionar al menos un campo para actualizar.' });
        }

        // 1. Sanitización de todos los campos
        for (const key in productData) {
            if (typeof productData[key] === 'string') {
                productData[key] = sanitizeInput(productData[key]);
            }
        }
        if (productData.custom_fields) {
             if (jsonObjectContainsSQLInjection(productData.custom_fields)) {
                return res.status(400).json({ success: false, error: 'INPUT_MALICIOSO', message: `El campo 'custom_fields' contiene patrones no permitidos.` });
            }
            const sanitizedCustomFields = sanitizeJsonObject(productData.custom_fields);
            productData.custom_fields = JSON.stringify(sanitizedCustomFields);
        }

        // 2. Detección de patrones maliciosos post-sanitización
        for (const key in productData) {
            if (typeof productData[key] === 'string' && key !== 'custom_fields' && containsSQLInjection(productData[key])) {
                return res.status(400).json({ success: false, error: 'INPUT_MALICIOSO', message: `El campo '${key}' contiene patrones no permitidos.` });
            }
        }

        connection = await getConnection();
        
        // 3. Validaciones de negocio
        const { category_id, supplier_id, sku, name } = productData;
        if (category_id) {
            const [category] = await connection.execute('SELECT id FROM categories WHERE id = ?', [category_id]);
            if (category.length === 0) return res.status(404).json({ success: false, message: 'La categoría especificada no existe.' });
        }
        if (supplier_id) {
            const [supplier] = await connection.execute('SELECT id FROM suppliers WHERE id = ?', [supplier_id]);
            if (supplier.length === 0) return res.status(404).json({ success: false, message: 'El proveedor especificado no existe.' });
        }
        if (sku) {
            const [existing] = await connection.execute('SELECT id FROM products WHERE sku = ? AND id != ?', [sku, id]);
            if (existing.length > 0) return res.status(409).json({ success: false, message: `El SKU '${sku}' ya está en uso por otro producto.` });
        }
        if (name) {
            const [existing] = await connection.execute('SELECT id FROM products WHERE name = ? AND id != ?', [name, id]);
            if (existing.length > 0) return res.status(409).json({ success: false, message: `El nombre '${name}' ya está en uso por otro producto.` });
        }
        
        // 4. Actualización en la base de datos
        const fields = Object.keys(productData).map(field => `${field} = ?`).join(', ');
        const values = [...Object.values(productData), id];
        const [result] = await connection.execute(`UPDATE products SET ${fields} WHERE id = ?`, values);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
        
        res.status(200).json({ success: true, message: 'Producto actualizado exitosamente.' });
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

// --- FUNCIÓN DE AYUDA (HELPER) ---
// Convierte el JSON de BD en el formato Array { title, description } que tú quieres
const formatProductAttributes = (product) => {
    let attributes = [];
    
    // 1. Verificar si hay custom_fields y si es un string (en MariaDB suele venir como string)
    if (product.custom_fields) {
        let parsedFields = product.custom_fields;
        
        // Si viene como string JSON, lo parseamos a Objeto
        if (typeof parsedFields === 'string') {
            try {
                parsedFields = JSON.parse(parsedFields);
            } catch (e) {
                parsedFields = {}; // Si falla, devolvemos vacío
            }
        }

        // 2. Transformar Objeto a Array de { title, description }
        // Ejemplo entrada: { "tipo_switch": "Blue", "conexion": "USB-C" }
        // Ejemplo salida: [ { title: "tipo_switch", description: "Blue" }, ... ]
        attributes = Object.entries(parsedFields).map(([key, value]) => ({
            title: key,       // El "Elemento 1" que querías
            description: value // El "Elemento 2" que querías
        }));
    }
    
    // Retornamos el producto con un nuevo campo 'attributes_list'
    return {
        ...product,
        attributes_list: attributes, // <--- AQUÍ ESTÁ LA LISTA FORMATEADA
        // custom_fields: parsedFields // Puedes dejar el original o quitarlo si prefieres
    };
};

/**
 * Obtener todos los productos
 * (Incluye nombres de categoría y proveedor)
 */
const getAllProducts = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const sql = `
            SELECT p.*, c.name AS category_name, s.name AS supplier_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            ORDER BY p.name ASC
        `;
        const [products] = await connection.execute(sql);

        // Formatear cada producto de la lista
        const formattedProducts = products.map(prod => formatProductAttributes(prod));

        res.status(200).json({ success: true, data: formattedProducts });
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * Buscar productos por nombre, SKU o código de barras
 * (Incluye nombres de categoría y proveedor)
 */
const searchProducts = async (req, res) => {
    let connection;
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ success: false, message: 'Debe proporcionar un término de búsqueda "q".' });
        }
        
        // 1. Sanitizar la entrada
        const sanitizedQuery = sanitizeInput(q);

        // 2. Detectar patrones maliciosos
        if (containsSQLInjection(sanitizedQuery)) {
            return res.status(400).json({
                success: false,
                error: 'INPUT_MALICIOSO',
                message: 'El término de búsqueda contiene caracteres o patrones no permitidos.'
            });
        }
        
        connection = await getConnection();
        
        // 3. Ejecutar la búsqueda con JOINs
        const sql = `
            SELECT 
                p.*, 
                c.name AS category_name, 
                s.name AS supplier_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            WHERE p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ? 
            LIMIT 7
        `;

        const params = [`%${sanitizedQuery}%`, `%${sanitizedQuery}%`, `%${sanitizedQuery}%`];

        const [products] = await connection.execute(sql, params);

        // =================================================================
        // 4. APLICAR EL FORMATO DE ATRIBUTOS (Igual que en getAllProducts)
        // =================================================================
        // Usamos la función helper 'formatProductAttributes' que definimos antes
        const formattedProducts = products.map(prod => formatProductAttributes(prod));

        res.status(200).json({ success: true, data: formattedProducts });

    } catch (error) {
        console.error('Error al buscar productos:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};
/**
 * Eliminar un producto
 */
const deleteProduct = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await getConnection();
        const [result] = await connection.execute('DELETE FROM products WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado o ya fue eliminado.' });
        }
        res.status(200).json({ success: true, message: 'Producto eliminado exitosamente.' });
    } catch (error) {
        console.error('Error al eliminar el producto:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = { createProduct, updateProduct, getAllProducts, searchProducts, deleteProduct };