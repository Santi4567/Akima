import { useState, useEffect, useCallback } from 'react';
import { PlusIcon, TrashIcon, UserGroupIcon, ShieldCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { Notification } from '../Notification';

// Importamos las nuevas vistas
import { RoleDetail } from './RoleDetail';
import { OrphansManager } from './OrphansManager';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const RoleManager = () => {
  // Datos
  const [rolesStats, setRolesStats] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [orphans, setOrphans] = useState([]);
  
  // UI
  const [view, setView] = useState('grid'); 
  const [selectedRole, setSelectedRole] = useState(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState({ type: '', message: '' });

  // --- NUEVO ESTADO PARA LA UI DE CREAR ---
  const [isCreating, setIsCreating] = useState(false);

  // --- CARGAR DATOS ---
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const rolesRes = await fetch(`${API_URL}/api/users/admin/roles/stats`, { credentials: 'include' });
      const rolesData = await rolesRes.json();
      
      const usersRes = await fetch(`${API_URL}/api/users`, { credentials: 'include' });
      const usersData = await usersRes.json();

      if (rolesData.success && usersData.success) {
        const rolesList = rolesData.data.map(r => r.role);
        setRolesStats(rolesData.data);
        setAllUsers(usersData.data);

        const orphanList = usersData.data.filter(u => !rolesList.includes(u.rol));
        setOrphans(orphanList);
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Error cargando datos de roles.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- ACCIONES ---
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
            // CAMBIO: Cerramos el formulario al terminar con éxito
            setIsCreating(false); 
            fetchData();
        } else {
            setNotification({ type: 'error', message: data.message });
        }
    } catch (e) { setNotification({ type: 'error', message: 'Error al crear rol.' }); }
  };

  const handleDeleteRole = async (e, roleName) => {
    e.stopPropagation(); 
    if (!window.confirm(`¿Eliminar rol "${roleName}"? Los usuarios pasarán a ser huérfanos.`)) return;

    try {
        const res = await fetch(`${API_URL}/api/users/admin/roles/${roleName}`, {
            method: 'DELETE', credentials: 'include'
        });
        const data = await res.json();
        if (data.success) {
            setNotification({ type: 'success', message: data.message });
            fetchData(); 
        } else {
            setNotification({ type: 'error', message: data.message });
        }
    } catch (e) { setNotification({ type: 'error', message: 'Error al eliminar.' }); }
  };

  // --- RENDERIZADO CONDICIONAL ---

  if (view === 'detail' && selectedRole) {
    const usersInRole = allUsers.filter(u => u.rol === selectedRole);
    return (
        <RoleDetail 
            roleName={selectedRole} 
            users={usersInRole} 
            onClose={() => setView('grid')} 
        />
    );
  }

  if (view === 'orphans') {
    const validRoles = rolesStats.map(r => r.role);
    return (
        <OrphansManager 
            orphans={orphans} 
            validRoles={validRoles} 
            onClose={() => setView('grid')}
            onAssignSuccess={() => { setView('grid'); fetchData(); }}
        />
    );
  }

  // --- VISTA GRID ---
  return (
    <div className="space-y-6">
        <Notification type={notification.type} message={notification.message} onClose={() => setNotification({type:'', message:''})} />
        
        {/* --- SECCIÓN: GESTIÓN Y CREACIÓN --- */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <ShieldCheckIcon className="h-6 w-6 text-blue-600" /> Gestión de Roles
                </h2>

                {/* 1. BOTÓN INICIAL (Solo visible si NO estamos creando) */}
                {!isCreating && (
                    <button 
                        onClick={() => setIsCreating(true)} 
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 shadow-sm transition-all"
                    >
                        <PlusIcon className="h-5 w-5"/> Nuevo Rol
                    </button>
                )}
            </div>

            {/* 2. FORMULARIO DESPLEGABLE (Solo visible si estamos creando) */}
            {isCreating && (
                <div className="mt-4 flex flex-col sm:flex-row gap-4 items-end bg-gray-50 p-4 rounded-md border border-gray-100 animate-fadeIn">
                    <div className="flex-grow w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Nuevo Rol</label>
                        <input 
                            type="text" 
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" 
                            placeholder="Ej: auditor"
                            value={newRoleName} 
                            onChange={e => setNewRoleName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateRole()}
                            autoFocus // Para escribir directo al abrir
                        />
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button 
                            onClick={() => { setIsCreating(false); setNewRoleName(''); }} 
                            className="w-1/2 sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-white transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handleCreateRole} 
                            className="w-1/2 sm:w-auto bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors shadow-sm"
                        >
                            Guardar
                        </button>
                    </div>
                </div>
            )}
        </div>

        {/* Grid de Tarjetas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* TARJETA HUÉRFANOS */}
            {orphans.length > 0 && (
                <div 
                    onClick={() => setView('orphans')}
                    className="bg-red-50 p-5 rounded-lg shadow-sm border border-red-200 hover:shadow-md transition-shadow cursor-pointer group"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-lg font-bold text-red-800">Huérfanos</h3>
                            <p className="text-sm text-red-600 mt-1">Usuarios con rol inválido</p>
                        </div>
                        <ExclamationTriangleIcon className="h-8 w-8 text-red-500 animate-pulse"/>
                    </div>
                    <div className="mt-4 pt-4 border-t border-red-100 flex justify-between items-center">
                        <span className="font-bold text-2xl text-red-700">{orphans.length}</span>
                        <span className="text-xs font-medium bg-red-200 text-red-800 px-2 py-1 rounded">Requiere Acción</span>
                    </div>
                </div>
            )}

            {/* TARJETAS DE ROLES */}
            {isLoading ? <p>Cargando...</p> : rolesStats.map((item, index) => (
                <div 
                    key={index} 
                    onClick={() => { setSelectedRole(item.role); setView('detail'); }}
                    className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer relative group"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 capitalize">{item.role}</h3>
                            <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                                <UserGroupIcon className="h-4 w-4" />
                                <span>{item.count} usuario{item.count !== 1 && 's'}</span>
                            </div>
                        </div>
                        {item.role === 'admin' ? (
                            <ShieldCheckIcon className="h-6 w-6 text-gray-300" title="Sistema"/>
                        ) : (
                            <button 
                                onClick={(e) => handleDeleteRole(e, item.role)}
                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            >
                                <TrashIcon className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-center text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                        Ver Permisos y Usuarios &rarr;
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};