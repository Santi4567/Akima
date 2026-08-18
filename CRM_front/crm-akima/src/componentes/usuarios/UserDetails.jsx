import { useState } from 'react';
import { ArrowLeftIcon, PencilIcon, TrashIcon, UserCircleIcon, PhoneIcon, MapPinIcon, AtSymbolIcon } from '@heroicons/react/24/solid';
import { HasPermission } from '../HasPermission';
import { Notification } from '../Notification';

const API_URL = import.meta.env.VITE_API_URL;

export const UserDetails = ({ user, onClose, onEdit, onDeleteSuccess }) => {
  const [notification, setNotification] = useState({ type: '', message: '' });

  if (!user) return null;

  const handleDelete = async () => {
    if (!window.confirm(`¿Estás seguro de eliminar el acceso de ${user.Nombre}? Esta acción es irreversible.`)) return;
    try {
      const res = await fetch(`${API_URL}/api/users/${user.ID}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();

      if (data.success) {
        setNotification({ type: 'success', message: 'Usuario eliminado del sistema.' });
        setTimeout(() => { if (onDeleteSuccess) onDeleteSuccess(); else onClose(); }, 1500);
      } else setNotification({ type: 'error', message: data.message || 'Error al eliminar.' });
    } catch (error) {
      setNotification({ type: 'error', message: 'Error de conexión con el servidor.' });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
        <Notification type={notification.type} message={notification.message} onClose={() => setNotification({ type: '', message: '' })} />

        <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
            <button onClick={onClose} className="p-2.5 text-slate-500 bg-white border border-slate-300 hover:bg-slate-50 hover:text-slate-800 hover:border-slate-400 rounded-xl transition-all shadow-sm">
                <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Ficha Técnica</h1>
        </div>

        <div className="bg-white/90 backdrop-blur-xl shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-200 overflow-hidden">
            
            {/* Header / Banner de Perfil */}
            <div className="bg-slate-50 border-b border-slate-200 p-8 flex flex-col md:flex-row justify-between items-center md:items-start gap-6 relative overflow-hidden">
                {/* Decoración de fondo */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>

                <div className="flex flex-col md:flex-row items-center md:items-center gap-6 z-10 text-center md:text-left">
                    <div className="h-24 w-24 rounded-3xl bg-white flex items-center justify-center text-blue-600 font-black text-4xl border-2 border-blue-100 shadow-md">
                        {user.Nombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900">{user.Nombre}</h2>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-2">
                            <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-extrabold bg-blue-100 text-blue-800 border border-blue-200 capitalize">
                                Rol: {user.rol}
                            </span>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold border ${user.Estado === 1 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300'}`}>
                                <svg className={`mr-1.5 h-2 w-2 ${user.Estado === 1 ? 'text-emerald-500' : 'text-rose-500'}`} fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" /></svg>
                                {user.Estado === 1 ? 'Acceso Permitido' : 'Acceso Denegado'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Body */}
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex items-start gap-4">
                    <div className="p-2.5 bg-slate-100 text-slate-400 rounded-xl"><AtSymbolIcon className="h-5 w-5"/></div>
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Correo Electrónico</p>
                        <p className="text-sm font-bold text-slate-800">{user.Correo}</p>
                    </div>
                </div>
                <div className="flex items-start gap-4">
                    <div className="p-2.5 bg-slate-100 text-slate-400 rounded-xl"><PhoneIcon className="h-5 w-5"/></div>
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Teléfono</p>
                        <p className="text-sm font-bold text-slate-800">{user.phone || <span className="text-slate-400 italic">No registrado</span>}</p>
                    </div>
                </div>
                <div className="flex items-start gap-4">
                    <div className="p-2.5 bg-slate-100 text-slate-400 rounded-xl"><UserCircleIcon className="h-5 w-5"/></div>
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Género Registrado</p>
                        <p className="text-sm font-bold text-slate-800">{user.sex === 'M' ? 'Masculino' : 'Femenino'}</p>
                    </div>
                </div>
                <div className="flex items-start gap-4 md:col-span-2 border-t border-slate-100 pt-6 mt-2">
                    <div className="p-2.5 bg-slate-100 text-slate-400 rounded-xl"><MapPinIcon className="h-5 w-5"/></div>
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Dirección Física</p>
                        <p className="text-sm font-bold text-slate-800 leading-relaxed max-w-lg">{user.address || <span className="text-slate-400 italic">Sin dirección en el sistema</span>}</p>
                    </div>
                </div>
            </div>

            {/* Actions Footer */}
            <div className="p-6 bg-slate-50/80 border-t border-slate-200 flex flex-wrap justify-end gap-4">
                <HasPermission required="edit.users">
                    <button onClick={() => onEdit(user)} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-extrabold transition-all border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 hover:border-amber-400 shadow-sm">
                        <PencilIcon className="h-4 w-4" /> Modificar Datos
                    </button>
                </HasPermission>
                
                <HasPermission required="delete.users">
                    <button onClick={handleDelete} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-extrabold transition-all border border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100 hover:border-rose-400 shadow-sm">
                        <TrashIcon className="h-4 w-4" /> Dar de Baja
                    </button>
                </HasPermission>
            </div>
        </div>
    </div>
  );
};