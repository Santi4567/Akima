// Crear nuevo archivo: controllers/clientController.js

const validator = require('validator');
const { getConnection } = require('../config/database');
const { sanitizeInput, containsSQLInjection } = require('../utils/sanitizer');

/**
 * [PROTEGIDO] Crear un nuevo cliente
 * (Actualizado para verificar duplicados por email Y por nombre completo)
 */
const createClient = async (req, res) => {
    let connection;
    try {
        const clientData = req.body;

        // 1. Sanitización y Detección de SQLi
        const sanitizedData = {};
        for (const key in clientData) {
            const value = clientData[key];
            if (typeof value === 'string') {
                const sanitizedValue = sanitizeInput(value);
                if (containsSQLInjection(sanitizedValue)) {
                    return res.status(400).json({ success: false, error: 'INPUT_MALICIOSO', message: `El campo '${key}' contiene patrones no permitidos.` });
                }
                sanitizedData[key] = sanitizedValue;
            } else {
                sanitizedData[key] = value;
            }
        }
        
        // 2. Validación de formato de Email
        if (!validator.isEmail(sanitizedData.email)) {
            return res.status(400).json({ success: false, error: 'EMAIL_INVALIDO', message: 'El formato del correo no es válido.' });
        }
        
        connection = await getConnection();

        // 3. Validación de Negocio: Email duplicado
        const [existingEmail] = await connection.execute('SELECT id FROM clients WHERE email = ?', [sanitizedData.email]);
        if (existingEmail.length > 0) {
            return res.status(409).json({ success: false, error: 'EMAIL_DUPLICADO', message: 'Ya existe un cliente con este correo electrónico.' });
        }

        // =================================================================
        // 4. NUEVA VALIDACIÓN: Nombre completo duplicado
        // =================================================================
        const { first_name, last_name } = sanitizedData;
        const [existingName] = await connection.execute(
            'SELECT id FROM clients WHERE first_name = ? AND last_name = ?', 
            [first_name, last_name]
        );
        if (existingName.length > 0) {
            return res.status(409).json({ 
                success: false, 
                error: 'NOMBRE_DUPLICADO', 
                message: `Ya existe un cliente con el nombre "${first_name} ${last_name}".` 
            });
        }
        
        // 5. Inserción
        const fields = Object.keys(sanitizedData);
        const values = Object.values(sanitizedData);
        const placeholders = fields.map(() => '?').join(', ');
        
        const [result] = await connection.execute(`INSERT INTO clients (${fields.join(', ')}) VALUES (${placeholders})`, values);
        res.status(201).json({ success: true, message: 'Cliente creado exitosamente.', data: { id: result.insertId, ...sanitizedData } });

    } catch (error) {
        console.error('Error al crear cliente:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * [PROTEGIDO] Obtener un cliente por su ID
 */
const getClientById = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await getConnection();
        const [client] = await connection.execute('SELECT * FROM clients WHERE id = ?', [id]);
        if (client.length === 0) {
            return res.status(404).json({ success: false, message: 'Cliente no encontrado.' });
        }
        res.status(200).json({ success: true, data: client[0] });
    } catch (error) {
        console.error('Error al obtener cliente por ID:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * [PROTEGIDO] Obtener todos los clientes
 */
const getAllClients = async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const [clients] = await connection.execute('SELECT * FROM clients ORDER BY first_name ASC');
        res.status(200).json({ success: true, data: clients });
    } catch (error) {
        console.error('Error al obtener clientes:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * [PROTEGIDO] Buscar clientes por nombre
 */
const searchClientByName = async (req, res) => {
    let connection;
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ success: false, message: 'Debe proporcionar un término de búsqueda "q".' });
        }
        const sanitizedQuery = sanitizeInput(q);
        if (containsSQLInjection(sanitizedQuery)) {
            return res.status(400).json({ success: false, error: 'INPUT_MALICIOSO', message: 'El término de búsqueda contiene patrones no permitidos.' });
        }
        
        connection = await getConnection();
        // Buscamos en nombre O apellido
        const query = 'SELECT * FROM clients WHERE first_name LIKE ? OR last_name LIKE ? ORDER BY first_name ASC';
        const [clients] = await connection.execute(query, [`%${sanitizedQuery}%`, `%${sanitizedQuery}%`]);
        res.status(200).json({ success: true, data: clients });
    } catch (error) {
        console.error('Error al buscar clientes:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * [PROTEGIDO] Actualizar un cliente
 */
/**
 * [PROTEGIDO] Actualizar un cliente
 * (Actualizado para verificar duplicados de email Y nombre completo en otros clientes)
 */
const updateClient = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const updates = req.body;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, message: 'Debe proporcionar al menos un campo para actualizar.' });
        }
        
        // =================================================================
        // 1. Sanitización y Detección de SQLi (El Bucle)
        // =================================================================
        const sanitizedUpdates = {};
        for (const key in updates) {
            const value = updates[key];
            if (typeof value === 'string') {
                const sanitizedValue = sanitizeInput(value);
                if (containsSQLInjection(sanitizedValue)) {
                    return res.status(400).json({ success: false, error: 'INPUT_MALICIOSO', message: `El campo '${key}' contiene patrones no permitidos.` });
                }
                sanitizedUpdates[key] = sanitizedValue;
            } else {
                sanitizedUpdates[key] = value; // Copiar valores no-string (como booleanos o números)
            }
        }
        
        // 2. Validación de formato de Email (si se está actualizando)
        if (sanitizedUpdates.email && !validator.isEmail(sanitizedUpdates.email)) {
             return res.status(400).json({ success: false, error: 'EMAIL_INVALIDO', message: 'El formato del correo no es válido.' });
        }
        
        connection = await getConnection();

        // 3. Validación de Negocio: Email duplicado
        if (sanitizedUpdates.email) {
            const [existing] = await connection.execute(
                'SELECT id FROM clients WHERE email = ? AND id != ?', 
                [sanitizedUpdates.email, id]
            );
            if (existing.length > 0) {
                return res.status(409).json({ success: false, error: 'EMAIL_DUPLICADO', message: 'El correo ya está en uso por otro cliente.' });
            }
        }
        
        // =================================================================
        // 4. NUEVA VALIDACIÓN: Nombre completo duplicado
        // =================================================================
        // Solo revisamos si se está actualizando el nombre o el apellido
        if (sanitizedUpdates.first_name || sanitizedUpdates.last_name) {
            // Primero, necesitamos el nombre y apellido actuales del cliente
            const [currentUser] = await connection.execute('SELECT first_name, last_name FROM clients WHERE id = ?', [id]);
            if (currentUser.length === 0) {
                return res.status(404).json({ success: false, message: 'Cliente no encontrado.' });
            }

            // Determinamos cuál será el "nuevo" nombre completo
            const newFirstName = sanitizedUpdates.first_name || currentUser[0].first_name;
            const newLastName = sanitizedUpdates.last_name || currentUser[0].last_name;

            // Ahora, buscamos si OTRO cliente ya tiene esa combinación
            const [existingName] = await connection.execute(
                'SELECT id FROM clients WHERE first_name = ? AND last_name = ? AND id != ?',
                [newFirstName, newLastName, id]
            );
            
            if (existingName.length > 0) {
                return res.status(409).json({ 
                    success: false, 
                    error: 'NOMBRE_DUPLICADO', 
                    message: `Ya existe otro cliente con el nombre "${newFirstName} ${newLastName}".` 
                });
            }
        }
        
        // 5. Ejecutar actualización
        const updateFields = Object.keys(sanitizedUpdates).map(field => `${field} = ?`).join(', ');
        const queryParams = [...Object.values(sanitizedUpdates), id];
        
        const [result] = await connection.execute(`UPDATE clients SET ${updateFields} WHERE id = ?`, queryParams);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Cliente no encontrado.' });
        }
        
        res.status(200).json({ success: true, message: 'Cliente actualizado exitosamente.' });
    } catch (error) {
        console.error('Error al actualizar cliente:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * [PROTEGIDO] Eliminar un cliente
 */
const deleteClient = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await getConnection();
        
        // Futura validación: No eliminar si tiene ventas o visitas activas.
        
        const [result] = await connection.execute('DELETE FROM clients WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Cliente no encontrado o ya fue eliminado.' });
        }
        res.status(200).json({ success: true, message: 'Cliente eliminado exitosamente.' });
    } catch (error) {
        console.error('Error al eliminar cliente:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};
/**
 * [PROTEGIDO] Reporte de Mejores Clientes (VIP)
 * Criterio: Mayor volumen de compras y velocidad de pago.
 */
const getBestClients = async (req, res) => {
    let connection;
    try {
        // Solo Admin y Gerentes deberían ver esto (o Ventas si lo decides)
        // Usamos un permiso de alto nivel como 'view.reports' o reutilizamos 'view.all.orders'
        // Aquí usaré 'view.clients' para simplificar, pero podrías restringirlo más.
        
        connection = await getConnection();

        const sql = `
            SELECT 
                c.id,
                CONCAT(c.first_name, ' ', c.last_name) AS client_name,
                c.email,
                c.phone,
                
                -- Métricas de Volumen
                COUNT(DISTINCT o.id) AS total_orders,
                COALESCE(SUM(o.total_amount), 0) AS total_spent,
                
                -- Métricas de Pago (Promedio en Horas)
                -- TIMESTAMPDIFF calcula la diferencia en horas entre creación y pago
                ROUND(AVG(TIMESTAMPDIFF(HOUR, o.created_at, p.payment_date)), 1) AS avg_hours_to_pay,
                
                -- Última compra
                MAX(o.created_at) as last_purchase_date

            FROM clients c
            INNER JOIN orders o ON c.id = o.client_id
            -- Usamos LEFT JOIN con payments para incluir clientes que compran aunque no hayan pagado todo
            LEFT JOIN payments p ON o.id = p.order_id
            
            WHERE o.status != 'cancelled'
            GROUP BY c.id
            
            -- ORDENAMIENTO MÁGICO:
            -- Primero los que más gastan, luego los que pagan más rápido (menor tiempo)
            ORDER BY total_spent DESC, avg_hours_to_pay ASC
            LIMIT 20;
        `;

        const [report] = await connection.execute(sql);

        res.status(200).json({ 
            success: true, 
            message: 'Reporte de mejores clientes generado.', 
            data: report 
        });

    } catch (error) {
        console.error('Error al obtener reporte de mejores clientes:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = {
    createClient,
    getAllClients,
    getClientById,
    searchClientByName,
    updateClient,
    deleteClient,
    getBestClients
};