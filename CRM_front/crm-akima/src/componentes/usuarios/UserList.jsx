import { useState, useEffect, useCallback } from 'react';
import { 
  PlusIcon, MagnifyingGlassIcon, FunnelIcon, UserIcon 
} from '@heroicons/react/24/solid';
import { useAuth } from '../../context/AuthContext';
import { HasPermission } from '../HasPermission';
import { Notification } from '../Notification';
import { PERMISSIONS } from '../../config/permissions';

const API_URL = import.meta.env.VITE_API_URL;

export const UserList = ({ onViewDetails, onCreateNew }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filtros
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [roleFilter, setRoleFilter] = useState('all');
  const [availableRoles, setAvailableRoles] = useState([]); // Roles dinámicos

  const [notification, setNotification] = useState({ type: '', message: '' });
  const { hasAnyPermission } = useAuth();

  // Cargar Usuarios
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/users`, { credentials: 'include' });
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.data);
        setFilteredUsers(data.data);
        
        // Extraer roles únicos para el filtro dinámico
        const roles = [...new Set(data.data.map(u => u.rol))];
        setAvailableRoles(roles);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      setNotification({ type: 'error', message: error.message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Buscar (Server-side search si hay query, sino filtrado local)
  const handleSearch = async (query) => {
    if (!query) {
        fetchUsers();
        return;
    }
    setIsLoading(true);
    try {
        const response = await fetch(`${API_URL}/api/users/search?q=${query}`, { credentials: 'include' });
        const data = await response.json();
        if (data.success) {
            setUsers(data.data); // Actualizamos la base
        }
    } catch (error) {
        console.error(error);
    } finally {
        setIsLoading(false);
    }
  };

  // Efecto de carga inicial
  useEffect(() => {
    if (hasAnyPermission(PERMISSIONS.USERS)) {
      fetchUsers();
    } else {
      setIsLoading(false);
    }
  }, [fetchUsers, hasAnyPermission]);

  // Efecto de Debounce para Buscador
  useEffect(() => {
    const timer = setTimeout(() => {
        if (searchTerm) handleSearch(searchTerm);
        else fetchUsers(); // Reset si limpia
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Efecto para aplicar Filtros (Local)
  useEffect(() => {
    let result = users;

    // 1. Filtro Estado
    if (statusFilter !== 'all') {
        const isActive = statusFilter === 'active';
        // Nota: Tu API devuelve Estado: 1 (true) o 0 (false)
        result = result.filter(u => (u.Estado === 1) === isActive);
    }

    // 2. Filtro Rol
    if (roleFilter !== 'all') {
        result = result.filter(u => u.rol === roleFilter);
    }

    setFilteredUsers(result);
  }, [users, statusFilter, roleFilter]);


  return (
    <div className="space-y-6">
      <Notification type={notification.type} message={notification.message} onClose={() => setNotification({type:'', message:''})} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-2 border-b">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
        <HasPermission required="add.users">
          <button onClick={onCreateNew} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-700">
            <PlusIcon className="h-5 w-5" /> Nuevo Usuario
          </button>
        </HasPermission>
      </div>

      {/* Barra de Herramientas: Buscador y Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg border">
        
        {/* Buscador */}
        <div className="md:col-span-2 relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
                type="search"
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:ring-green-500"
            />
        </div>

        {/* Filtro Estado */}
        <div>
            <select 
                className="w-full p-2 border border-gray-300 rounded-md"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
            >
                <option value="all">Todos los Estados</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
            </select>
        </div>

        {/* Filtro Rol (Dinámico) */}
        <div>
            <select 
                className="w-full p-2 border border-gray-300 rounded-md"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
            >
                <option value="all">Todos los Roles</option>
                {availableRoles.map(role => (
                    <option key={role} value={role}>{role}</option>
                ))}
            </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white shadow-xl rounded-lg overflow-hidden border border-gray-200">
        <div className="overflow-y-auto h-[60vh]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Rol</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan="4" className="p-6 text-center text-gray-500">Cargando usuarios...</td></tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.ID} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold mr-3">
                                {user.Nombre.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-900">{user.Nombre}</div>
                                <div className="text-xs text-gray-500">{user.Correo}</div>
                            </div>
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {user.rol}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.Estado === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.Estado === 1 ? 'Activo' : 'Inactivo'}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => onViewDetails(user)}
                        className="text-blue-600 hover:text-blue-900 flex items-center justify-end gap-1 ml-auto"
                      >
                        <UserIcon className="h-4 w-4" /> Detalles
                      </button>
                    </td>
                  </tr>
                ))
              )}
              {!isLoading && filteredUsers.length === 0 && (
                  <tr><td colSpan="4" className="p-6 text-center text-gray-500">No se encontraron usuarios.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};