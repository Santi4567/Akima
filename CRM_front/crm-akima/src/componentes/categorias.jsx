// src/componentes/categorias.jsx

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  TagIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon
} from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext.jsx';
import { HasPermission } from './HasPermission.jsx';
import { Notification } from './Notification.jsx';
import { ProductHubNav } from './productos/ProductHubNav';

const API_URL = import.meta.env.VITE_API_URL;
const API_ENDPOINT = `${API_URL}/api/categories`;

export const Categorias = () => {
  const [view, setView] = useState('list'); 
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState({ type: '', message: '' });

  const [allCategories, setAllCategories] = useState([]); 
  const [displayedCategories, setDisplayedCategories] = useState([]); 
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [editingCategory, setEditingCategory] = useState(null);
  const { hasPermission } = useAuth();
  
  const fetchAllCategories = useCallback(async () => {
    setIsLoading(true);
    setSelectedCategory(null);
    try {
      const response = await fetch(API_ENDPOINT, { credentials: 'include' });
      const data = await response.json();
      if (data.success) {
        setAllCategories(data.data);
        setDisplayedCategories(data.data);
      } else throw new Error(data.message);
    } catch (error) {
      setNotification({ type: 'error', message: error.message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasPermission('view.categories')) fetchAllCategories();
    else {
      setIsLoading(false);
      setNotification({ type: 'error', message: 'No tienes permisos.' });
    }
  }, [fetchAllCategories, hasPermission]);

  const handleSearch = () => {
    if (!searchTerm) {
      setDisplayedCategories(allCategories);
      return;
    }
    const lowerTerm = searchTerm.toLowerCase();
    const filtered = allCategories.filter(cat => 
      cat.name.toLowerCase().includes(lowerTerm) || 
      (cat.description && cat.description.toLowerCase().includes(lowerTerm))
    );
    setDisplayedCategories(filtered);
    setSelectedCategory(null);
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;
    if (window.confirm(`¿Eliminar la categoría "${selectedCategory.name}"?`)) {
      try {
        const response = await fetch(`${API_ENDPOINT}/${selectedCategory.id}`, {
          method: 'DELETE', credentials: 'include',
        });
        const data = await response.json();
        if (data.success) {
          setNotification({ type: 'success', message: data.message });
          setSelectedCategory(null); 
          fetchAllCategories(); 
        } else throw new Error(data.message);
      } catch (error) {
        setNotification({ type: 'error', message: error.message });
      }
    }
  };

  const showListView = () => {
    setView('list');
    setEditingCategory(null); 
    setNotification({ type: '', message: '' }); 
  };

  const showFormView = (categoryToEdit = null) => {
    setEditingCategory(categoryToEdit);
    setView('form');
    setNotification({ type: '', message: '' });
  };
  
  if (view === 'form') {
    return (
      <CategoryForm
        initialData={editingCategory}
        categories={allCategories}
        onClose={showListView} 
        onSuccess={() => {
          showListView();
          fetchAllCategories();
          setNotification({ type: 'success', message: 'Categoría guardada exitosamente.' });
        }}
        onError={(message) => setNotification({ type: 'error', message: message })}
      />
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <Notification type={notification.type} message={notification.message} onClose={() => setNotification({ type: '', message: '' })} />
      
      {/* Navegación tipo Hub (para no perder el contexto de productos) */}
      <ProductHubNav activeTab="categories" />

      {/* Cabecera Azul */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
        <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl border border-blue-200 shadow-sm">
                    <TagIcon className="h-7 w-7 text-blue-600" />
                </div>
                Clasificación
            </h1>
            <p className="text-sm text-slate-500 mt-2 font-medium">Organiza el inventario en familias y subcategorías</p>
        </div>
        <HasPermission required="add.categories">
          <button onClick={() => showFormView(null)} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:-translate-y-0.5 transition-all active:translate-y-0">
            <PlusIcon className="h-5 w-5" /> Nueva Categoría
          </button>
        </HasPermission>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* Buscador */}
        <HasPermission required="view.categories">
            <div className="relative w-full md:max-w-md">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
                </div>
                <input
                    type="search" placeholder="Buscar familia o etiqueta..." value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full p-3 pl-11 bg-white/80 backdrop-blur-sm border border-slate-300 text-slate-900 placeholder-slate-400 rounded-xl shadow-sm text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all outline-none"
                />
            </div>
        </HasPermission>

        {/* Acciones Secundarias */}
        <div className="flex gap-3 flex-wrap">
            <HasPermission required="edit.categories">
            <button disabled={!selectedCategory} onClick={() => showFormView(selectedCategory)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 hover:border-amber-400 disabled:opacity-50 disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400 shadow-sm">
                <PencilIcon className="h-4 w-4" /> Editar
            </button>
            </HasPermission>
            <HasPermission required="delete.categories">
            <button disabled={!selectedCategory} onClick={handleDelete} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100 hover:border-rose-400 disabled:opacity-50 disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400 shadow-sm">
                <TrashIcon className="h-4 w-4" /> Eliminar
            </button>
            </HasPermission>
        </div>
      </div>

      {/* Tabla Premium Glassmorphism con Acento Azul */}
      <HasPermission required="view.categories">
        <div className="bg-white/90 backdrop-blur-xl shadow-xl shadow-slate-200/40 rounded-3xl border border-slate-200 overflow-hidden">
          <div className="overflow-y-auto max-h-[60vh]">
            <table className="min-w-full text-left border-collapse">
              <thead className="bg-slate-50/90 backdrop-blur-md sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Familia / Categoría</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Descripción</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Dependencia (Padre)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr><td colSpan="3" className="p-16 text-center text-slate-400 font-medium"><ArrowPathIcon className="h-8 w-8 animate-spin mx-auto mb-3 text-blue-500" />Cargando...</td></tr>
                ) : displayedCategories.length === 0 ? (
                  <tr><td colSpan="3" className="p-16 text-center text-slate-400 font-bold text-lg">No se encontraron categorías.</td></tr>
                ) : (
                  displayedCategories.map((cat) => (
                    <tr
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat)}
                      className={`cursor-pointer group transition-all duration-200 border-l-4 ${
                          selectedCategory?.id === cat.id 
                          ? 'bg-blue-50/80 border-blue-500' // ACENTO AZUL
                          : 'border-transparent hover:bg-slate-50'
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                                selectedCategory?.id === cat.id 
                                ? 'bg-white border-blue-300 text-blue-600 shadow-sm' 
                                : 'bg-slate-100 border-slate-200 text-slate-400 group-hover:border-blue-200 group-hover:text-blue-500'
                            }`}>
                                <TagIcon className="h-5 w-5" />
                            </div>
                            <div className="font-extrabold text-slate-900 text-sm">{cat.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="text-sm font-medium text-slate-600 line-clamp-1">{cat.description || <span className="text-slate-400 italic">Sin descripción</span>}</div>
                      </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                        {cat.parent_name ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                ↳ Sub-nivel de: {cat.parent_name}
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-extrabold text-blue-600">
                                Categoría Principal
                            </span>
                        )}
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

// --- Sub-componente Formulario Categoría ---
const CategoryForm = ({ initialData, categories, onClose, onSuccess, onError }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!initialData;
  const formTitle = isEditing ? 'Editar Categoría' : 'Nueva Categoría';

  useEffect(() => {
    if (isEditing && initialData) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setParentId(initialData.parent_id || '');
    }
  }, [initialData, isEditing]);

  const validateForm = () => {
    const errors = {};
    if (!name) errors.name = 'El nombre es obligatorio';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    
    const url = isEditing ? `${API_ENDPOINT}/${initialData.id}` : API_ENDPOINT;
    const method = isEditing ? 'PUT' : 'POST';
    const payload = { name, description, parent_id: parentId || null };

    try {
      const response = await fetch(url, {
        method: method, headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.success) onSuccess();
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
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
        <button onClick={onClose} className="p-2.5 text-slate-500 bg-white border border-slate-300 hover:bg-slate-50 hover:text-slate-800 hover:border-slate-400 rounded-xl transition-all shadow-sm">
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{formTitle}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre de Familia <span className="text-rose-500">*</span></label>
            <input type="text" value={name} onChange={(e) => { setName(e.target.value); setFormErrors(prev => ({...prev, name: null})); }} className={getInputClasses('name')} />
            {formErrors.name && <p className="mt-1.5 text-xs font-bold text-rose-500">{formErrors.name}</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Categoría Padre (Jerarquía)</label>
            <select value={parentId} onChange={(e) => setParentId(e.target.value)} className={`${getInputClasses('parentId')} bg-slate-50`}>
              <option value="">-- Raíz (Categoría Principal) --</option>
              {categories.filter(cat => !isEditing || cat.id !== initialData.id).map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Descripción Breve</label>
            <textarea rows="3" value={description} onChange={(e) => setDescription(e.target.value)} className={getInputClasses('description')}></textarea>
        </div>

        <div className="text-right pt-6 border-t border-slate-100">
          <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-500 hover:-translate-y-0.5 disabled:translate-y-0 disabled:bg-slate-300 disabled:shadow-none transition-all">
            {isSubmitting ? 'Guardando...' : (isEditing ? 'Actualizar Jerarquía' : 'Crear Categoría')}
          </button>
        </div>
      </form>
    </div>
  );
};