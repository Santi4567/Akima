import { useState } from 'react';
import { ArrowLeftIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/solid';
import { HasPermission } from '../HasPermission';
import { Notification } from '../Notification'; // Importamos el componente de notificación

const API_URL = import.meta.env.VITE_API_URL;

export const UserDetails = ({ user, onClose, onEdit, onDeleteSuccess }) => {
  const [notification, setNotification] = useState({ type: '', message: '' });

  if (!user) return null;

  // Función local para manejar la eliminación
  const handleDelete = async () => {
    if (!window.confirm(`¿Estás seguro de eliminar al usuario ${user.Nombre}?`)) return;

    try {
      const res = await fetch(`${API_URL}/api/users/${user.ID}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();

      if (data.success) {
        setNotification({ type: 'success', message: 'Usuario eliminado exitosamente.' });
        // Esperamos un momento para que el usuario lea el mensaje antes de cerrar
        setTimeout(() => {
          // Llamamos a onDeleteSuccess si existe (para recargar la lista), sino a onClose
          if (onDeleteSuccess) onDeleteSuccess();
          else onClose();
        }, 1500);
      } else {
        setNotification({ type: 'error', message: data.message || 'Error al eliminar.' });
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Error de conexión con el servidor.' });
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden border border-gray-200">
        
        {/* Notificación en la parte superior */}
        <Notification 
            type={notification.type} 
            message={notification.message} 
            onClose={() => setNotification({ type: '', message: '' })} 
        />

        {/* Header */}
        <div className="bg-gray-50 p-6 border-b flex justify-between items-center">
            <div className="flex items-center gap-4">
                <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full">
                    <ArrowLeftIcon className="h-5 w-5" />
                </button>
                <h2 className="text-2xl font-bold text-gray-800">{user.Nombre}</h2>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${user.Estado === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {user.Estado === 1 ? 'Activo' : 'Inactivo'}
            </span>
        </div>

        {/* Info */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <p className="text-sm text-gray-500">Rol del Sistema</p>
                <p className="text-lg font-medium text-gray-900">{user.rol}</p>
            </div>
            <div>
                <p className="text-sm text-gray-500">Correo Electrónico</p>
                <p className="text-lg font-medium text-gray-900">{user.Correo}</p>
            </div>
            <div>
                <p className="text-sm text-gray-500">Teléfono</p>
                <p className="text-lg font-medium text-gray-900">{user.phone || 'N/A'}</p>
            </div>
            <div>
                <p className="text-sm text-gray-500">Sexo</p>
                <p className="text-lg font-medium text-gray-900">{user.sex === 'M' ? 'Masculino' : 'Femenino'}</p>
            </div>
            <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Dirección</p>
                <p className="text-lg font-medium text-gray-900">{user.address || 'N/A'}</p>
            </div>
        </div>

        {/* Acciones */}
        <div className="p-6 bg-gray-50 border-t flex justify-end gap-4">
            <HasPermission required="edit.users">
                <button onClick={() => onEdit(user)} className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600">
                    <PencilIcon className="h-4 w-4" /> Editar
                </button>
            </HasPermission>
            
            <HasPermission required="delete.users">
                {/* Ahora llamamos a handleDelete localmente */}
                <button onClick={handleDelete} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                    <TrashIcon className="h-4 w-4" /> Eliminar
                </button>
            </HasPermission>
        </div>
    </div>
  );
};