

const { getConnection } = require('../config/database');
const { sanitizeInput, containsSQLInjection } = require('../utils/sanitizer');
const { checkPermission, PERMISSIONS } = require('../utils/permissions');
/**
 * [PROTEGIDO] Crear una nueva visita (Agendar)
 */
const createVisit = async (req, res) => {
    let connection;
    try {
        const { client_id, scheduled_for, notes } = req.body;
        const requested_user_id = req.body.user_id;
        const currentUser = req.user;

        let assigned_user_id;

        // Lógica de Asignación
        if (requested_user_id && requested_user_id !== currentUser.userId) {
            if (!checkPermission(currentUser.rol, PERMISSIONS.ASSIGN_VISITS)) {
                return res.status(403).json({ success: false, error: 'ACCESO_DENEGADO', message: 'No tienes permiso para asignar visitas a otros usuarios.' });
            }
            assigned_user_id = requested_user_id;
        } else {
            assigned_user_id = currentUser.userId;
        }
        
        const sanitizedNotes = notes ? sanitizeInput(notes) : null;
        if (sanitizedNotes && containsSQLInjection(sanitizedNotes)) {
            return res.status(400).json({ success: false, error: 'INPUT_MALICIOSO', message: 'El campo "notes" contiene patrones no permitidos.' });
        }

        connection = await getConnection();
        
        // Validación de Negocio 1: Verificar que el cliente existe
        const [client] = await connection.execute('SELECT id FROM clients WHERE id = ?', [client_id]);
        if (client.length === 0) {
            return res.status(404).json({ success: false, message: 'El cliente especificado no existe.' });
        }
        
        // =================================================================
        // NUEVA VALIDACIÓN: Verificar que el USUARIO asignado existe
        // =================================================================
        const [user] = await connection.execute('SELECT ID FROM users WHERE ID = ?', [assigned_user_id]);
        if (user.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'El usuario al que intentas asignar la visita no existe.' 
            });
        }

        // Inserción
        const [result] = await connection.execute(
            'INSERT INTO scheduled_visits (client_id, user_id, scheduled_for, notes, status) VALUES (?, ?, ?, ?, ?)',
            [client_id, assigned_user_id, scheduled_for, sanitizedNotes, 'pending']
        );
        
        res.status(201).json({ success: true, message: 'Visita agendada exitosamente.', data: { id: result.insertId } });
    } catch (error) {
        console.error('Error al crear visita:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};
/**
 * [PROTEGIDO] Actualizar una visita (Completar, Reagendar, etc.)
 * - Un vendedor solo puede editar sus visitas (y no puede reasignarlas).
 * - Un admin/gerente puede reasignar visitas.
 */
const updateVisit = async (req, res) => {
    let connection;
    try {
        const sanitizedId = sanitizeInput(req.params.id);
        if (isNaN(parseInt(sanitizedId, 10))) {
            return res.status(400).json({ success: false, message: 'El ID de la visita debe ser un número.' });
        }
        
        const updates = req.body;
        const currentUser = req.user;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, message: 'Debe proporcionar al menos un campo para actualizar.' });
        }
        
        // Sanitización y Detección de SQLi
        const sanitizedUpdates = {};
        for (const key in updates) {
            // ... (tu bucle de sanitización) ...
            const value = updates[key];
            if (typeof value === 'string') {
                const sanitizedValue = sanitizeInput(value);
                if (containsSQLInjection(sanitizedValue)) {
                    return res.status(400).json({ success: false, error: 'INPUT_MALICIOSO' });
                }
                sanitizedUpdates[key] = sanitizedValue;
            } else {
                sanitizedUpdates[key] = value;
            }
        }
        
        connection = await getConnection();

        // Validación de Propiedad y Existencia
        const [visits] = await connection.execute('SELECT user_id FROM scheduled_visits WHERE id = ?', [sanitizedId]);
        if (visits.length === 0) {
            return res.status(404).json({ success: false, message: 'La visita no fue encontrada.' });
        }
        
        // Lógica de Permisos de Edición
        const visitOwnerId = visits[0].user_id;
        const canAssign = checkPermission(currentUser.rol, PERMISSIONS.ASSIGN_VISITS);
        const isOwner = currentUser.userId === visitOwnerId;

        if (!isOwner && !canAssign) {
            return res.status(403).json({ success: false, message: 'No tienes permiso para modificar una visita que no te pertenece.' });
        }

        // Lógica de Permisos de Re-asignación
        if (sanitizedUpdates.user_id && sanitizedUpdates.user_id !== visitOwnerId) {
            if (!canAssign) {
                return res.status(403).json({ success: false, error: 'ACCESO_DENEGADO', message: 'No tienes permiso para re-asignar esta visita a otro usuario.' });
            }
            
            // =================================================================
            // NUEVA VALIDACIÓN: Validar que el nuevo usuario exista
            // =================================================================
            const [newUser] = await connection.execute('SELECT ID FROM users WHERE ID = ?', [sanitizedUpdates.user_id]);
            if (newUser.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'El nuevo usuario al que intentas asignar la visita no existe.' 
                });
            }
        }
        
        // Validación de Negocio: Si cambia el client_id, verificar que exista
        if (sanitizedUpdates.client_id) {
            const [client] = await connection.execute('SELECT id FROM clients WHERE id = ?', [sanitizedUpdates.client_id]);
            if (client.length === 0) {
                return res.status(404).json({ success: false, message: 'El nuevo cliente especificado no existe.' });
            }
        }
        
        // Ejecutar actualización
        const updateFields = Object.keys(sanitizedUpdates).map(field => `${field} = ?`).join(', ');
        const queryParams = [...Object.values(sanitizedUpdates), sanitizedId];
        
        await connection.execute(`UPDATE scheduled_visits SET ${updateFields} WHERE id = ?`, queryParams);
        
        res.status(200).json({ success: true, message: 'Visita actualizada exitosamente.' });
    } catch (error) {
        console.error('Error al actualizar visita:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};
/**
 * [PROTEGIDO] Obtener visitas.
 * Esta función unificada devuelve "mis visitas" o "todas las visitas"
 * basándose en los permisos del usuario.
 */
const getVisits = async (req, res) => {
    let connection;
    try {
        const currentUser = req.user;
        let query;
        let queryParams = [];

        // =================================================================
        // LÓGICA DE PERMISOS
        // Revisamos si el usuario tiene permiso para ver TODAS las visitas.
        // =================================================================
        if (checkPermission(currentUser.rol, PERMISSIONS.VIEW_ALL_VISITS)) {
            // Es Gerente/Admin: Trae todas las visitas
            query = 'SELECT * FROM scheduled_visits ORDER BY scheduled_for DESC';
        } else {
            // Es Vendedor: Trae solo sus propias visitas
            query = 'SELECT * FROM scheduled_visits WHERE user_id = ? ORDER BY scheduled_for DESC';
            queryParams.push(currentUser.userId);
        }

        connection = await getConnection();
        const [visits] = await connection.execute(query, queryParams);
        res.status(200).json({ success: true, data: visits });

    } catch (error) {
        console.error('Error al obtener visitas:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * [PROTEGIDO] Eliminar (cancelar) una visita
 */
const deleteVisit = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        const currentUser = req.user;
        
        connection = await getConnection();
        
        // Validación de Propiedad
        const [visits] = await connection.execute('SELECT user_id FROM scheduled_visits WHERE id = ?', [id]);
        if (visits.length === 0) {
            return res.status(404).json({ success: false, message: 'La visita no fue encontrada.' });
        }

        const visitOwnerId = visits[0].user_id;
        if (currentUser.userId !== visitOwnerId && currentUser.rol !== 'admin') {
            return res.status(403).json({ success: false, message: 'No tienes permiso para eliminar una visita que no te pertenece.' });
        }
        
        await connection.execute('DELETE FROM scheduled_visits WHERE id = ?', [id]);
        res.status(200).json({ success: true, message: 'Visita eliminada/cancelada exitosamente.' });
    } catch (error) {
        console.error('Error al eliminar visita:', error);
        res.status(500).json({ success: false, error: 'ERROR_SERVIDOR' });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = {
    createVisit,
    updateVisit,
    getVisits,
    deleteVisit
};