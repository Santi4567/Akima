// En controllers/productController.js

const { getConnection } = require('../config/database');
const { sanitizeInput, containsSQLInjection, sanitizeJsonObject, jsonObjectContainsSQLInjection } = require('../utils/sanitizer');

//Imagenes exportaciones
const path = require('path');

/**
 * Crear un nuevo producto
 * (ACTUALIZADO: Incluye el campo 'location')
 */
const createProduct = async (req, res) => {
    let connection;
    try {
        const productData = req.body;

        // 1. Sanitización (Igual que antes)
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

        // 2. Detección de patrones maliciosos (Igual que antes)
        for (const key in productData) {
            if (typeof productData[key] === 'string' && key !== 'custom_fields' && containsSQLInjection(productData[key])) {
                return res.status(400).json({ success: false, error: 'INPUT_MALICIOSO', message: `El campo '${key}' contiene patrones no permitidos.` });
            }
        }

        connection = await getConnection();
        
        // 3. Validaciones de negocio (Igual que antes)
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
        const initialStock = 0; 

        // INSERTAR - AQUI ESTAN LOS CAMBIOS
        // Se agregó 'location' a la lista de columnas y un '?' extra
        const [result] = await connection.execute(
            `INSERT INTO products (
                sku, name, description, price, cost_price, 
                stock_quantity, status, category_id, supplier_id,
                weight, height, width, depth, custom_fields,
                location 
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                productData.sku,
                productData.name,
                productData.description,
                productData.price,
                productData.cost_price,
                initialStock,
                productData.status || 'draft',
                productData.category_id,
                productData.supplier_id,
                productData.weight,
                productData.height,
                productData.width,
                productData.depth,
                productData.custom_fields,
                productData.location || null // <--- Nuevo valor
            ]
        );

        res.status(201).json({ 
            success: true, 
            message: 'Producto creado exitosamente. El inventario inicial es 0.', 
            data: { id: result.insertId } 
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * Actualizar un producto
 * (NO REQUIERE CAMBIOS de código, detecta 'location' automáticamente si está en el body)
 */
const updateProduct = async (req, res) => {
    let connection;
    try {
        const productId = req.params.id;
        const updates = req.body;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, message: 'No se enviaron datos para actualizar.' });
        }

        // 1. Sanitización y Filtrado de Campos
        const sanitizedUpdates = {};
        
        // Asegúrate de que 'location' NO esté aquí para que pase
        const forbiddenFields = ['id', 'created_at', 'updated_at', 'stock_quantity'];

        for (const key in updates) {
            if (forbiddenFields.includes(key)) continue;

            const value = updates[key];

            // Manejo especial para custom_fields (JSON)
            if (key === 'custom_fields') {
                if (typeof value === 'object') {
                    if (jsonObjectContainsSQLInjection(value)) {
                        return res.status(400).json({ success: false, error: 'INPUT_MALICIOSO', message: 'JSON malicioso.' });
                    }
                    sanitizedUpdates[key] = JSON.stringify(sanitizeJsonObject(value));
                } else {
                    continue; 
                }
            } 
            // Manejo de strings normales
            else if (typeof value === 'string') {
                const cleanValue = sanitizeInput(value);
                if (containsSQLInjection(cleanValue)) {
                    return res.status(400).json({ success: false, error: 'INPUT_MALICIOSO', message: `Campo ${key} inválido.` });
                }
                sanitizedUpdates[key] = cleanValue;
            } 
            // Manejo de números/booleanos
            else {
                sanitizedUpdates[key] = value;
            }
        }

        if (Object.keys(sanitizedUpdates).length === 0) {
            return res.status(400).json({ success: false, message: 'Ningún campo válido para actualizar (El stock no se edita aquí).' });
        }

        connection = await getConnection();

        // 2. Verificar que el producto exista
        const [existing] = await connection.execute('SELECT id FROM products WHERE id = ?', [productId]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
        }

        // 3. Validar duplicados (SKU) si se está intentando cambiar
        if (sanitizedUpdates.sku) {
            const [skuCheck] = await connection.execute('SELECT id FROM products WHERE sku = ? AND id != ?', [sanitizedUpdates.sku, productId]);
            if (skuCheck.length > 0) {
                return res.status(409).json({ success: false, message: `El SKU '${sanitizedUpdates.sku}' ya está en uso.` });
            }
        }

        // 4. Construir Query Dinámica
        // Como 'location' está en sanitizedUpdates, se agregará automáticamente aquí: "location = ?"
        const fields = Object.keys(sanitizedUpdates).map(field => `${field} = ?`).join(', ');
        const values = [...Object.values(sanitizedUpdates), productId];

        await connection.execute(`UPDATE products SET ${fields} WHERE id = ?`, values);

        res.status(200).json({ success: true, message: 'Producto actualizado correctamente.' });

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
// Inventario(Privado)
//===========================================

/**
 * [PROTEGIDO] Ajuste Manual de Inventario (Almacén)
 * - Actualiza el stock en 'products'
 * - Guarda el historial en 'inventory_logs'
 */
const updateProductStock = async (req, res) => {
    let connection;
    try {
        const productId = req.params.id;
        const { quantity, type, reason } = req.body;
        const currentUser = req.user;

        connection = await getConnection();
        
        // 1. Iniciar Transacción (Para que se guarden los dos o ninguno)
        await connection.beginTransaction();

        // 2. Obtener el stock actual (Bloqueamos la fila 'FOR UPDATE' para evitar condiciones de carrera)
        const [products] = await connection.execute(
            'SELECT name, stock_quantity FROM products WHERE id = ? FOR UPDATE', 
            [productId]
        );
        
        if (products.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
        }
        
        const currentStock = products[0].stock_quantity;
        let newStock = currentStock;

        // 3. Calcular
        switch (type) {
            case 'add':
                newStock = currentStock + quantity;
                break;
            case 'subtract':
                // =========================================================
                // VALIDACIÓN LÓGICA: No puedes quitar lo que no tienes
                // =========================================================
                
                // Opción A: Bloquear si ya estás en negativo
                if (currentStock < 0) {
                    await connection.rollback();
                    return res.status(400).json({ 
                        success: false, 
                        error: 'STOCK_NEGATIVO', 
                        message: `No se puede restar inventario porque el stock actual ya es negativo (${currentStock}). Debes hacer una entrada (add) o un ajuste (set) primero.` 
                    });
                }

                // Opción B: Bloquear si la resta te llevaría a negativo
                if (currentStock < quantity) {
                    await connection.rollback();
                    return res.status(400).json({ 
                        success: false, 
                        error: 'STOCK_INSUFICIENTE', 
                        message: `No hay suficiente stock físico para restar ${quantity}. Solo hay ${currentStock} unidades.` 
                    });
                }

                newStock = currentStock - quantity;
                break;
            case 'set':
                newStock = quantity;
                break;
        }

        // 4. Actualizar Stock en Producto
        await connection.execute(
            'UPDATE products SET stock_quantity = ? WHERE id = ?',
            [newStock, productId]
        );

        // 5. GUARDAR LA EVIDENCIA (Insertar en logs) <--- AQUÍ SE GUARDA EL REASON
        await connection.execute(
            'INSERT INTO inventory_logs (product_id, user_id, type, quantity, previous_stock, new_stock, reason) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [productId, currentUser.userId, type, quantity, currentStock, newStock, sanitizeInput(reason)]
        );

        // 6. Confirmar
        await connection.commit();

        res.status(200).json({ 
            success: true, 
            message: 'Inventario actualizado y movimiento registrado.',
            data: { 
                product_id: productId,
                new_stock: newStock 
            }
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error al actualizar stock:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * [PROTEGIDO] Obtener historial completo de movimientos de inventario
 * Incluye nombre del producto y del usuario responsable.
 */
const getInventoryLogs = async (req, res) => {
    let connection;
    try {
        // Opcional: Filtros por fecha o producto podrían ir aquí en el futuro
        
        connection = await getConnection();

        const sql = `
            SELECT 
                il.id,
                il.type,            -- 'add', 'subtract', 'set'
                il.quantity,
                il.previous_stock,
                il.new_stock,
                il.reason,
                il.created_at,
                p.name AS product_name,
                p.sku AS product_sku,
                u.Nombre AS user_name,
                u.rol AS user_role
            FROM inventory_logs il
            INNER JOIN products p ON il.product_id = p.id
            INNER JOIN users u ON il.user_id = u.ID
            ORDER BY il.created_at DESC
            LIMIT 100 -- Paginación recomendada para el futuro
        `;

        const [logs] = await connection.execute(sql);

        res.status(200).json({ success: true, data: logs });

    } catch (error) {
        console.error('Error al obtener logs de inventario:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * [PROTEGIDO] Obtener historial de inventario de UN producto específico
 * URL: GET /api/products/:id/inventory-logs
 */
const getProductInventoryLogs = async (req, res) => {
    let connection;
    try {
        const productId = req.params.id;

        // Validar ID
        if (isNaN(parseInt(productId, 10))) {
            return res.status(400).json({ success: false, message: 'ID de producto inválido.' });
        }

        connection = await getConnection();

        // 1. Verificar que el producto exista (opcional, pero recomendado)
        const [product] = await connection.execute('SELECT name FROM products WHERE id = ?', [productId]);
        if (product.length === 0) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
        }

        // 2. Consulta filtrada por producto
        const sql = `
            SELECT 
                il.id,
                il.type,
                il.quantity,
                il.previous_stock,
                il.new_stock,
                il.reason,
                il.created_at,
                u.Nombre AS user_name,
                u.rol AS user_role
            FROM inventory_logs il
            INNER JOIN users u ON il.user_id = u.ID
            WHERE il.product_id = ?  -- <--- EL FILTRO CLAVE
            ORDER BY il.created_at DESC
        `;

        const [logs] = await connection.execute(sql, [productId]);

        res.status(200).json({ 
            success: true, 
            message: `Historial del producto '${product[0].name}' obtenido.`,
            data: logs 
        });

    } catch (error) {
        console.error('Error al obtener logs del producto:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

//===========================================
// Imagenes(Privado)
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

//===========================================
// Catalogo web Publico 
//===========================================

/**
 * [PÚBLICO] Catálogo Web
 * Devuelve solo productos ACTIVOS con sus imágenes y atributos formateados.
 * Estructura optimizada para e-commerce.
 */
const getWebCatalog = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();

        // 1. Obtener productos ACTIVOS con datos de Jerarquía de Categorías
        const sqlProducts = `
            SELECT 
                p.id, p.name, p.description, p.price, p.status, 
                p.weight, p.height, p.width, p.depth,
                p.custom_fields,
                
                -- Datos de la Categoría del Producto (Hijo)
                c.id AS category_id,
                c.name AS category_name,
                
                -- Datos de la Categoría Padre (Para filtros agrupados)
                parent.id AS parent_category_id,
                parent.name AS parent_category_name,

                s.name AS supplier_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN categories parent ON c.parent_id = parent.id  -- <--- LA MAGIA ESTÁ AQUÍ
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            WHERE p.status = 'active'
            ORDER BY p.name ASC
        `;
        
        const [products] = await connection.execute(sqlProducts);

        if (products.length === 0) {
            return res.status(200).json({ success: true, data: [] });
        }

        // 2. Obtener imágenes (Esto sigue igual)
        const productIds = products.map(p => p.id);
        const placeholders = productIds.map(() => '?').join(',');
        
        const sqlImages = `
            SELECT id, product_id, image_path, alt_text, is_primary
            FROM product_images
            WHERE product_id IN (${placeholders})
            ORDER BY product_id, is_primary DESC, display_order ASC
        `;
        
        const [allImages] = await connection.execute(sqlImages, productIds);

        // 3. Unir todo
        const catalog = products.map(product => {
            const formattedProduct = formatProductAttributes(product);
            const productImages = allImages.filter(img => img.product_id === product.id);

            // Estructura final del objeto
            return {
                ...formattedProduct,
                // Agrupamos la info de categoría para que sea más limpio en el JSON
                category: {
                    id: product.category_id,
                    name: product.category_name,
                    parent_id: product.parent_category_id, // Será null si es categoría raíz
                    parent_name: product.parent_category_name
                },
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


/**
 * [PÚBLICO] Obtener detalle de UN producto para la Web
 * - Solo productos 'active'.
 * - Incluye imágenes ordenadas.
 * - Formatea atributos.
 * - NO muestra precios de costo ni datos internos.
 */
const getWebProductById = async (req, res) => {
    let connection;
    try {
        const productId = req.params.id;

        // Validar ID numérico
        if (isNaN(parseInt(productId, 10))) {
            return res.status(400).json({ success: false, message: 'ID inválido.' });
        }

        connection = await getConnection();

        // 1. Obtener datos del producto (Solo campos públicos)
        const sqlProduct = `
            SELECT 
                p.id, p.sku, p.name, p.description, p.price, 
                p.weight, p.height, p.width, p.depth,
                p.custom_fields,
                c.name AS category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = ? AND p.status = 'active'
        `;

        const [products] = await connection.execute(sqlProduct, [productId]);

        if (products.length === 0) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado o no disponible.' });
        }

        // 2. Obtener imágenes del producto
        const sqlImages = `
            SELECT id, image_path, alt_text, is_primary
            FROM product_images
            WHERE product_id = ?
            ORDER BY is_primary DESC, display_order ASC
        `;
        
        const [images] = await connection.execute(sqlImages, [productId]);

        // 3. Formatear y Unir
        // Usamos el helper que ya tenías para los custom_fields
        const formattedProduct = formatProductAttributes(products[0]);

        // Agregamos las imágenes al objeto final
        formattedProduct.images = images;

        res.status(200).json({ success: true, data: formattedProduct });

    } catch (error) {
        console.error('Error al obtener producto web:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * [PÚBLICO] Buscador para el Catálogo Web
 * - Filtra por nombre, SKU o descripción.
 * - Solo productos ACTIVOS.
 * - Misma estructura de respuesta que el catálogo (Imágenes + Categoría Padre + Atributos).
 */
const searchWebProducts = async (req, res) => {
    let connection;
    try {
        const { q } = req.query;

        // 1. Validar que haya término de búsqueda
        if (!q) {
            return res.status(400).json({ success: false, message: 'Ingresa un término de búsqueda.' });
        }

        // 2. Sanitizar
        const term = sanitizeInput(q);
        if (containsSQLInjection(term)) {
            return res.status(400).json({ success: false, error: 'INPUT_MALICIOSO' });
        }

        connection = await getConnection();

        // 3. Consulta Principal (Productos + Categoría + Padre)
        // Nota: Agregamos "OR p.description LIKE" para que la búsqueda sea más útil en la web
        const sqlProducts = `
            SELECT 
                p.id, p.name, p.description, p.price, p.status, 
                p.weight, p.height, p.width, p.depth,
                p.custom_fields,
                
                -- Datos Categoría Hijo
                c.id AS category_id,
                c.name AS category_name,
                
                -- Datos Categoría Padre
                parent.id AS parent_category_id,
                parent.name AS parent_category_name,

                s.name AS supplier_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN categories parent ON c.parent_id = parent.id
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            WHERE p.status = 'active' 
            AND (p.name LIKE ? OR p.sku LIKE ? OR p.description LIKE ?)
            LIMIT 20
        `;

        const searchPattern = `%${term}%`;
        const [products] = await connection.execute(sqlProducts, [searchPattern, searchPattern, searchPattern]);

        // Si no hay resultados, retornamos array vacío
        if (products.length === 0) {
            return res.status(200).json({ success: true, data: [] });
        }

        // 4. Obtener Imágenes (Igual que en el catálogo)
        const productIds = products.map(p => p.id);
        const placeholders = productIds.map(() => '?').join(',');
        
        const sqlImages = `
            SELECT id, product_id, image_path, alt_text, is_primary, display_order
            FROM product_images
            WHERE product_id IN (${placeholders})
            ORDER BY product_id, is_primary DESC, display_order ASC
        `;
        
        const [allImages] = await connection.execute(sqlImages, productIds);

        // 5. Armar el JSON Final (Mismo formato que el Catálogo)
        const results = products.map(product => {
            const formatted = formatProductAttributes(product);
            const productImages = allImages.filter(img => img.product_id === product.id);

            return {
                ...formatted,
                // Estructura de categoría anidada
                category: {
                    id: product.category_id,
                    name: product.category_name,
                    parent_id: product.parent_category_id,
                    parent_name: product.parent_category_name
                },
                images: productImages
            };
        });

        res.status(200).json({ success: true, data: results });

    } catch (error) {
        console.error('Error en buscador web:', error);
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
    getWebCatalog,
    getWebProductById,
    searchWebProducts,
    updateProductStock,
    getInventoryLogs,
    getProductInventoryLogs
};