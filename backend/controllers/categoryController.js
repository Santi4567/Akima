/**
 * CONTROLADOR PARA LA GESTIÓN DE CATEGORÍAS
 * - Lógica para CRUD (Crear, Leer, Actualizar, Borrar) de categorías.
 * - Realiza validaciones y sanitización de los datos de entrada.
 * - La autorización se maneja a nivel de ruta con el middleware 'requirePermission'.
 */

const { getConnection } = require('../config/database');
const { sanitizeInput, containsSQLInjection } = require('../utils/sanitizer');

/**
 * Crear una nueva categoría
 */
const createCategory = async (req, res) => {
  let connection;
  try {
    // 1. Validar que solo vengan los campos permitidos (Esto está perfecto)
    const allowedFields = ['name', 'description', 'parent_id'];
    const receivedFields = Object.keys(req.body);
    const extraFields = receivedFields.filter(field => !allowedFields.includes(field));
    
    if (extraFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'CAMPOS_NO_PERMITIDOS',
        message: `Los campos ${extraFields.join(', ')} no están permitidos`
      });
    }

    // 2. Extraer las variables del cuerpo de la petición (Este es el paso que faltaba al inicio)
    const { name, description, parent_id } = req.body;

    // 3. Validaciones básicas (Ahora 'name' sí existe)
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ success: false, error: 'NOMBRE_INVALIDO', message: 'El campo "name" es obligatorio y debe ser un texto.' });
    }

    // 4. Sanitizar entradas (Ahora 'name' y 'description' existen)
    const sanitizedName = sanitizeInput(name);
    const sanitizedDescription = description ? sanitizeInput(description) : null;

    if (!sanitizedName) {
      return res.status(400).json({ success: false, error: 'NOMBRE_VACIO', message: 'El nombre no puede estar vacío después de la sanitización.' });
    }
    if (containsSQLInjection(sanitizedName) || (sanitizedDescription && containsSQLInjection(sanitizedDescription))) {
        return res.status(400).json({ success: false, error: 'INPUT_MALICIOSO', message: 'Los datos contienen patrones no permitidos.' });
    }

    connection = await getConnection();

    // =================================================================
    // VERIFICAR SI EL NOMBRE YA EXISTE
    // Usamos LOWER() para que la comparación no distinga entre mayúsculas y minúsculas ("Laptops" es igual a "laptops")
    // =================================================================
    const [existing] = await connection.execute(
      'SELECT id FROM categories WHERE LOWER(name) = LOWER(?)',
      [sanitizedName]
    );

    if (existing.length > 0) {
      return res.status(409).json({ // 409 Conflict es el código ideal para este error
        success: false,
        error: 'CATEGORIA_DUPLICADA',
        message: `Ya existe una categoría con el nombre "${sanitizedName}".`
      });
    }

    // 3. (Opcional pero recomendado) Verificar si parent_id existe
    if (parent_id) {
        const [parent] = await connection.execute('SELECT id FROM categories WHERE id = ?', [parent_id]);
        if (parent.length === 0) {
            return res.status(404).json({ success: false, error: 'PARENT_ID_NO_ENCONTRADO', message: 'La categoría padre especificada no existe.' });
        }
    }

    // 4. Insertar en la base de datos
    const [result] = await connection.execute(
      'INSERT INTO categories (name, description, parent_id) VALUES (?, ?, ?)',
      [sanitizedName, sanitizedDescription, parent_id || null]
    );

    res.status(201).json({
      success: true,
      message: 'Categoría creada exitosamente.',
      data: {
        id: result.insertId,
        name: sanitizedName,
        description: sanitizedDescription,
        parent_id: parent_id || null
      }
    });

  } catch (error) {
    console.error('Error al crear categoría:', error);
    res.status(500).json({ success: false, error: 'ERROR_SERVIDOR', message: 'Error interno del servidor.' });
  } finally {
    if (connection) connection.release();
  }
};

/**
 * FUNCIÓN Buscar por nombre: Buscar categorías por nombre
 */
