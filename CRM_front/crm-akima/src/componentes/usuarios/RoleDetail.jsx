// src/componentes/usuarios/RoleDetail.jsx

import { useState, useEffect } from 'react';
import { 
  ArrowLeftIcon, 
  CheckCircleIcon, 
  UserIcon, 
  PencilIcon, 
  ShieldCheckIcon,
  Square2StackIcon 
} from '@heroicons/react/24/solid';
import { Notification } from '../Notification';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const RoleDetail = ({ roleName, users, onClose }) => {
  const [currentPermissions, setCurrentPermissions] = useState([]); 
  const [groupedPermissions, setGroupedPermissions] = useState({}); 
  const [isEditing, setIsEditing] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });

  // --- CARGAR DATOS ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [listRes, roleRes] = await Promise.all([
            fetch(`${API_URL}/api/users/admin/permissions-list`, { credentials: 'include' }),
            fetch(`${API_URL}/api/users/roles/${roleName}/permissions`, { credentials: 'include' })
        ]);

        const listData = await listRes.json();
        const roleData = await roleRes.json();

        // 1. Catálogo Agrupado (Lista maestra de opciones)
        if (listData.success) {
            setGroupedPermissions(listData.data); 
        }

        // 2. Permisos actuales del rol (CORRECCIÓN AQUÍ)
        if (roleData.success) {
            const rawData = roleData.data;

            // CASO ESPECIAL: ADMIN
            if (roleName === 'admin') {
                // Aunque el API traiga todos los grupos, forzamos el modo "Super Admin" visual
                setCurrentPermissions(['* SUPER ADMIN']);
            } 
            // CASO NORMAL: OTROS ROLES
            else if (typeof rawData === 'object' && !Array.isArray(rawData)) {
                // El API devuelve un objeto agrupado { GROUP: [perms], GROUP2: [perms] }
                // Lo "aplanamos" a un solo array de strings para que el estado lo entienda
                const flatPerms = Object.values(rawData).flat();
                setCurrentPermissions(flatPerms);
            } 
            // CASO LEGACY (Por si acaso alguna vez devuelve array directo o string)
            else {
                setCurrentPermissions(Array.isArray(rawData) ? rawData : []);
            }
        } else {
            setCurrentPermissions([]);
        }

      } catch (error) {
        console.error(error);
        setNotification({ type: 'error', message: 'Error al cargar configuración.' });
      }
    };

    if (roleName) fetchData();
  }, [roleName]);

  // --- GUARDAR CAMBIOS ---
  const handleSavePermissions = async () => {
    try {
      let permissionsToSend;

      // Si es Super Admin, mandamos asterisco (aunque la UI de admin no deja guardar, es protección extra)
      if (currentPermissions.includes('* SUPER ADMIN')) {
          permissionsToSend = '*';
      } else {
          // Limpieza de datos
          permissionsToSend = currentPermissions
              .filter(p => typeof p === 'string' && p.trim() !== '')
              .map(p => p.trim());
          permissionsToSend = [...new Set(permissionsToSend)];
      }
      
      // Construimos el payload: { "gerente": ["permiso1", "permiso2"] }
      const payload = {
        [roleName]: permissionsToSend
      };

      const res = await fetch(`${API_URL}/api/users/admin/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();

      if (data.success) {
        setNotification({ type: 'success', message: 'Permisos actualizados correctamente.' });
        setIsEditing(false);
      } else {
        setNotification({ type: 'error', message: data.message });
      }
    } catch (e) {
      setNotification({ type: 'error', message: 'Error de red al guardar.' });
    }
  };

  // --- TOGGLE INDIVIDUAL ---
  const togglePermission = (perm) => {
    if (currentPermissions.includes(perm)) {
      setCurrentPermissions(currentPermissions.filter(p => p !== perm));
    } else {
      setCurrentPermissions([...currentPermissions, perm]);
    }
  };

  // --- TOGGLE GRUPO COMPLETO ---
  const toggleGroup = (groupPerms) => {
    const allSelected = groupPerms.every(p => currentPermissions.includes(p));

    if (allSelected) {
      setCurrentPermissions(currentPermissions.filter(p => !groupPerms.includes(p)));
    } else {
      const newPerms = [...new Set([...currentPermissions, ...groupPerms])];
      setCurrentPermissions(newPerms);
    }
  };

  // Verificamos si es admin para bloquear la UI
  const isAdminRole = roleName === 'admin';

  return (
    <div className="space-y-6">
      <Notification type={notification.type} message={notification.message} onClose={() => setNotification({type:'', message:''})} />

      {/* Header */}
      <div className="flex items-center gap-4 border-b pb-4">
        <button onClick={onClose} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
          <ArrowLeftIcon className="h-6 w-6" />
        </button>
        <div>
            <h2 className="text-2xl font-bold text-gray-900 capitalize">Rol: {roleName}</h2>
            <p className="text-sm text-gray-500">{users.length} usuarios asignados</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQ: EDITOR DE PERMISOS */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <ShieldCheckIcon className="h-5 w-5 text-blue-600"/> Permisos Asignados
                </h3>
                
                {/* Ocultar botones si es Admin */}
                {!isAdminRole && (
                    !isEditing ? (
                        <button onClick={() => setIsEditing(true)} className="text-sm bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 flex items-center gap-1 shadow-sm">
                            <PencilIcon className="h-4 w-4"/> Editar Permisos
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button onClick={() => setIsEditing(false)} className="text-sm border px-3 py-1 rounded hover:bg-gray-50 text-gray-600">
                                Cancelar
                            </button>
                            <button onClick={handleSavePermissions} className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 shadow-sm">
                                Guardar Cambios
                            </button>
                        </div>
                    )
                )}
            </div>

            {/* CASO ESPECIAL: ADMIN */}
            {isAdminRole ? (
                <div className="p-8 text-center bg-blue-50 border border-blue-200 rounded-lg">
                    <ShieldCheckIcon className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                    <h4 className="text-lg font-bold text-blue-900">Acceso Total (Super Admin)</h4>
                    <p className="text-sm text-blue-700 mt-1">
                        Este rol tiene acceso irrestricto a todos los módulos del sistema. 
                        No es posible modificar sus permisos individualmente.
                    </p>
                </div>
            ) : (
                /* CASO NORMAL: LISTA AGRUPADA */
                <div className="space-y-6">
                    {Object.entries(groupedPermissions).map(([groupName, permissions]) => {
                        const hasPermsInGroup = permissions.some(p => currentPermissions.includes(p));
                        if (!isEditing && !hasPermsInGroup) return null;

                        return (
                            <div key={groupName} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">{groupName}</h4>
                                    {isEditing && (
                                        <button 
                                            onClick={() => toggleGroup(permissions)}
                                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-white px-2 py-1 rounded border hover:bg-blue-50"
                                        >
                                            <Square2StackIcon className="h-3 w-3"/> Grupo
                                        </button>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {permissions.map(perm => {
                                        const isActive = currentPermissions.includes(perm);
                                        if (!isEditing && !isActive) return null;

                                        return (
                                            <button 
                                                key={perm}
                                                onClick={() => isEditing && togglePermission(perm)}
                                                disabled={!isEditing}
                                                className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all flex items-center gap-2 ${
                                                    isActive 
                                                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                                                    : 'bg-white border-gray-300 text-gray-500 hover:border-gray-400'
                                                }`}
                                            >
                                                {isEditing && (
                                                    <div className={`w-3 h-3 rounded border flex items-center justify-center ${
                                                        isActive ? 'bg-blue-800 border-blue-800' : 'bg-white border-gray-300'
                                                    }`}>
                                                        {isActive && <CheckCircleIcon className="h-3 w-3 text-white" />}
                                                    </div>
                                                )}
                                                {perm}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    {!isEditing && currentPermissions.length === 0 && (
                        <div className="p-6 text-center border-2 border-dashed border-gray-200 rounded-lg w-full">
                            <p className="text-gray-400 italic">Este rol no tiene permisos asignados.</p>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* COLUMNA DER: USUARIOS */}
        <div className="lg:col-span-1 bg-white p-4 rounded-lg shadow border border-gray-200 h-fit">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-gray-500"/> Usuarios
            </h3>
            <div className="overflow-y-auto max-h-[500px] pr-2">
                {users.length > 0 ? (
                    <ul className="divide-y divide-gray-100">
                        {users.map(u => (
                            <li key={u.ID} className="py-3 flex items-center gap-3 hover:bg-gray-50 px-2 rounded transition-colors">
                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs border">
                                    {u.Nombre ? u.Nombre.charAt(0).toUpperCase() : '?'}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-sm font-medium text-gray-900 truncate">{u.Nombre}</p>
                                    <p className="text-xs text-gray-500 truncate">{u.Correo}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500 text-sm text-center py-8">Ningún usuario tiene este rol actualmente.</p>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};