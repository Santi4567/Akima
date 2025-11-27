// src/componentes/proveedores.jsx

import { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeftIcon, 
  UserPlusIcon, 
  PencilIcon, 
  TrashIcon, 
  BuildingStorefrontIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext.jsx';
import { HasPermission } from './HasPermission.jsx';
import { Notification } from './Notification.jsx';
import { PERMISSIONS } from '../config/permissions.js';

// Define la URL de la API (¡sácala de .env!)
const API_URL = import.meta.env.VITE_API_URL;
const API_ENDPOINT = `${API_URL}/api/suppliers`;

export const Proveedores = () => {
  // Estado de la UI
  const [view, setView] = useState('list'); // 'list' o 'form'
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState({ type: '', message: '' });

  // Estado de los Datos
  const [suppliers, setSuppliers] = useState([]); // Lista para la tabla
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 'editingSupplier' es null si es "nuevo", o un objeto si es "editar"
  const [editingSupplier, setEditingSupplier] = useState(null);

  // Hook de autenticación
  const { hasPermission } = useAuth();
  
  // --- FUNCIONES DE API ---

  // Función para cargar todos los proveedores
  const fetchSuppliers = useCallback(async () => {
    setIsLoading(true);
    // Limpia la selección al recargar
    setSelectedSupplier(null); 
    try {
      const response = await fetch(API_ENDPOINT, {
        credentials: 'include', // ¡HttpOnly!
      });
      if (!response.ok) throw new Error('Error al cargar proveedores');
      const data = await response.json();
      
      if (data.success) {
        setSuppliers(data.data);
      } else {
        throw new Error(data.message || 'Error en los datos recibidos');
      }
    } catch (error) {
      setNotification({ type: 'error', message: error.message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cargar proveedores al montar el componente
  useEffect(() => {
    // Solo cargamos si tiene permiso de VER
    if (hasPermission('view.suppliers')) {
      fetchSuppliers();
    } else {
      setIsLoading(false);
      setNotification({ type: 'error', message: 'No tienes permisos para ver proveedores.' });
    }
  }, [fetchSuppliers, hasPermission]);

  // Función de Búsqueda
  const handleSearch = async () => {
    if (!searchTerm) {
      fetchSuppliers(); // Si está vacío, recarga todos
      return;
    }
    
    setIsLoading(true);
    setSelectedSupplier(null);
    try {
      // Usamos el endpoint de búsqueda de tu API
      const response = await fetch(`${API_ENDPOINT}/search?q=${searchTerm}`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setSuppliers(data.data);
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
    if (!selectedSupplier) return;
    
    if (window.confirm(`¿Estás seguro de que quieres eliminar a "${selectedSupplier.name}"?`)) {
      try {
        const response = await fetch(`${API_ENDPOINT}/${selectedSupplier.id}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        const data = await response.json();

        if (data.success) {
          setNotification({ type: 'success', message: data.message });
          setSelectedSupplier(null); // Deselecciona
          fetchSuppliers(); // Recarga la lista
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
    setEditingSupplier(null); // Limpia el formulario
    setNotification({ type: '', message: '' }); // Limpia alertas
  };

  const showFormView = (supplierToEdit = null) => {
    setEditingSupplier(supplierToEdit);
    setView('form');
    setNotification({ type: '', message: '' });
  };
  
  // --- RENDERIZADO ---

  // Vista de Formulario
  if (view === 'form') {
    return (
      <SupplierForm
        initialData={editingSupplier}
        onClose={showListView} // Este es tu botón de "regresar"
        onSuccess={() => {
          showListView();
          fetchSuppliers();
          setNotification({ type: 'success', message: 'Proveedor guardado exitosamente.' });
        }}
        onError={(message) => {
          // El error se muestra en el formulario
          setNotification({ type: 'error', message: message });
        }}
      />
    );
  }

  // Vista de Lista (Default)
  return (
    <div className="space-y-6">
      <Notification
        type={notification.type}
        message={notification.message}
        onClose={() => setNotification({ type: '', message: '' })}
      />
      
      {/* --- Cabecera: Título y Botón de Agregar --- */}
      <div className="flex justify-between items-center pb-2 border-b border-gray-300">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <BuildingStorefrontIcon className="h-8 w-8 mr-3 text-gray-700" />
          Gestión de Proveedores
        </h1>
        <HasPermission required="add.suppliers">
          <button
            onClick={() => showFormView(null)} // null = "Nuevo"
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-150"
          >
            <UserPlusIcon className="h-5 w-5" />
            Agregar Proveedor
          </button>
        </HasPermission>
      </div>

      {/* --- Barra de Acciones: Búsqueda, Editar, Eliminar --- */}
      <HasPermission required="view.suppliers">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Sección de Búsqueda */}
          <div className="md:col-span-2 flex gap-2">
            <input
              type="search"
              placeholder="Buscar por nombre, contacto, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleSearch}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
              Buscar
            </button>
          </div>

          {/* Sección de Botones de Acción */}
          <div className="flex justify-start md:justify-end gap-3">
            <HasPermission required="edit.suppliers">
              <button
                disabled={!selectedSupplier}
                onClick={() => showFormView(selectedSupplier)} // Carga el form con datos
                className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <PencilIcon className="h-5 w-5" />
                Editar
              </button>
            </HasPermission>
            <HasPermission required="delete.suppliers">
              <button
                disabled={!selectedSupplier}
                onClick={handleDelete}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <TrashIcon className="h-5 w-5" />
                Eliminar
              </button>
            </HasPermission>
          </div>
        </div>
      </HasPermission>

      {/* --- Tabla de Proveedores (Resaltada) --- */}
      <HasPermission required="view.suppliers">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          {/* Contenedor de la tabla con scroll vertical */}
          <div className="overflow-y-auto h-[60vh]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Contacto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Email / Teléfono</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr><td colSpan="4" className="p-6 text-center text-gray-500 animate-pulse">Cargando proveedores...</td></tr>
                ) : (
                  suppliers.map((supplier) => (
                    <tr
                      key={supplier.id}
                      onClick={() => setSelectedSupplier(supplier)}
                      className={`cursor-pointer transition-colors duration-150 ${
                        selectedSupplier?.id === supplier.id 
                        ? 'bg-blue-100 text-blue-900' // Fila seleccionada resaltada
                        : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                        <div className="text-xs text-gray-500">{supplier.tax_id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{supplier.contact_person}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                         <div className="text-sm text-gray-900">{supplier.email}</div>
                         <div className="text-sm text-gray-500">{supplier.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          supplier.status === 'activo' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                        }`}>
                          {supplier.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
                {!isLoading && suppliers.length === 0 && (
                  <tr><td colSpan="4" className="p-6 text-center text-gray-500">No se encontraron proveedores.</td></tr>
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

const SupplierForm = ({ initialData, onClose, onSuccess, onError }) => {
  // Usamos un solo estado para el formulario
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    status: 'activo',
    tax_id: '',
    payment_terms: 'Net 30'
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determina si estamos editando o creando
  const isEditing = !!initialData;
  const formTitle = isEditing ? 'Editar Proveedor' : 'Agregar Proveedor';

  // Carga los datos iniciales si estamos en modo "Editar"
  useEffect(() => {
    if (isEditing) {
      // Rellena el formulario con los datos del proveedor a editar
      setFormData({
        name: initialData.name || '',
        contact_person: initialData.contact_person || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        address: initialData.address || '',
        website: initialData.website || '',
        status: initialData.status || 'activo',
        tax_id: initialData.tax_id || '',
        payment_terms: initialData.payment_terms || 'Net 30',
      });
    }
  }, [initialData, isEditing]);

  // Manejador genérico para todos los inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Limpia el error de este campo si se empieza a editar
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Validación simple
  const validateForm = () => {
    const errors = {};
    if (!formData.name) errors.name = 'El nombre es obligatorio';
    if (!formData.email) errors.email = 'El email es obligatorio';
    if (!formData.phone) errors.phone = 'El teléfono es obligatorio';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return; // Detiene si hay errores
    
    setIsSubmitting(true);
    
    // El payload es el estado del formulario
    const payload = formData;

    const url = isEditing
      ? `${API_ENDPOINT}/${initialData.id}`
      : API_ENDPOINT;
      
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
      onError(error.message); // Muestra el error en la notificación principal
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Helper para clases de inputs con error
  const getInputClasses = (fieldName) => {
    return `mt-1 block w-full p-2 border rounded-md shadow-sm ${
      formErrors[fieldName]
      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
    }`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      
      <div className="flex items-center gap-4">
        {/* Este es tu botón de "regresar" */}
        <button
          onClick={onClose} 
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          title="Regresar a la lista"
        >
          <ArrowLeftIcon className="h-6 w-6" />
        </button>
        <h1 className="text-3xl font-bold text-gray-900">{formTitle}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-xl space-y-6">
        
        {/* Fila 1: Nombre y Contacto */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Nombre del Proveedor <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={getInputClasses('name')}
            />
            {formErrors.name && <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>}
          </div>
          <div>
            <label htmlFor="contact_person" className="block text-sm font-medium text-gray-700">
              Persona de Contacto
            </label>
            <input
              type="text"
              id="contact_person"
              name="contact_person"
              value={formData.contact_person}
              onChange={handleChange}
              className={getInputClasses('contact_person')}
            />
          </div>
        </div>

        {/* Fila 2: Email y Teléfono */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={getInputClasses('email')}
            />
            {formErrors.email && <p className="mt-1 text-xs text-red-600">{formErrors.email}</p>}
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Teléfono <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={getInputClasses('phone')}
            />
            {formErrors.phone && <p className="mt-1 text-xs text-red-600">{formErrors.phone}</p>}
          </div>
        </div>

        {/* Fila 3: Dirección y Sitio Web */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              Dirección
            </label>
            <textarea
              id="address"
              name="address"
              rows="3"
              value={formData.address}
              onChange={handleChange}
              className={getInputClasses('address')}
            ></textarea>
          </div>
           <div>
            <label htmlFor="website" className="block text-sm font-medium text-gray-700">
              Sitio Web (ej. https://...)
            </label>
            <input
              type="url"
              id="website"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className={getInputClasses('website')}
            />
          </div>
        </div>

        {/* Fila 4: RFC, Términos y Estado */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="tax_id" className="block text-sm font-medium text-gray-700">
              RFC (Tax ID)
            </label>
            <input
              type="text"
              id="tax_id"
              name="tax_id"
              value={formData.tax_id}
              onChange={handleChange}
              className={getInputClasses('tax_id')}
            />
          </div>
          <div>
            <label htmlFor="payment_terms" className="block text-sm font-medium text-gray-700">
              Términos de Pago
            </label>
            <input
              type="text"
              id="payment_terms"
              name="payment_terms"
              value={formData.payment_terms}
              onChange={handleChange}
              className={getInputClasses('payment_terms')}
            />
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Estado
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className={`${getInputClasses('status')} bg-white`} // bg-white para que el select se vea bien
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
        </div>

        {/* Botón de Guardar */}
        <div className="text-right pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-green-600 text-white px-6 py-2 rounded-lg shadow-md hover:bg-green-700 disabled:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            {isSubmitting ? 'Guardando...' : (isEditing ? 'Actualizar Proveedor' : 'Crear Proveedor')}
          </button>
        </div>
      </form>
    </div>
  );
};