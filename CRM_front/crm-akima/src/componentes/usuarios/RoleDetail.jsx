import { useState, useEffect } from 'react';
import { 
  ArrowLeftIcon, 
  CheckCircleIcon, 
  UserIcon, 
  PencilIcon, 
  ShieldCheckIcon,
  XMarkIcon 
} from '@heroicons/react/24/solid';
import { Notification } from '../Notification';

const API_URL = import.meta.env.VITE_API_URL;

export const RoleDetail = ({ roleName, users, onClose }) => {
  const [currentPermissions, setCurrentPermissions] = useState([]); // Permisos que TIENE el rol
  const [allPermissions, setAllPermissions] = useState([]); // Catálogo de permisos disponibles
  const [isEditing, setIsEditing] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });

  // --- CARGAR DATOS ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Ejecutamos en paralelo para velocidad
        const [listRes, roleRes] = await Promise.all([
            fetch(`${API_URL}/api/users/admin/permissions-list`, { credentials: 'include' }),
            fetch(`${API_URL}/api/users/roles/${roleName}/permissions`, { credentials: 'include' })
        ]);

        const listData = await listRes.json();
        const roleData = await roleRes.json();

        // 1. Catálogo de opciones (botones)
        if (listData.success) {
            setAllPermissions(listData.data);
        }

        // 2. Permisos actuales del rol
        if (roleData.success) {
            const perms = roleData.data;
            // Si es '*', lo manejamos visualmente como un permiso especial, o si es array lo guardamos tal cual
            setCurrentPermissions(Array.isArray(perms) ? perms : (perms === '*' ? ['* SUPER ADMIN'] : []));
        } else {
            // Si es un rol nuevo sin permisos configurados
            setCurrentPermissions([]);
        }

      } catch (error) {
        console.error("Error cargando permisos", error);
        setNotification({ type: 'error', message: 'Error al cargar configuración.' });
      }
    };

    if (roleName) fetchData();
  }, [roleName]);

  // --- GUARDAR CAMBIOS (PUT) ---
  const handleSavePermissions = async () => {
    try {
      let permissionsToSend;

      // 1. Limpieza y Lógica de Admin
      if (currentPermissions.includes('* SUPER ADMIN') || currentPermissions.includes('*')) {
          permissionsToSend = '*';
      } else {
          // === AQUÍ ESTÁ LA MAGIA DE LA LIMPIEZA ===
          permissionsToSend = currentPermissions
              // A. Filtramos que sea string y que no esté vacío
              .filter(p => typeof p === 'string' && p.trim() !== '' && p !== '* SUPER ADMIN')
              // B. Quitamos espacios accidentales al inicio/final
              .map(p => p.trim());
          
          // C. Eliminamos duplicados por si acaso
          permissionsToSend = [...new Set(permissionsToSend)];
      }

      // 2. Construir Payload
      const payload = {
        [roleName]: permissionsToSend
      };

      console.log("Enviando Payload Limpio:", JSON.stringify(payload)); // <--- Verifica esto en la consola del navegador

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

  // --- TOGGLE (Marcar/Desmarcar) ---
  const togglePermission = (perm) => {
    if (currentPermissions.includes(perm)) {
      setCurrentPermissions(currentPermissions.filter(p => p !== perm));
    } else {
      setCurrentPermissions([...currentPermissions, perm]);
    }
  };

  return (
    <div className="space-y-6">
      <Notification type={notification.type} message={notification.message} onClose={() => setNotification({type:'', message:''})} />

      {/* Header con Botón Atrás */}
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
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <ShieldCheckIcon className="h-5 w-5 text-blue-600"/> Permisos Asignados
                </h3>
                
                {/* Botones de Edición (Ocultos para 'admin' si quieres protegerlo) */}
                {roleName !== 'admin' && (
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

            {/* Área de Badges/Botones */}
            <div className="flex flex-wrap gap-2">
                {isEditing ? (
                    // MODO EDICIÓN: Muestra TODOS los permisos del sistema para activar/desactivar
                    allPermissions.map(perm => {
                        const isActive = currentPermissions.includes(perm);
                        return (
                            <button 
                                key={perm}
                                onClick={() => togglePermission(perm)}
                                className={`px-3 py-1.5 rounded-md text-sm border transition-all flex items-center gap-2 ${
                                    isActive 
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                                    : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                                }`}
                            >
                                {isActive ? <CheckCircleIcon className="h-4 w-4"/> : <div className="h-4 w-4 rounded-full border border-gray-400"></div>}
                                {perm}
                            </button>
                        );
                    })
                ) : (
                    // MODO VISUALIZACIÓN: Solo muestra los activos
                    currentPermissions.length > 0 ? (
                        currentPermissions.map((perm, idx) => (
                            <span key={idx} className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 flex items-center gap-1">
                                <CheckCircleIcon className="h-3 w-3"/> {perm}
                            </span>
                        ))
                    ) : (
                        <div className="p-6 text-center border-2 border-dashed border-gray-200 rounded-lg w-full">
                            <p className="text-gray-400 italic">No hay permisos configurados para este rol.</p>
                        </div>
                    )
                )}
            </div>
        </div>

        {/* COLUMNA DER: USUARIOS DEPENDIENTES */}
        <div className="lg:col-span-1 bg-white p-4 rounded-lg shadow border border-gray-200 h-fit">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-gray-500"/> Usuarios
            </h3>
            <div className="overflow-y-auto max-h-[500px] pr-2">
                {users.length > 0 ? (
                    <ul className="divide-y divide-gray-100">
                        {users.map(u => (
                            <li key={u.ID} className="py-3 flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs border">
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