const searchCategoriesByName = async (req, res) => {
    let connection;
    try {
        const { q } = req.query; // El término de búsqueda viene como un query parameter, ej: /search?q=lap

        if (!q) {
            return res.status(400).json({ success: false, error: 'QUERY_FALTANTE', message: 'Debes proporcionar un término de búsqueda en el parámetro "q".' });
        }

        const sanitizedQuery = sanitizeInput(q);
        
        connection = await getConnection();

        // Usamos LIKE con '%' para buscar coincidencias parciales
        const query = 'SELECT id, name, description FROM categories WHERE name LIKE ?';
        const [results] = await connection.execute(query, [`%${sanitizedQuery}%`]);

        res.status(200).json({ success: true, data: results });

    } catch (error) {
        console.error('Error al buscar categorías:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * Obtener todas las categorías
 */
const getAllCategories = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [categories] = await connection.execute('SELECT * FROM categories ORDER BY name ASC');
        res.status(200).json({ success: true, data: categories });
    } catch (error) {
        console.error('Error al obtener categorías:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR', message: 'Error interno del servidor.' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * Actualizar una categoría
 */
const updateCategory = async (req, res) => {
    let connection;
    try {
        // =================================================================
        // 1. VALIDACIÓN DE CAMPOS PERMITIDOS (AÑADIDA)
        // =================================================================
        const allowedFields = ['name', 'description', 'parent_id'];
        const receivedFields = Object.keys(req.body);
        const extraFields = receivedFields.filter(field => !allowedFields.includes(field));
        
        if (extraFields.length > 0) {
          return res.status(400).json({
            success: false,
            error: 'CAMPOS_NO_PERMITIDOS',
            message: `Los campos ${extraFields.join(', ')} no están permitidos.`
          });
        }

        const categoryId = req.params.id;
        const { name, description, parent_id } = req.body;

        if (receivedFields.length === 0) {
            return res.status(400).json({ success: false, error: 'SIN_DATOS', message: 'Debes proporcionar al menos un campo para actualizar.' });
        }
        
        connection = await getConnection();

        // =================================================================
        // 2. VALIDACIÓN DE NOMBRE DUPLICADO (YA EXISTENTE)
        // =================================================================
        if (name) {
            const sanitizedName = sanitizeInput(name);
            if (!sanitizedName || containsSQLInjection(sanitizedName)) {
                return res.status(400).json({ success: false, error: 'NOMBRE_INVALIDO' });
            }

            const [existing] = await connection.execute(
                'SELECT id FROM categories WHERE LOWER(name) = LOWER(?) AND id != ?',
                [sanitizedName, categoryId]
            );

            if (existing.length > 0) {
                return res.status(409).json({
                    success: false,
                    error: 'CATEGORIA_DUPLICADA',
                    message: `Ya existe otra categoría con el nombre "${sanitizedName}".`
                });
            }
        }
        
        // Lógica para construir y ejecutar la consulta UPDATE
        const updates = {};
        if (name) updates.name = sanitizeInput(name);
        if (description !== undefined) updates.description = sanitizeInput(description) || null;
        if (parent_id !== undefined) updates.parent_id = parent_id || null;

        const updateFields = Object.keys(updates).map(field => `${field} = ?`).join(', ');
        const queryParams = [...Object.values(updates), categoryId];
        
        const [result] = await connection.execute(`UPDATE categories SET ${updateFields} WHERE id = ?`, queryParams);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'CATEGORIA_NO_ENCONTRADA', message: 'No se encontró la categoría para actualizar.' });
        }

        res.status(200).json({ success: true, message: 'Categoría actualizada exitosamente.' });

    } catch (error) {
        console.error('Error al actualizar categoría:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR', message: 'Error interno del servidor.' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * Eliminar una categoría (Con validación de dependencias)
 */
const deleteCategory = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await getConnection();

        // =================================================================
        // NUEVA VALIDACIÓN: VERIFICAR SI TIENE SUBCATEGORÍAS ASOCIADAS
        // =================================================================
        const [children] = await connection.execute(
            'SELECT COUNT(id) as childCount FROM categories WHERE parent_id = ?',
            [id]
        );

        const childCount = children[0].childCount;

        if (childCount > 0) {
            return res.status(409).json({ // 409 Conflict es ideal para este caso
                success: false,
                error: 'CATEGORIA_CON_DEPENDENCIAS',
                message: `No se puede eliminar esta categoría porque tiene ${childCount} subcategoría(s) asociada(s). Por favor, reasigna o elimina las subcategorías primero.`
            });
        }

        // Si no tiene hijos, proceder con la eliminación
        const [result] = await connection.execute('DELETE FROM categories WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'CATEGORIA_NO_ENCONCONTRADA', message: 'La categoría no existe o ya fue eliminada.' });
        }

        res.status(200).json({ success: true, message: 'Categoría eliminada exitosamente.' });

    } catch (error) {
        console.error('Error al eliminar categoría:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR', message: 'Error interno del servidor.' });
    } finally {
        if (connection) connection.release();
    }
};


module.exports = {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
  searchCategoriesByName
  
};