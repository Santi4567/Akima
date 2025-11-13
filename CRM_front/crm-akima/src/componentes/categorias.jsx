import { useState, useEffect, useCallback } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext.jsx';
import { HasPermission } from './HasPermission.jsx';
import { Notification } from './Notification.jsx';
import { PERMISSIONS } from '../config/permissions.js';

// Define la URL de la API (¡sácala de .env!)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const Categorias = () => {
  // Estado de la UI
  const [view, setView] = useState('list'); // 'list' o 'form'
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState({ type: '', message: '' });

  // Estado de los Datos
  const [allCategories, setAllCategories] = useState([]); // Lista completa para el dropdown
  const [displayedCategories, setDisplayedCategories] = useState([]); // Lista para la tabla (filtrada)
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 'editingCategory' es null si es "nuevo", o un objeto si es "editar"
  const [editingCategory, setEditingCategory] = useState(null);

  // Hook de autenticación
  const { hasPermission } = useAuth();
  
  // --- FUNCIONES DE API ---

  // Función para cargar todas las categorías (para la tabla y el dropdown)
  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/categories`, {
        credentials: 'include', // ¡HttpOnly!
      });
      if (!response.ok) throw new Error('Error al cargar categorías');
      const data = await response.json();
      
      if (data.success) {
        setAllCategories(data.data);
        setDisplayedCategories(data.data); // Al inicio, muestra todas
      }
    } catch (error) {
      setNotification({ type: 'error', message: error.message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cargar categorías al montar el componente
  useEffect(() => {
    if (hasPermission('view.category')) {
      fetchCategories();
    } else {
      setIsLoading(false); // No tiene permiso para ver
    }
  }, [fetchCategories, hasPermission]);

  // Función de Búsqueda
  const handleSearch = async () => {
    if (!searchTerm) {
      setDisplayedCategories(allCategories); // Si está vacío, muestra todo
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/categories/search?q=${searchTerm}`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setDisplayedCategories(data.data);
      } else {
        throw new Error(data.message || 'Error al buscar');
      }
    } catch (error) {
      setNotification({ type: 'error', message: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  // Función para Borrar
  const handleDelete = async () => {
    if (!selectedCategory) return;
    
    // Mostramos un 'confirm' nativo (puedes cambiarlo por un modal)
    if (window.confirm(`¿Estás seguro de que quieres eliminar "${selectedCategory.name}"?`)) {
      try {
        const response = await fetch(`${API_URL}/api/categories/${selectedCategory.id}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        const data = await response.json();

        if (data.success) {
          setNotification({ type: 'success', message: data.message });
          setSelectedCategory(null); // Deselecciona
          fetchCategories(); // Recarga la lista
        } else {
          throw new Error(data.message || 'Error al eliminar');
        }
      } catch (error) {
        setNotification({ type: 'error', message: error.message });
      }
    }
  };

  // --- NAVEGACIÓN DE VISTAS ---

  const showListView = () => {
    setView('list');
    setEditingCategory(null); // Limpia el formulario
    setNotification({ type: '', message: '' }); // Limpia alertas
  };

  const showFormView = (categoryToEdit = null) => {
    setEditingCategory(categoryToEdit);
    setView('form');
    setNotification({ type: '', message: '' });
  };
  
  // --- RENDERIZADO ---

  // Vista de Formulario
  if (view === 'form') {
    return (
      <CategoryForm
        categories={allCategories}
        initialData={editingCategory}
        onClose={showListView}
        onSuccess={() => {
          showListView();
          fetchCategories();
          setNotification({ type: 'success', message: 'Categoría guardada exitosamente.' });
        }}
        onError={(message) => {
          setNotification({ type: 'error', message: message });
        }}
      />
    );
  }

  // Vista de Lista (Default)
  return (
    <div className="space-y-4">
      <Notification
        type={notification.type}
        message={notification.message}
        onClose={() => setNotification({ type: '', message: '' })}
      />
      
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Categorías</h1>
        <HasPermission required="add.category">
          <button
            onClick={() => showFormView(null)} // null = "Nuevo"
            className="bg-green-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-green-700"
          >
            + Agregar Categoría
          </button>
        </HasPermission>
      </div>

      <HasPermission required="view.category">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="search"
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full md:w-1/2 p-2 border border-gray-300 rounded-md"
          />
          <button
            onClick={handleSearch}
            className="bg-blue-600 text-white px-4 py-2 rounded-md"
          >
            Buscar
          </button>
        </div>
      </HasPermission>

      <div className="flex gap-4">
        <HasPermission required="edit.category">
          <button
            disabled={!selectedCategory}
            onClick={() => showFormView(selectedCategory)} // Carga el form con datos
            className="bg-yellow-500 text-white px-4 py-2 rounded-md disabled:bg-gray-300"
          >
            Editar
          </button>
        </HasPermission>
        <HasPermission required="delete.category">
          <button
            disabled={!selectedCategory}
            onClick={handleDelete}
            className="bg-red-600 text-white px-4 py-2 rounded-md disabled:bg-gray-300"
          >
            Eliminar
          </button>
        </HasPermission>
      </div>

      <HasPermission required="view.category">
        <div className="bg-white shadow rounded-lg">
          {/* Contenedor de la tabla con scroll */}
          <div className="overflow-y-auto h-[500px]"> {/* Altura fija y scroll */}
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría Padre</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr><td colSpan="3" className="p-4 text-center">Cargando...</td></tr>
                ) : (
                  displayedCategories.map((cat) => (
                    <tr
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat)}
                      className={`cursor-pointer ${selectedCategory?.id === cat.id ? 'bg-green-100' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">{cat.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{cat.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {cat.parent_id ? (allCategories.find(p => p.id === cat.parent_id)?.name || 'N/A') : 'Principal'}
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

// --- Sub-componente del Formulario (dentro del mismo archivo) ---
const CategoryForm = ({ categories, initialData, onClose, onSuccess, onError }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState(''); // '' para "ninguno"
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determina si estamos editando o creando
  const isEditing = !!initialData;
  const formTitle = isEditing ? 'Editar Categoría' : 'Agregar Categoría';

  // Carga los datos iniciales si estamos en modo "Editar"
  useEffect(() => {
    if (isEditing) {
      setName(initialData.name);
      setDescription(initialData.description);
      setParentId(initialData.parent_id || '');
    }
  }, [initialData, isEditing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const payload = {
      name,
      description,
      parent_id: parentId ? Number(parentId) : null, // Asegúrate que sea número o null
    };

    const url = isEditing
      ? `${API_URL}/api/categories/${initialData.id}`
      : `${API_URL}/api/categories`;
      
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // ¡HttpOnly!
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess(data.message); // Llama al callback de éxito
      } else {
        throw new Error(data.message || 'Error al guardar');
      }
    } catch (error) {
      onError(error.message); // Muestra el error en la notificación
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Notification
        message={isSubmitting ? 'Guardando...' : ''}
        type="success"
        onClose={() => {}}
      />
      
      <div className="flex items-center gap-4">
        <button
          onClick={onClose} // Botón de regresar
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeftIcon className="h-6 w-6" />
        </button>
        <h1 className="text-3xl font-bold text-gray-900">{formTitle}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Nombre de la Categoría
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Descripción
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="3"
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          ></textarea>
        </div>
        
        <div>
          <label htmlFor="parent_id" className="block text-sm font-medium text-gray-700">
            Categoría Padre (Opcional)
          </label>
          <select
            id="parent_id"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md bg-white"
          >
            <option value="">-- Ninguna (Categoría Principal) --</option>
            {categories
              .filter(cat => !isEditing || cat.id !== initialData.id) // No puede ser padre de sí misma
              .map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
            ))}
          </select>
        </div>

        <div className="text-right">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-green-600 text-white px-6 py-2 rounded-md shadow-sm hover:bg-green-700 disabled:bg-gray-300"
          >
            {isSubmitting ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
          </button>
        </div>
      </form>
    </div>
  );
};