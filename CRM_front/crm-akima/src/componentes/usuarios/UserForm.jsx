import { useState, useEffect } from 'react';
import { ArrowLeftIcon, KeyIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { Notification } from '../Notification';

const API_URL = import.meta.env.VITE_API_URL;

export const UserForm = ({ initialData, onClose, onSuccess }) => {
  const isEditing = !!initialData;
  const [formData, setFormData] = useState({
    Nombre: '', Correo: '', Passwd: '', rol: '', Estado: true, phone: '', address: '', sex: 'M'
  });
  const [showPasswordInput, setShowPasswordInput] = useState(!isEditing);
  const [roles, setRoles] = useState([]); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await fetch(`${API_URL}/api/users/roles-list`, { method: 'GET', credentials: 'include' });
        const data = await res.json();
        if (data.success) setRoles(data.data); 
        else setRoles(['admin', 'gerente', 'vendedor']); 
      } catch (error) {
        console.error("Error de red al cargar roles");
      }
    };
    fetchRoles();
  }, []);

  useEffect(() => {
    if (isEditing) {
      setFormData({
        Nombre: initialData.Nombre || '', Correo: initialData.Correo || '', Passwd: '', 
        rol: initialData.rol || '', Estado: initialData.Estado === 1 || initialData.Estado === true,
        phone: initialData.phone || '', address: initialData.address || '', sex: initialData.sex || 'M'
      });
      setShowPasswordInput(false);
    }
  }, [initialData, isEditing]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setNotification({ type: '', message: '' });

    const payload = { ...formData };
    if (isEditing && (!showPasswordInput || !payload.Passwd)) delete payload.Passwd;

    const url = isEditing ? `${API_URL}/api/users/${initialData.ID}` : `${API_URL}/api/users`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method, headers: { 'Content-Type': 'application/json' },
            credentials: 'include', body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
            setNotification({ type: 'success', message: data.message });
            setTimeout(() => onSuccess(), 1500);
        } else setNotification({ type: 'error', message: data.message || data.error });
    } catch (error) {
        setNotification({ type: 'error', message: 'Error de conexión' });
    } finally {
        setIsSubmitting(false);
    }
  };

  const inputClass = "w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all outline-none";

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <Notification type={notification.type} message={notification.message} onClose={() => setNotification({type:'', message:''})} />
      
      <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
        <button onClick={onClose} className="p-2.5 text-slate-500 bg-white border border-slate-300 hover:bg-slate-50 hover:text-slate-800 hover:border-slate-400 rounded-xl transition-all shadow-sm">
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{isEditing ? 'Editar Colaborador' : 'Nuevo Colaborador'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre Completo <span className="text-rose-500">*</span></label>
                <input type="text" name="Nombre" required value={formData.Nombre} onChange={handleChange} className={inputClass} />
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Correo Electrónico <span className="text-rose-500">*</span></label>
                <input type="email" name="Correo" required disabled={isEditing} value={formData.Correo} onChange={handleChange} className={`${inputClass} disabled:opacity-60 disabled:cursor-not-allowed`} />
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Contraseña {showPasswordInput && <span className="text-rose-500">*</span>}</label>
                {!showPasswordInput ? (
                    <button type="button" onClick={() => { setShowPasswordInput(true); setFormData(prev => ({...prev, Passwd: ''})); }} className="w-full flex items-center justify-center gap-2 p-3 border border-slate-300 shadow-sm text-sm font-bold rounded-xl text-slate-700 bg-white hover:bg-slate-50 transition-colors">
                        <KeyIcon className="h-4 w-4 text-slate-500" /> Cambiar contraseña
                    </button>
                ) : (
                    <div className="relative">
                        <input type="password" name="Passwd" required={showPasswordInput} value={formData.Passwd} onChange={handleChange} placeholder={isEditing ? "Escribe la nueva contraseña" : "Crea una contraseña segura"} className={`${inputClass} pr-10`} />
                        {isEditing && (
                            <button type="button" onClick={() => { setShowPasswordInput(false); setFormData(prev => ({...prev, Passwd: ''})); }} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors">
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Rol del Sistema <span className="text-rose-500">*</span></label>
                <select name="rol" required value={formData.rol} onChange={handleChange} className={`${inputClass} capitalize`}>
                    <option value="">-- Asignar Rol --</option>
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Teléfono</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={inputClass} placeholder="Ej: 555-123-4567" />
            </div>

            <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Dirección Física</label>
                <input type="text" name="address" value={formData.address} onChange={handleChange} className={inputClass} placeholder="Domicilio completo" />
            </div>

            <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex-1 w-full">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sexo</label>
                    <select name="sex" value={formData.sex} onChange={handleChange} className={`${inputClass} py-2`}>
                        <option value="M">Masculino</option>
                        <option value="F">Femenino</option>
                    </select>
                </div>
                <div className="flex-1 w-full flex items-center pt-2 sm:pt-6">
                    <label className="inline-flex items-center cursor-pointer group">
                        <input type="checkbox" name="Estado" checked={formData.Estado === true} onChange={handleChange} className="form-checkbox h-5 w-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 transition-all" />
                        <span className="ml-3 text-sm font-extrabold text-slate-700 group-hover:text-blue-700 transition-colors">Cuenta Activa en el Sistema</span>
                    </label>
                </div>
            </div>
        </div>

        <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
            <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-500 hover:-translate-y-0.5 disabled:translate-y-0 disabled:bg-slate-300 disabled:shadow-none transition-all">
                {isSubmitting ? 'Procesando...' : (isEditing ? 'Actualizar Colaborador' : 'Crear Colaborador')}
            </button>
        </div>
      </form>
    </div>
  );
};