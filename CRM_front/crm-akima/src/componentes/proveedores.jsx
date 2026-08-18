// src/componentes/proveedores.jsx

import { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeftIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  BuildingStorefrontIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon
} from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext.jsx';
import { HasPermission } from './HasPermission.jsx';
import { Notification } from './Notification.jsx';

const API_URL = import.meta.env.VITE_API_URL;
const API_ENDPOINT = `${API_URL}/api/suppliers`;

export const Proveedores = () => {
  const [view, setView] = useState('list'); 
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState({ type: '', message: '' });

  const [suppliers, setSuppliers] = useState([]); 
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [editingSupplier, setEditingSupplier] = useState(null);
  const { hasPermission } = useAuth();
  
  const fetchSuppliers = useCallback(async () => {
    setIsLoading(true);
    setSelectedSupplier(null);
    try {
      const response = await fetch(API_ENDPOINT, { credentials: 'include' });
      const data = await response.json();
      if (data.success) setSuppliers(data.data);
      else throw new Error(data.message || 'Error al cargar proveedores');
    } catch (error) {
      setNotification({ type: 'error', message: error.message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasPermission('view.suppliers')) fetchSuppliers();
    else {
      setIsLoading(false);
      setNotification({ type: 'error', message: 'No tienes permisos.' });
    }
  }, [fetchSuppliers, hasPermission]);

  const handleSearch = async () => {
    if (!searchTerm) return fetchSuppliers();
    setIsLoading(true);
    setSelectedSupplier(null);
    try {
      const response = await fetch(`${API_ENDPOINT}/search?q=${searchTerm}`, { credentials: 'include' });
      const data = await response.json();
      if (data.success) setSuppliers(data.data);
      else throw new Error(data.message);
    } catch (error) {
      setNotification({ type: 'error', message: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSupplier) return;
    if (window.confirm(`¿Eliminar al proveedor "${selectedSupplier.name}"?`)) {
      try {
        const response = await fetch(`${API_ENDPOINT}/${selectedSupplier.id}`, {
          method: 'DELETE', credentials: 'include',
        });
        const data = await response.json();
        if (data.success) {
          setNotification({ type: 'success', message: data.message });
          setSelectedSupplier(null); 
          fetchSuppliers(); 
        } else throw new Error(data.message);
      } catch (error) {
        setNotification({ type: 'error', message: error.message });
      }
    }
  };

  const showListView = () => {
    setView('list');
    setEditingSupplier(null); 
    setNotification({ type: '', message: '' }); 
  };

  const showFormView = (supplierToEdit = null) => {
    setEditingSupplier(supplierToEdit);
    setView('form');
    setNotification({ type: '', message: '' });
  };
  
  if (view === 'form') {
    return (
      <SupplierForm
        initialData={editingSupplier}
        onClose={showListView} 
        onSuccess={() => {
          showListView();
          fetchSuppliers();
          setNotification({ type: 'success', message: 'Proveedor guardado exitosamente.' });
        }}
        onError={(message) => setNotification({ type: 'error', message: message })}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Notification type={notification.type} message={notification.message} onClose={() => setNotification({ type: '', message: '' })} />
      
      {/* Cabecera (Azul como protagonista) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
        <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl border border-blue-200">
                    <BuildingStorefrontIcon className="h-7 w-7 text-blue-600" />
                </div>
                Gestión de Proveedores
            </h1>
            <p className="text-sm text-slate-500 mt-2 font-medium">Directorio de distribuidores y socios comerciales</p>
        </div>
        <HasPermission required="add.suppliers">
          <button onClick={() => showFormView(null)} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:shadow-blue-600/40 hover:-translate-y-0.5 transition-all active:translate-y-0">
            <PlusIcon className="h-5 w-5" /> Nuevo Proveedor
          </button>
        </HasPermission>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* Buscador (Anillo Azul) */}
        <HasPermission required="view.suppliers">
            <div className="relative w-full md:max-w-md">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
                </div>
                <input
                    type="search" placeholder="Buscar empresa, contacto o email..." value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full p-3 pl-11 bg-white/80 backdrop-blur-sm border border-slate-300 text-slate-900 placeholder-slate-400 rounded-xl shadow-sm text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all outline-none"
                />
            </div>
        </HasPermission>

        {/* Acciones Secundarias */}
        <div className="flex gap-3 flex-wrap">
            <HasPermission required="edit.suppliers">
            <button disabled={!selectedSupplier} onClick={() => showFormView(selectedSupplier)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 hover:border-amber-400 disabled:opacity-50 disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400 shadow-sm">
                <PencilIcon className="h-4 w-4" /> Editar
            </button>
            </HasPermission>
            <HasPermission required="delete.suppliers">
            <button disabled={!selectedSupplier} onClick={handleDelete} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100 hover:border-rose-400 disabled:opacity-50 disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400 shadow-sm">
                <TrashIcon className="h-4 w-4" /> Eliminar
            </button>
            </HasPermission>
        </div>
      </div>

      {/* Tabla Premium (Azul para selección, Esmeralda para estado) */}
      <HasPermission required="view.suppliers">
        <div className="bg-white/90 backdrop-blur-xl shadow-xl shadow-slate-200/40 rounded-3xl border border-slate-200 overflow-hidden">
          <div className="overflow-y-auto max-h-[60vh]">
            <table className="min-w-full text-left border-collapse">
              <thead className="bg-slate-50/90 backdrop-blur-md sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Proveedor</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Contacto</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Términos Comerciales</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr><td colSpan="4" className="p-16 text-center text-slate-400 font-medium"><ArrowPathIcon className="h-8 w-8 animate-spin mx-auto mb-3 text-blue-500" />Cargando...</td></tr>
                ) : suppliers.length === 0 ? (
                  <tr><td colSpan="4" className="p-16 text-center text-slate-400 font-bold text-lg">No se encontraron proveedores.</td></tr>
                ) : (
                  suppliers.map((sup) => (
                    <tr
                      key={sup.id}
                      onClick={() => setSelectedSupplier(sup)}
                      className={`cursor-pointer group transition-all duration-200 border-l-4 ${
                          selectedSupplier?.id === sup.id 
                          ? 'bg-blue-50/80 border-blue-500' // <-- ACENTO AZUL AL SELECCIONAR
                          : 'border-transparent hover:bg-slate-50'
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-colors ${
                                selectedSupplier?.id === sup.id 
                                ? 'bg-white border-blue-300 text-blue-600 shadow-sm' 
                                : 'bg-slate-100 border-slate-200 text-slate-400 group-hover:border-blue-200 group-hover:text-blue-500'
                            }`}>
                                <BuildingStorefrontIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <div className="font-extrabold text-slate-900 text-sm">{sup.name}</div>
                                <div className="text-xs font-bold text-slate-500 mt-0.5">{sup.address || 'Sin dirección'}</div>
                            </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                         <div className="text-sm font-bold text-slate-800">{sup.contact_name || 'Sin contacto'}</div>
                         <div className="text-xs font-medium text-slate-500 mt-0.5">{sup.email} • {sup.phone || '-'}</div>
                      </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {sup.payment_terms || 'No definido'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {/* El ESMERALDA brilla aquí para indicar éxito/actividad */}
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold border ${
                          sup.status === 'activo' || sup.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                          : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}>
                           <svg className={`mr-1.5 h-2 w-2 ${(sup.status === 'activo' || sup.status === 'active') ? 'text-emerald-500' : 'text-slate-400'}`} fill="currentColor" viewBox="0 0 8 8">
                              <circle cx="4" cy="4" r="3" />
                          </svg>
                          <span className="capitalize">{sup.status}</span>
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

// --- Sub-componente Formulario Proveedor ---
const SupplierForm = ({ initialData, onClose, onSuccess, onError }) => {
  const [formData, setFormData] = useState({
    name: '', contact_name: '', email: '', phone: '',
    address: '', payment_terms: '', status: 'activo'
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!initialData;
  const formTitle = isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor';

  useEffect(() => {
    if (isEditing) {
      setFormData({
        name: initialData.name || '', contact_name: initialData.contact_name || '',
        email: initialData.email || '', phone: initialData.phone || '',
        address: initialData.address || '', payment_terms: initialData.payment_terms || '',
        status: initialData.status || 'activo',
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
    if (!formData.name) errors.name = 'La empresa es obligatoria';
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
    return `mt-1.5 block w-full p-3 bg-slate-50 border rounded-xl text-sm font-medium transition-all outline-none ${
      formErrors[fieldName]
      ? 'border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500'
      : 'border-slate-300 focus:bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500'
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

      <form onSubmit={handleSubmit} className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Empresa Proveedora <span className="text-rose-500">*</span></label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} className={getInputClasses('name')} />
            {formErrors.name && <p className="mt-1.5 text-xs font-bold text-rose-500">{formErrors.name}</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre del Contacto</label>
            <input type="text" name="contact_name" value={formData.contact_name} onChange={handleChange} className={getInputClasses('contact_name')} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className={getInputClasses('email')} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Teléfono</label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={getInputClasses('phone')} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Términos de Pago</label>
            <input type="text" name="payment_terms" placeholder="Ej. Crédito 30 días" value={formData.payment_terms} onChange={handleChange} className={getInputClasses('payment_terms')} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</label>
            <select name="status" value={formData.status} onChange={handleChange} className={`${getInputClasses('status')} bg-slate-50`}>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
        </div>

        <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Dirección Física</label>
            <textarea name="address" rows="3" value={formData.address} onChange={handleChange} className={getInputClasses('address')}></textarea>
        </div>

        <div className="text-right pt-6 border-t border-slate-100">
          <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-500 hover:-translate-y-0.5 disabled:translate-y-0 disabled:bg-slate-300 disabled:shadow-none transition-all">
            {isSubmitting ? 'Guardando...' : (isEditing ? 'Actualizar Proveedor' : 'Crear Proveedor')}
          </button>
        </div>
      </form>
    </div>
  );
};