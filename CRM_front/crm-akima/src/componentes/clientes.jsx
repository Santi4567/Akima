// src/componentes/clientes.jsx

import { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeftIcon, 
  UserPlusIcon, 
  PencilIcon, 
  TrashIcon, 
  UsersIcon, 
  MagnifyingGlassIcon,
  ArrowPathIcon,
  UserIcon
} from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext.jsx';
import { HasPermission } from './HasPermission.jsx';
import { Notification } from './Notification.jsx';

// Define la URL de la API
const API_URL = import.meta.env.VITE_API_URL;
const API_ENDPOINT = `${API_URL}/api/clients`;

export const Clientes = () => {
  const [view, setView] = useState('list'); 
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState({ type: '', message: '' });

  const [clients, setClients] = useState([]); 
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [editingClient, setEditingClient] = useState(null);

  const { hasPermission } = useAuth();
  
  // --- FUNCIONES DE API ---

  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    setSelectedClient(null); 
    try {
      const response = await fetch(API_ENDPOINT, { credentials: 'include' });
      if (!response.ok) throw new Error('Error al cargar clientes');
      const data = await response.json();
      
      if (data.success) {
        setClients(data.data);
      } else {
        throw new Error(data.message || 'Error en los datos recibidos');
      }
    } catch (error) {
      setNotification({ type: 'error', message: error.message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasPermission('view.clients')) {
      fetchClients();
    } else {
      setIsLoading(false);
      setNotification({ type: 'error', message: 'No tienes permisos para ver clientes.' });
    }
  }, [fetchClients, hasPermission]);

  const handleSearch = async () => {
    if (!searchTerm) {
      fetchClients(); 
      return;
    }
    
    setIsLoading(true);
    setSelectedClient(null);
    try {
      const response = await fetch(`${API_ENDPOINT}/search?q=${searchTerm}`, { credentials: 'include' });
      const data = await response.json();
      if (data.success) {
        setClients(data.data);
      } else {
        throw new Error(data.message || 'Error al buscar');
      }
    } catch (error) {
      setNotification({ type: 'error', message: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedClient) return;
    
    const clientName = `${selectedClient.first_name} ${selectedClient.last_name}`;
    if (window.confirm(`¿Estás seguro de que quieres eliminar a "${clientName}"?`)) {
      try {
        const response = await fetch(`${API_ENDPOINT}/${selectedClient.id}`, {
          method: 'DELETE', credentials: 'include',
        });
        const data = await response.json();

        if (data.success) {
          setNotification({ type: 'success', message: data.message });
          setSelectedClient(null); 
          fetchClients(); 
        } else {
          throw new Error(data.message || 'Error al eliminar');
        }
      } catch (error) {
        setNotification({ type: 'error', message: error.message });
      }
    }
  };

  const showListView = () => {
    setView('list');
    setEditingClient(null); 
    setNotification({ type: '', message: '' }); 
  };

  const showFormView = (clientToEdit = null) => {
    setEditingClient(clientToEdit);
    setView('form');
    setNotification({ type: '', message: '' });
  };
  
  // --- RENDERIZADO ---

  if (view === 'form') {
    return (
      <ClientForm
        initialData={editingClient}
        onClose={showListView} 
        onSuccess={() => {
          showListView();
          fetchClients();
          setNotification({ type: 'success', message: 'Cliente guardado exitosamente.' });
        }}
        onError={(message) => setNotification({ type: 'error', message: message })}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Notification
        type={notification.type}
        message={notification.message}
        onClose={() => setNotification({ type: '', message: '' })}
      />
      
      {/* Cabecera y Botón Crear */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
        <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                <UsersIcon className="h-8 w-8 text-slate-400" /> Gestión de Clientes
            </h1>
            <p className="text-sm text-slate-500 mt-1">Administra tu cartera de clientes y prospectos comerciales</p>
        </div>
        <HasPermission required="add.clients">
          <button onClick={() => showFormView(null)} className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-bold shadow-md shadow-emerald-500/30 hover:bg-emerald-700 hover:shadow-emerald-600/40 hover:-translate-y-0.5 transition-all active:translate-y-0">
            <UserPlusIcon className="h-5 w-5" /> Nuevo Cliente
          </button>
        </HasPermission>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* Buscador */}
        <HasPermission required="view.clients">
            <div className="relative w-full md:max-w-md">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
            </div>
            <input
                type="search" placeholder="Buscar por nombre, email, empresa..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full p-2.5 pl-10 bg-white/80 backdrop-blur-sm border border-slate-300 text-slate-900 placeholder-slate-400 rounded-xl shadow-sm text-sm font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
            />
            </div>
        </HasPermission>

        {/* Acciones Secundarias */}
        <div className="flex gap-3 flex-wrap">
            <HasPermission required="edit.clients">
            <button disabled={!selectedClient} onClick={() => showFormView(selectedClient)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 hover:border-amber-400 disabled:opacity-50 disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400 shadow-sm">
                <PencilIcon className="h-4 w-4" /> Editar
            </button>
            </HasPermission>
            <HasPermission required="delete.clients">
            <button disabled={!selectedClient} onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all border border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100 hover:border-rose-400 disabled:opacity-50 disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400 shadow-sm">
                <TrashIcon className="h-4 w-4" /> Eliminar
            </button>
            </HasPermission>
        </div>
      </div>

      {/* Tabla Premium SaaS con Efecto Cristal */}
      <HasPermission required="view.clients">
        <div className="bg-white/90 backdrop-blur-xl shadow-lg shadow-slate-200/50 rounded-3xl border border-slate-200 overflow-hidden">
          <div className="overflow-y-auto max-h-[60vh]">
            <table className="min-w-full text-left border-collapse">
              <thead className="bg-slate-50/90 backdrop-blur-md sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-widest">Cliente</th>
                  <th scope="col" className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-widest">Contacto</th>
                  <th scope="col" className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-widest">Empresa</th>
                  <th scope="col" className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-widest">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                      <td colSpan="4" className="p-16 text-center text-slate-400 font-medium">
                          <ArrowPathIcon className="h-8 w-8 animate-spin mx-auto mb-3 text-emerald-500" />
                          Cargando clientes...
                      </td>
                  </tr>
                ) : clients.length === 0 ? (
                  <tr>
                      <td colSpan="4" className="p-16 text-center text-slate-400 font-medium text-lg">
                          No se encontraron clientes.
                      </td>
                  </tr>
                ) : (
                  clients.map((client) => (
                    <tr
                      key={client.id}
                      onClick={() => setSelectedClient(client)}
                      className={`cursor-pointer group transition-all duration-200 border-l-4 ${
                          selectedClient?.id === client.id 
                          ? 'bg-emerald-50/60 border-emerald-500' 
                          : 'border-transparent hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                            {/* Avatar del Cliente */}
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors ${
                                selectedClient?.id === client.id 
                                ? 'bg-white border-emerald-200 text-emerald-600 shadow-sm' 
                                : 'bg-slate-100 border-slate-200 text-slate-400 group-hover:border-emerald-200 group-hover:text-emerald-500'
                            }`}>
                                <UserIcon className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="font-extrabold text-slate-900 text-sm">{client.first_name} {client.last_name}</div>
                            </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                         <div className="text-sm font-semibold text-slate-800">{client.email}</div>
                         <div className="text-xs font-medium text-slate-500 mt-0.5 tracking-wide">{client.phone || 'Sin teléfono'}</div>
                      </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-slate-700">{client.company_name || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold border ${
                          client.status === 'active' 
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                          : client.status === 'lead'
                          ? 'bg-sky-100 text-sky-800 border-sky-300'
                          : client.status === 'contacted'
                          ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                          : client.status === 'lost'
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}>
                          {/* Punto indicador de estado */}
                          <svg className={`mr-1.5 h-2 w-2 ${
                              client.status === 'active' ? 'text-emerald-600' : 
                              client.status === 'lead' ? 'text-sky-500' :
                              client.status === 'contacted' ? 'text-indigo-500' :
                              client.status === 'lost' ? 'text-rose-500' :
                              'text-slate-400'
                          }`} fill="currentColor" viewBox="0 0 8 8">
                              <circle cx="4" cy="4" r="3" />
                          </svg>
                          <span className="capitalize">{client.status}</span>
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </HasPermission>
    </div>
  );
};

// --- Sub-componente del Formulario ---
const ClientForm = ({ initialData, onClose, onSuccess, onError }) => {
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    company_name: '', status: 'lead', address: '', notes: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!initialData;
  const formTitle = isEditing ? 'Editar Cliente' : 'Agregar Nuevo Cliente';

  useEffect(() => {
    if (isEditing) {
      setFormData({
        first_name: initialData.first_name || '', last_name: initialData.last_name || '',
        email: initialData.email || '', phone: initialData.phone || '',
        company_name: initialData.company_name || '', status: initialData.status || 'lead',
        address: initialData.address || '', notes: initialData.notes || '',
      });
    }
  }, [initialData, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: null }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.first_name) errors.first_name = 'El nombre es obligatorio';
    if (!formData.last_name) errors.last_name = 'El apellido es obligatorio';
    if (!formData.email) errors.email = 'El email es obligatorio';
    if (!formData.company_name) errors.company_name = 'El nombre de la empresa es obligatorio';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    
    const url = isEditing ? `${API_ENDPOINT}/${initialData.id}` : API_ENDPOINT;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method, headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) onSuccess(data.message);
      else throw new Error(data.message || 'Error al guardar');
    } catch (error) {
      onError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getInputClasses = (fieldName) => {
    return `mt-1.5 block w-full p-2.5 bg-slate-50 border rounded-xl text-sm font-medium transition-all outline-none ${
      formErrors[fieldName]
      ? 'border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500'
      : 'border-slate-300 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
    }`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
        <button onClick={onClose} className="p-2.5 text-slate-500 bg-white border border-slate-300 hover:bg-slate-50 hover:text-slate-800 hover:border-slate-400 rounded-xl transition-all shadow-sm">
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{formTitle}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-lg border border-slate-200 space-y-6">
        
        {/* Fila 1: Nombre y Apellido */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="first_name" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre <span className="text-rose-500">*</span></label>
            <input type="text" id="first_name" name="first_name" value={formData.first_name} onChange={handleChange} className={getInputClasses('first_name')} />
            {formErrors.first_name && <p className="mt-1.5 text-xs font-bold text-rose-500">{formErrors.first_name}</p>}
          </div>
          <div>
            <label htmlFor="last_name" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Apellido <span className="text-rose-500">*</span></label>
            <input type="text" id="last_name" name="last_name" value={formData.last_name} onChange={handleChange} className={getInputClasses('last_name')} />
            {formErrors.last_name && <p className="mt-1.5 text-xs font-bold text-rose-500">{formErrors.last_name}</p>}
          </div>
        </div>

        {/* Fila 2: Email y Teléfono */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="email" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Email <span className="text-rose-500">*</span></label>
            <input type="email" id="email" name="email" placeholder="ejemplo@correo.com" value={formData.email} onChange={handleChange} className={getInputClasses('email')} />
            {formErrors.email && <p className="mt-1.5 text-xs font-bold text-rose-500">{formErrors.email}</p>}
          </div>
          <div>
            <label htmlFor="phone" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Teléfono</label>
            <input type="tel" id="phone" name="phone" placeholder="Ej: 222-333-4445" value={formData.phone} onChange={handleChange} className={getInputClasses('phone')} />
          </div>
        </div>

        {/* Fila 3: Empresa y Estado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="company_name" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Empresa <span className="text-rose-500">*</span></label>
            <input type="text" id="company_name" name="company_name" value={formData.company_name} onChange={handleChange} className={getInputClasses('company_name')} />
            {formErrors.company_name && <p className="mt-1.5 text-xs font-bold text-rose-500">{formErrors.company_name}</p>}
          </div>
          <div>
            <label htmlFor="status" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</label>
            <select id="status" name="status" value={formData.status} onChange={handleChange} className={`${getInputClasses('status')} bg-slate-50`}>
              <option value="lead">Lead / Prospecto</option>
              <option value="contacted">Contactado</option>
              <option value="active">Cliente Activo</option>
              <option value="inactive">Inactivo</option>
              <option value="lost">Perdido</option>
            </select>
          </div>
        </div>

        {/* Fila 4: Dirección y Notas */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="address" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Dirección</label>
            <textarea id="address" name="address" rows="3" value={formData.address} onChange={handleChange} className={getInputClasses('address')}></textarea>
          </div>
           <div>
            <label htmlFor="notes" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Notas Internas</label>
            <textarea id="notes" name="notes" rows="3" value={formData.notes} onChange={handleChange} className={getInputClasses('notes')}></textarea>
          </div>
        </div>

        {/* Botón de Guardar */}
        <div className="text-right pt-6 border-t border-slate-100">
          <button type="submit" disabled={isSubmitting} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/30 hover:bg-emerald-500 hover:-translate-y-0.5 disabled:translate-y-0 disabled:bg-slate-300 disabled:shadow-none transition-all">
            {isSubmitting ? 'Guardando...' : (isEditing ? 'Actualizar Cliente' : 'Crear Cliente')}
          </button>
        </div>
      </form>
    </div>
  );
};