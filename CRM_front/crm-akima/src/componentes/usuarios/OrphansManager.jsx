import { useState } from 'react';
import { ArrowLeftIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { Notification } from '../Notification';

const API_URL = import.meta.env.VITE_API_URL;

export const OrphansManager = ({ orphans, validRoles, onClose, onAssignSuccess }) => {
  const [selectedUsers, setSelectedUsers] = useState([]); // IDs de usuarios seleccionados
  const [targetRole, setTargetRole] = useState('');
  const [notification, setNotification] = useState({ type: '', message: '' });
  const [isProcessing, setIsProcessing] = useState(false);

  // Manejar selección individual
  const toggleSelect = (id) => {
    if (selectedUsers.includes(id)) setSelectedUsers(selectedUsers.filter(uid => uid !== id));
    else setSelectedUsers([...selectedUsers, id]);
  };

  // Seleccionar todos
  const toggleSelectAll = () => {
    if (selectedUsers.length === orphans.length) setSelectedUsers([]);
    else setSelectedUsers(orphans.map(u => u.ID));
  };

  // Acción: Reasignar Rol
  const handleReassign = async () => {
    if (!targetRole || selectedUsers.length === 0) return;
    setIsProcessing(true);

    // Como tu API de actualizar usuario es individual (PUT /users/:id),
    // haremos un loop de promesas. Idealmente el backend tendría un bulk-update.
    try {
      const promises = selectedUsers.map(userId => {
        // Buscamos el usuario original para no perder sus otros datos, 
        // o enviamos solo el rol si tu API soporta PATCH parcial.
        // Asumiendo que tu PUT requiere todos los datos o soporta parciales:
        // Enviaremos solo el rol, esperando que el backend soporte actualización parcial.
        // Si no, tendrías que pasar toda la info del usuario.
        
        return fetch(`${API_URL}/api/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ rol: targetRole }) 
        });
      });

      await Promise.all(promises);
      
      setNotification({ type: 'success', message: 'Usuarios reasignados correctamente.' });
      setTimeout(() => onAssignSuccess(), 1500);

    } catch (error) {
      setNotification({ type: 'error', message: 'Error al reasignar algunos usuarios.' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
        <Notification type={notification.type} message={notification.message} onClose={() => setNotification({type:'', message:''})} />

        <div className="flex items-center gap-4 border-b pb-4 bg-red-50 p-4 rounded-t-lg border-red-100">
            <button onClick={onClose} className="p-2 text-red-700 hover:bg-red-100 rounded-full">
                <ArrowLeftIcon className="h-6 w-6" />
            </button>
            <div>
                <h2 className="text-2xl font-bold text-red-800 flex items-center gap-2">
                    <ExclamationTriangleIcon className="h-6 w-6"/> Zona de Huérfanos
                </h2>
                <p className="text-sm text-red-600">
                    Estos usuarios tienen un rol que ya no existe en el sistema. Debes reasignarlos.
                </p>
            </div>
        </div>

        {/* Barra de Acción Masiva */}
        <div className="bg-white p-4 rounded-lg shadow border flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-grow w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reasignar {selectedUsers.length} usuario(s) seleccionado(s) a:
                </label>
                <select 
                    className="w-full p-2 border rounded-md"
                    value={targetRole}
                    onChange={e => setTargetRole(e.target.value)}
                >
                    <option value="">-- Seleccionar Nuevo Rol --</option>
                    {validRoles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
            </div>
            <button 
                onClick={handleReassign}
                disabled={isProcessing || selectedUsers.length === 0 || !targetRole}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300"
            >
                {isProcessing ? 'Procesando...' : 'Aplicar Cambios'}
            </button>
        </div>

        {/* Tabla */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 text-left">
                            <input type="checkbox" 
                                checked={selectedUsers.length === orphans.length && orphans.length > 0}
                                onChange={toggleSelectAll}
                                className="h-4 w-4 text-blue-600 rounded"
                            />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol Inválido (Actual)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Correo</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {orphans.map(user => (
                        <tr key={user.ID} className="hover:bg-red-50">
                            <td className="px-4 py-4">
                                <input type="checkbox" 
                                    checked={selectedUsers.includes(user.ID)}
                                    onChange={() => toggleSelect(user.ID)}
                                    className="h-4 w-4 text-blue-600 rounded"
                                />
                            </td>
                            <td className="px-6 py-4 font-medium text-gray-900">{user.Nombre}</td>
                            <td className="px-6 py-4">
                                <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-bold">
                                    {user.rol}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-gray-500">{user.Correo}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
};