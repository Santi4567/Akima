import { useState, useEffect, useCallback } from 'react';
import { 
  PlusIcon, MagnifyingGlassIcon, FunnelIcon, UserIcon, ArrowPathIcon, UsersIcon
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
  
  const [statusFilter, setStatusFilter] = useState('all'); 
  const [roleFilter, setRoleFilter] = useState('all');
  const [availableRoles, setAvailableRoles] = useState([]); 

  const [notification, setNotification] = useState({ type: '', message: '' });
  const { hasAnyPermission } = useAuth();

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/users`, { credentials: 'include' });
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.data);
        setFilteredUsers(data.data);
        const roles = [...new Set(data.data.map(u => u.rol))];
        setAvailableRoles(roles);
      } else throw new Error(data.message);
    } catch (error) {
      setNotification({ type: 'error', message: error.message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSearch = async (query) => {
    if (!query) {
        fetchUsers();
        return;
    }
    setIsLoading(true);
    try {
        const response = await fetch(`${API_URL}/api/users/search?q=${query}`, { credentials: 'include' });
        const data = await response.json();
        if (data.success) setUsers(data.data);
    } catch (error) {
        console.error(error);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hasAnyPermission(PERMISSIONS.USERS)) fetchUsers();
    else setIsLoading(false);
  }, [fetchUsers, hasAnyPermission]);

  useEffect(() => {
    const timer = setTimeout(() => {
        if (searchTerm) handleSearch(searchTerm);
        else fetchUsers(); 
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    let result = users;
    if (statusFilter !== 'all') {
        const isActive = statusFilter === 'active';
        result = result.filter(u => (u.Estado === 1) === isActive);
    }
    if (roleFilter !== 'all') {
        result = result.filter(u => u.rol === roleFilter);
    }
    setFilteredUsers(result);
  }, [users, statusFilter, roleFilter]);

  return (
    <div className="space-y-6 pb-10">
      <Notification type={notification.type} message={notification.message} onClose={() => setNotification({type:'', message:''})} />

      {/* Cabecera Azul */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
        <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl border border-blue-200 shadow-sm">
                    <UsersIcon className="h-7 w-7 text-blue-600" />
                </div>
                Directorio de Usuarios
            </h1>
            <p className="text-sm text-slate-500 mt-2 font-medium">Administra los accesos y cuentas del equipo de trabajo</p>
        </div>
        <HasPermission required="add.users">
          <button onClick={onCreateNew} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:-translate-y-0.5 transition-all active:translate-y-0">
            <PlusIcon className="h-5 w-5" /> Nuevo Usuario
          </button>
        </HasPermission>
      </div>

      {/* Barra de Herramientas: Buscador y Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white/80 backdrop-blur-sm p-5 rounded-3xl border border-slate-200 shadow-sm">
        <div className="md:col-span-2 relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
            </div>
            <input
                type="search" placeholder="Buscar por nombre..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2.5 pl-11 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all outline-none"
            />
        </div>
        <div className="relative">
            <FunnelIcon className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <select 
                value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2.5 pl-10 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all outline-none appearance-none"
            >
                <option value="all">Todos los Estados</option>
                <option value="active">Solo Activos</option>
                <option value="inactive">Solo Inactivos</option>
            </select>
        </div>
        <div className="relative">
            <UserIcon className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <select 
                value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full p-2.5 pl-10 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all outline-none appearance-none capitalize"
            >
                <option value="all">Todos los Roles</option>
                {availableRoles.map(role => (
                    <option key={role} value={role}>{role}</option>
                ))}
            </select>
        </div>
      </div>

      {/* Tabla Premium Glassmorphism */}
      <div className="bg-white/90 backdrop-blur-xl shadow-xl shadow-slate-200/40 rounded-3xl border border-slate-200 overflow-hidden">
        <div className="overflow-y-auto max-h-[60vh]">
          <table className="min-w-full text-left border-collapse">
            <thead className="bg-slate-50/90 backdrop-blur-md sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Colaborador</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Rol del Sistema</th>
                <th className="px-6 py-4 text-center text-xs font-black text-slate-500 uppercase tracking-widest">Estado</th>
                <th className="px-6 py-4 text-right text-xs font-black text-slate-500 uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan="4" className="p-16 text-center text-slate-400 font-medium"><ArrowPathIcon className="h-8 w-8 animate-spin mx-auto mb-3 text-blue-500" />Cargando usuarios...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan="4" className="p-16 text-center text-slate-400 font-bold text-lg">No se encontraron usuarios.</td></tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.ID} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                            <div className="h-11 w-11 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 font-black border border-blue-200 shadow-sm group-hover:scale-105 transition-transform">
                                {user.Nombre.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="text-sm font-extrabold text-slate-900">{user.Nombre}</div>
                                <div className="text-xs font-medium text-slate-500 mt-0.5">{user.Correo}</div>
                            </div>
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                            {user.rol}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold border ${
                          user.Estado === 1 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300'
                        }`}>
                            <svg className={`mr-1.5 h-2 w-2 ${user.Estado === 1 ? 'text-emerald-500' : 'text-rose-500'}`} fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" /></svg>
                          {user.Estado === 1 ? 'Activo' : 'Inactivo'}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button 
                        onClick={() => onViewDetails(user)}
                        className="text-blue-600 hover:text-blue-800 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 px-3 py-1.5 rounded-lg flex items-center justify-center gap-2 ml-auto text-xs font-bold transition-all shadow-sm"
                      >
                        <UserIcon className="h-3.5 w-3.5" /> Ficha Técnica
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};