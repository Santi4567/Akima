// src/componentes/clientes.jsx

import { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeftIcon, 
  UserPlusIcon, 
  PencilIcon, 
  TrashIcon, 
  UsersIcon, // Icono para Clientes
  MagnifyingGlassIcon
} from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext.jsx';
import { HasPermission } from './HasPermission.jsx';
import { Notification } from './Notification.jsx';
import { PERMISSIONS } from '../config/permissions.js';

// Define la URL de la API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
// Endpoint específico de Clientes (según tu .md)
const API_ENDPOINT = `${API_URL}/api/clients`;

export const Clientes = () => {
  // Estado de la UI
  const [view, setView] = useState('list'); // 'list' o 'form'
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState({ type: '', message: '' });

  // Estado de los Datos
  const [clients, setClients] = useState([]); // Lista para la tabla
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 'editingClient' es null si es "nuevo", o un objeto si es "editar"
  const [editingClient, setEditingClient] = useState(null);

  // Hook de autenticación
  const { hasPermission } = useAuth();
  
  // --- FUNCIONES DE API ---

  // Función para cargar todos los clientes
  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    setSelectedClient(null); // Limpia la selección al recargar
    try {
      const response = await fetch(API_ENDPOINT, {
        credentials: 'include', // ¡HttpOnly!
      });
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

  // Cargar clientes al montar el componente
  useEffect(() => {
    if (hasPermission('view.clients')) {
      fetchClients();
    } else {
      setIsLoading(false);
      setNotification({ type: 'error', message: 'No tienes permisos para ver clientes.' });
    }
  }, [fetchClients, hasPermission]);

  // Función de Búsqueda
  const handleSearch = async () => {
    if (!searchTerm) {
      fetchClients(); // Si está vacío, recarga todos
      return;
    }
    
    setIsLoading(true);
    setSelectedClient(null);
    try {
      // Usamos el endpoint de búsqueda de tu API
      const response = await fetch(`${API_ENDPOINT}/search?q=${searchTerm}`, {
        credentials: 'include',
      });
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

  // Función para Borrar
  const handleDelete = async () => {
    if (!selectedClient) return;
    
    // Usamos first_name y last_name para el 'confirm'
    const clientName = `${selectedClient.first_name} ${selectedClient.last_name}`;
    if (window.confirm(`¿Estás seguro de que quieres eliminar a "${clientName}"?`)) {
      try {
        const response = await fetch(`${API_ENDPOINT}/${selectedClient.id}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        const data = await response.json();

        if (data.success) {
          setNotification({ type: 'success', message: data.message });
          setSelectedClient(null); // Deselecciona
          fetchClients(); // Recarga la lista
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
    setEditingClient(null); // Limpia el formulario
    setNotification({ type: '', message: '' }); // Limpia alertas
  };

  const showFormView = (clientToEdit = null) => {
    setEditingClient(clientToEdit);
    setView('form');
    setNotification({ type: '', message: '' });
  };
  
  // --- RENDERIZADO ---

  // Vista de Formulario
  if (view === 'form') {
    return (
      <ClientForm
        initialData={editingClient}
        onClose={showListView} // Botón para regresar
        onSuccess={() => {
          showListView();
          fetchClients();
          setNotification({ type: 'success', message: 'Cliente guardado exitosamente.' });
        }}
        onError={(message) => {
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
          <UsersIcon className="h-8 w-8 mr-3 text-gray-700" />
          Gestión de Clientes
        </h1>
        <HasPermission required="add.clients">
          <button
            onClick={() => showFormView(null)} // null = "Nuevo"
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-150"
          >
            <UserPlusIcon className="h-5 w-5" />
            Agregar Cliente
          </button>
        </HasPermission>
      </div>

      {/* --- Barra de Acciones: Búsqueda, Editar, Eliminar --- */}
      <HasPermission required="view.clients">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Sección de Búsqueda */}
          <div className="md:col-span-2 flex gap-2">
            <input
              type="search"
              placeholder="Buscar por nombre, email, empresa..."
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
            <HasPermission required="edit.clients">
              <button
                disabled={!selectedClient}
                onClick={() => showFormView(selectedClient)} // Carga el form con datos
                className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <PencilIcon className="h-5 w-5" />
                Editar
              </button>
            </HasPermission>
            <HasPermission required="delete.clients">
              <button
                disabled={!selectedClient}
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

      {/* --- Tabla de Clientes (Resaltada) --- */}
      <HasPermission required="view.clients">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="overflow-y-auto h-[60vh]"> {/* Scroll vertical */}
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Contacto (Email / Tel)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Empresa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr><td colSpan="4" className="p-6 text-center text-gray-500 animate-pulse">Cargando clientes...</td></tr>
                ) : (
                  clients.map((client) => (
                    <tr
                      key={client.id}
                      onClick={() => setSelectedClient(client)}
                      className={`cursor-pointer transition-colors duration-150 ${
                        selectedClient?.id === client.id 
                        ? 'bg-blue-100 text-blue-900' // Fila seleccionada
                        : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{client.first_name} {client.last_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                         <div className="text-sm text-gray-900">{client.email}</div>
                         <div className="text-sm text-gray-500">{client.phone}</div>
                      </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{client.company_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {/* Etiqueta de estado con colores */}
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          client.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : client.status === 'lead'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                        }`}>
                          {client.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
                {!isLoading && clients.length === 0 && (
                  <tr><td colSpan="4" className="p-6 text-center text-gray-500">No se encontraron clientes.</td></tr>
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

const ClientForm = ({ initialData, onClose, onSuccess, onError }) => {
  // Estado del formulario basado en la API de Clientes
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company_name: '',
    status: 'lead', // Default según tu API
    address: '',
    notes: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!initialData;
  const formTitle = isEditing ? 'Editar Cliente' : 'Agregar Cliente';

  // Carga los datos iniciales si estamos en modo "Editar"
  useEffect(() => {
    if (isEditing) {
      setFormData({
        first_name: initialData.first_name || '',
        last_name: initialData.last_name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        company_name: initialData.company_name || '',
        status: initialData.status || 'lead',
        address: initialData.address || '',
        notes: initialData.notes || '',
      });
    }
  }, [initialData, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Validación (campos requeridos según tu API de 'crear')
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
        onSuccess(data.message);
      } else {
        throw new Error(data.message || 'Error al guardar');
      }
    } catch (error) {
      onError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
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
        {/* Botón de Regresar */}
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
        
        {/* Fila 1: Nombre y Apellido */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              className={getInputClasses('first_name')}
            />
            {formErrors.first_name && <p className="mt-1 text-xs text-red-600">{formErrors.first_name}</p>}
          </div>
          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
              Apellido <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              className={getInputClasses('last_name')}
            />
            {formErrors.last_name && <p className="mt-1 text-xs text-red-600">{formErrors.last_name}</p>}
          </div>
        </div>

        {/* Fila 2: Email y Teléfono */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email ejemplo@ejemplo.com<span className="text-red-500">*</span>
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
              Teléfono Ejemplo 222-333-4445
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={getInputClasses('phone')}
            />
          </div>
        </div>

        {/* Fila 3: Empresa y Estado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">
              Empresa <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="company_name"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              className={getInputClasses('company_name')}
            />
            {formErrors.company_name && <p className="mt-1 text-xs text-red-600">{formErrors.company_name}</p>}
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
              className={`${getInputClasses('status')} bg-white`}
            >
              <option value="lead">Lead</option>
              <option value="contacted">Contactado</option>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
              <option value="lost">Perdido</option>
            </select>
          </div>
        </div>

        {/* Fila 4: Dirección y Notas (Opcionales) */}
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
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Notas
            </label>
            <textarea
              id="notes"
              name="notes"
              rows="3"
              value={formData.notes}
              onChange={handleChange}
              className={getInputClasses('notes')}
            ></textarea>
          </div>
        </div>

        {/* Botón de Guardar */}
        <div className="text-right pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-green-600 text-white px-6 py-2 rounded-lg shadow-md hover:bg-green-700 disabled:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            {isSubmitting ? 'Guardando...' : (isEditing ? 'Actualizar Cliente' : 'Crear Cliente')}
          </button>
        </div>
      </form>
    </div>
  );
};