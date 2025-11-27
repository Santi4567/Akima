// En controllers/productController.js

const { getConnection } = require('../config/database');
const { sanitizeInput, containsSQLInjection, sanitizeJsonObject, jsonObjectContainsSQLInjection } = require('../utils/sanitizer');

//Imagenes exportaciones
const path = require('path');

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


//===========================================
// Imagenes 
//===========================================

/**
 * [PROTEGIDO] Subir una imagen para un producto
 */
const uploadProductImage = async (req, res) => {
    let connection;
    
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No se subió ningún archivo.' });
    }

    try {
        const { id } = req.params;
        const { filename } = req.file;
        const imagePath = `/uploads/products/${filename}`;

        // 1. Leer el orden del body (o asignar 0 por defecto si no lo envían)
        const displayOrder = req.body.display_order ? parseInt(req.body.display_order) : 0;
        
        // 1. Leer la intención del usuario desde el body
        // Multer procesa los campos de texto y los pone en req.body
        // Nota: En FormData, los booleanos viajan como strings "true" o "1"
        let isPrimaryRequested = req.body.is_primary === 'true' || req.body.is_primary === '1';

        connection = await getConnection();

        // 2. Verificar que el producto exista
        const [product] = await connection.execute('SELECT id FROM products WHERE id = ?', [id]);
        if (product.length === 0) {
            require('fs').unlinkSync(req.file.path); // Borrar foto si no hay producto
            return res.status(404).json({ success: false, message: 'El producto no existe.' });
        }

        // 3. Lógica Inteligente de "Imagen Principal"
        // Paso A: Verificamos cuántas imágenes tiene
        const [existingImages] = await connection.execute('SELECT COUNT(id) as count FROM product_images WHERE product_id = ?', [id]);
        const count = existingImages[0].count;

        // Paso B: Decidir si será principal
        let finalIsPrimary = 0;

        if (count === 0) {
            // Si es la PRIMERA imagen que sube, SIEMPRE es principal (aunque diga que no)
            finalIsPrimary = 1;
        } else if (isPrimaryRequested) {
            // Si ya tiene fotos, pero el usuario PIDIÓ que esta sea principal:
            finalIsPrimary = 1;
            
            // ¡IMPORTANTE! "Destronar" a la principal anterior
            // Ponemos is_primary = 0 a todas las otras fotos de este producto
            await connection.execute(
                'UPDATE product_images SET is_primary = 0 WHERE product_id = ?',
                [id]
            );
        } 
        // (Else: Si no es la primera y no lo pidió, se queda en 0)

        // 4. Insertar
        const [result] = await connection.execute(
            'INSERT INTO product_images (product_id, image_path, is_primary, display_order) VALUES (?, ?, ?, ?)',
            [id, imagePath, finalIsPrimary, displayOrder] // <--- Aquí agregamos el dato
        );

        res.status(201).json({ 
            success: true, 
            message: 'Imagen subida exitosamente.', 
            data: { 
                id: result.insertId, 
                image_path: imagePath, 
                is_primary: Boolean(finalIsPrimary), // Devolvemos true/false para el frontend
                display_order: displayOrder
            } 
        });

    } catch (error) {
        if (req.file && require('fs').existsSync(req.file.path)) {
            require('fs').unlinkSync(req.file.path);
        }
        console.error('Error al subir imagen:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * [PROTEGIDO] Eliminar una imagen de producto
 */
const deleteProductImage = async (req, res) => {
    let connection;
    try {
        const imageId = req.params.id;
        
        connection = await getConnection();

        // 1. Obtener la ruta de la imagen ANTES de borrar el registro
        const [images] = await connection.execute('SELECT image_path FROM product_images WHERE id = ?', [imageId]);
        
        if (images.length === 0) {
            return res.status(404).json({ success: false, message: 'La imagen no existe.' });
        }
        
        const imagePathRelative = images[0].image_path; // Ej: /uploads/products/foto.jpg

        // 2. Borrar el registro de la Base de Datos
        await connection.execute('DELETE FROM product_images WHERE id = ?', [imageId]);

        // 3. Borrar el archivo físico del servidor
        // Construimos la ruta absoluta del sistema
        // Nota: Asumimos que 'public' está en la raíz de tu proyecto, un nivel arriba de 'controllers'
        const fullPath = path.join(__dirname, '../public', imagePathRelative);

        if (require('fs').existsSync(fullPath)) {
            require('fs').unlinkSync(fullPath); // Borrado físico
        }

        res.status(200).json({ success: true, message: 'Imagen eliminada exitosamente.' });

    } catch (error) {
        console.error('Error al eliminar imagen:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * [PROTEGIDO] Obtener todas las imágenes de un producto
 */
const getProductImages = async (req, res) => {
    let connection;
    try {
        const productId = req.params.id;
        
        // Validar que el ID sea un número
        if (isNaN(parseInt(productId, 10))) {
            return res.status(400).json({ success: false, message: 'El ID del producto debe ser un número.' });
        }

        connection = await getConnection();

        // 1. Verificar que el producto exista (opcional, pero buena práctica)
        const [product] = await connection.execute('SELECT id FROM products WHERE id = ?', [productId]);
        if (product.length === 0) {
            return res.status(404).json({ success: false, message: 'El producto no existe.' });
        }

        // 2. Obtener las imágenes
        // Ordenamos por:
        // - is_primary DESC (Para que la principal (1) salga primero)
        // - display_order ASC (Para respetar el orden manual)
        // - created_at DESC (Para que las nuevas salgan antes si no hay orden)
        const sql = `
            SELECT id, image_path, alt_text, display_order, is_primary 
            FROM product_images 
            WHERE product_id = ? 
            ORDER BY is_primary DESC, display_order ASC, created_at DESC
        `;

        const [images] = await connection.execute(sql, [productId]);

        res.status(200).json({ success: true, data: images });

    } catch (error) {
        console.error('Error al obtener imágenes del producto:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};



/**
 * [PÚBLICO] Catálogo Web
 * Devuelve solo productos ACTIVOS con sus imágenes y atributos formateados.
 * Estructura optimizada para e-commerce.
 */
const getWebCatalog = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();

        // 1. Obtener productos ACTIVOS
        // Incluimos nombres de categoría y proveedor por si los necesitas en el front
        const sqlProducts = `
            SELECT 
                p.id, p.name, p.description, p.price, p.status, 
                p.category_id, p.supplier_id,
                p.weight, p.height, p.width, p.depth,
                p.custom_fields,
                c.name AS category_name, 
                s.name AS supplier_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            WHERE p.status = 'active'
            ORDER BY p.name ASC
        `;
        const [products] = await connection.execute(sqlProducts);

        // Si no hay productos, devolvemos array vacío y ahorramos tiempo
        if (products.length === 0) {
            return res.status(200).json({ success: true, data: [] });
        }

        // 2. Obtener TODAS las imágenes de los productos activos
        // Usamos IN (...) con los IDs que acabamos de obtener
        const productIds = products.map(p => p.id);
        
        // Truco para crear los signos de interrogación dinámicos (?,?,?)
        const placeholders = productIds.map(() => '?').join(',');
        
        const sqlImages = `
            SELECT id, product_id, image_path, alt_text, is_primary, display_order
            FROM product_images
            WHERE product_id IN (${placeholders})
            ORDER BY product_id, is_primary DESC, display_order ASC
        `;
        
        const [allImages] = await connection.execute(sqlImages, productIds);

        // 3. Unir Productos + Imágenes + Formato de Atributos
        // Procesamos la lista en Javascript para armar el JSON final
        const catalog = products.map(product => {
            // A. Formatear custom_fields (usando tu helper existente)
            const formattedProduct = formatProductAttributes(product);

            // B. Encontrar las imágenes de este producto específico
            const productImages = allImages.filter(img => img.product_id === product.id);

            // C. Retornar el objeto combinado
            return {
                ...formattedProduct,
                images: productImages
            };
        });

        res.status(200).json({ success: true, data: catalog });

    } catch (error) {
        console.error('Error al obtener catálogo web:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = { 
    createProduct, 
    updateProduct, 
    getAllProducts, 
    searchProducts, 
    deleteProduct,
    uploadProductImage,
    deleteProductImage,
    getProductImages,
    getWebCatalog
};