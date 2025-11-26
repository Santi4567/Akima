import { useState, useEffect, useCallback } from 'react';
import { PlusIcon, TrashIcon, UserGroupIcon, ShieldCheckIcon } from '@heroicons/react/24/solid';
import { Notification } from '../Notification';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const RoleManager = () => {
  const [rolesStats, setRolesStats] = useState([]);
  const [newRoleName, setNewRoleName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState({ type: '', message: '' });

  // --- 1. Cargar Estadísticas de Roles ---
  const fetchRolesStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/users/admin/roles/stats`, {
        method: 'GET',
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        setRolesStats(data.data); // [{ role: "admin", count: 1 }, ...]
      } else {
        setNotification({ type: 'error', message: data.message });
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Error al cargar roles.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRolesStats();
  }, [fetchRolesStats]);

  // --- 2. Crear Nuevo Rol ---
  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return;
    
    try {
        const res = await fetch(`${API_URL}/api/users/admin/roles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ roleName: newRoleName })
        });
        const data = await res.json();
        
        if (data.success) {
            setNotification({ type: 'success', message: data.message });
            setNewRoleName('');
            fetchRolesStats(); // Recargar la lista
        } else {
            setNotification({ type: 'error', message: data.message });
        }
    } catch (e) { 
        setNotification({ type: 'error', message: 'Error de red al crear rol.' }); 
    }
  };

  // --- 3. Eliminar Rol ---
  const handleDeleteRole = async (roleName) => {
    if (!window.confirm(`¿Estás seguro de eliminar el rol "${roleName}"?`)) return;

    try {
        const res = await fetch(`${API_URL}/api/users/admin/roles/${roleName}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        const data = await res.json();

        if (data.success) {
            setNotification({ type: 'success', message: data.message });
            fetchRolesStats(); // Recargar la lista
        } else {
            setNotification({ type: 'error', message: data.message || data.error });
        }
    } catch (e) {
        setNotification({ type: 'error', message: 'Error al eliminar rol.' });
    }
  };

  return (
    <div className="space-y-6">
        <Notification type={notification.type} message={notification.message} onClose={() => setNotification({type:'', message:''})} />
        
        {/* --- SECCIÓN: CREAR ROL --- */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ShieldCheckIcon className="h-6 w-6 text-blue-600" />
                Gestión de Roles del Sistema
            </h2>
            
            <div className="flex flex-col sm:flex-row gap-4 items-end bg-gray-50 p-4 rounded-md border border-gray-100">
                <div className="flex-grow w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nuevo Nombre de Rol</label>
                    <input 
                        type="text" 
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" 
                        placeholder="Ej: supervisor, auditor..."
                        value={newRoleName}
                        onChange={e => setNewRoleName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateRole()}
                    />
                </div>
                <button 
                    onClick={handleCreateRole} 
                    className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center gap-2 font-medium shadow-sm"
                >
                    <PlusIcon className="h-5 w-5"/> Crear Rol
                </button>
            </div>
        </div>

        {/* --- SECCIÓN: LISTA DE ROLES (GRID) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
                <p className="text-gray-500 col-span-full text-center py-10">Cargando roles...</p>
            ) : rolesStats.length === 0 ? (
                <p className="text-gray-500 col-span-full text-center py-10">No hay roles definidos.</p>
            ) : (
                rolesStats.map((item, index) => (
                    <div key={index} className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex justify-between items-center">
                        
                        {/* Info del Rol */}
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 capitalize">{item.role}</h3>
                            <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                                <UserGroupIcon className="h-4 w-4" />
                                <span>{item.count} usuario{item.count !== 1 && 's'} asignado{item.count !== 1 && 's'}</span>
                            </div>
                        </div>

                        {/* Botón Eliminar (Protegemos 'admin' visualmente aunque el backend ya lo protege) */}
                        {item.role !== 'admin' && (
                            <button 
                                onClick={() => handleDeleteRole(item.role)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                title="Eliminar Rol"
                            >
                                <TrashIcon className="h-5 w-5" />
                            </button>
                        )}
                        
                        {/* Icono Candado para Admin */}
                        {item.role === 'admin' && (
                            <div className="p-2 text-gray-400" title="Rol de sistema (No eliminable)">
                                <ShieldCheckIcon className="h-5 w-5" />
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    </div>
  );
};