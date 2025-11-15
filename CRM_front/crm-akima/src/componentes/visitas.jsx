// src/componentes/visitas.jsx

import { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeftIcon, 
  PlusIcon, // Corregido (antes CalendarPlusIcon)
  PencilIcon, 
  TrashIcon, 
  CalendarDaysIcon,
  MagnifyingGlassIcon, // Para la búsqueda
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext.jsx';
import { HasPermission } from './HasPermission.jsx';
import { Notification } from './Notification.jsx';
import { PERMISSIONS } from '../config/permissions.js';

// URLs de la API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const VISITS_ENDPOINT = `${API_URL}/api/visits`;
const CLIENTS_ENDPOINT = `${API_URL}/api/clients`;
const USERS_ENDPOINT = `${API_URL}/api/users`;

// Helper para formatear la fecha
const formatDateTime = (isoString) => {
  if (!isoString) return 'N/A';
  return new Date(isoString).toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// --- Componente Principal: Visitas ---
export const Visitas = () => {
  const [view, setView] = useState('list');
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState({ type: '', message: '' });

  const [visits, setVisits] = useState([]);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [editingVisit, setEditingVisit] = useState(null);
  
  // --- NUEVO: Estado para la búsqueda ---
  const [searchTerm, setSearchTerm] = useState('');

  const { hasPermission, hasAnyPermission } = useAuth();

  // Función para cargar TODAS las visitas
  const fetchVisits = useCallback(async () => {
    setIsLoading(true);
    setSelectedVisit(null);
    try {
      const response = await fetch(VISITS_ENDPOINT, { credentials: 'include' });
      if (!response.ok) throw new Error('Error al cargar las visitas');
      const data = await response.json();
      
      if (data.success) {
        setVisits(data.data);
      } else {
        throw new Error(data.message || 'Error en los datos');
      }
    } catch (error) {
      setNotification({ type: 'error', message: error.message });
    } finally {
      setIsLoading(false);
    }
  }, []); // Dependencias vacías, solo se define una vez

  // --- NUEVO: Función para BUSCAR visitas ---
  const searchVisits = useCallback(async (query) => {
    setIsLoading(true);
    setSelectedVisit(null);
    try {
      const response = await fetch(`${VISITS_ENDPOINT}/search?q=${query}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Error en la búsqueda');
      const data = await response.json();
      
      if (data.success) {
        setVisits(data.data);
      } else {
        setVisits([]); // Limpia la lista si la búsqueda falla
        throw new Error(data.message || 'Error al buscar');
      }
    } catch (error) {
      setNotification({ type: 'error', message: error.message });
    } finally {
      setIsLoading(false);
    }
  }, []); // Dependencias vacías

  // Cargar visitas al montar (si tiene permiso)
  useEffect(() => {
    const canView = hasAnyPermission(PERMISSIONS.VISITS); 
    if (canView) {
      fetchVisits();
    } else {
      setIsLoading(false);
      setNotification({ type: 'error', message: 'No tienes permisos para ver visitas.' });
    }
  }, [fetchVisits, hasAnyPermission]); // Solo se ejecuta al montar

  // --- NUEVO: useEffect para la búsqueda "en vivo" (debounced) ---
  useEffect(() => {
    // No hacer nada si estamos en la vista de formulario
    if (view !== 'list') return;

    // Inicia un temporizador
    const timerId = setTimeout(() => {
      if (searchTerm === '') {
        fetchVisits(); // Si el input está vacío, carga todas
      } else {
        searchVisits(searchTerm); // Si hay texto, busca
      }
    }, 350); // 350ms de espera

    // Limpieza: si el usuario sigue tecleando, cancela el temporizador anterior
    return () => clearTimeout(timerId);
    
  }, [searchTerm, view, fetchVisits, searchVisits]); // Se re-ejecuta cada vez que searchTerm o view cambia


  // Función para Borrar
  const handleDelete = async () => {
    if (!selectedVisit) return;
    
    if (window.confirm(`¿Estás seguro de que quieres eliminar/cancelar esta visita?`)) {
      try {
        const response = await fetch(`${VISITS_ENDPOINT}/${selectedVisit.id}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        const data = await response.json();

        if (data.success) {
          setNotification({ type: 'success', message: data.message });
          setSelectedVisit(null);
          // Vuelve a cargar la lista (o la búsqueda actual)
          searchTerm ? searchVisits(searchTerm) : fetchVisits();
        } else {
          throw new Error(data.message || 'Error al eliminar');
        }
      } catch (error) {
        setNotification({ type: 'error', message: error.message });
      }
    }
  };

  // Vistas
  const showListView = () => {
    setView('list');
    setEditingVisit(null);
    setNotification({ type: '', message: '' });
    // Limpiamos la búsqueda al volver del formulario
    if (searchTerm !== '') {
      setSearchTerm(''); 
    }
  };

  const showFormView = (visitToEdit = null) => {
    setEditingVisit(visitToEdit);
    setView('form');
    setNotification({ type: '', message: '' });
  };

  // Renderizado
  if (view === 'form') {
    return (
      <VisitForm
        initialData={editingVisit}
        onClose={showListView}
        onSuccess={() => {
          showListView();
          // No necesitamos fetchVisits() aquí, 
          // showListView() pondrá el searchTerm en ''
          // y el useEffect se encargará de recargar la lista.
          setNotification({ type: 'success', message: 'Visita guardada exitosamente.' });
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
          <CalendarDaysIcon className="h-8 w-8 mr-3 text-gray-700" />
          Agenda de Visitas
        </h1>
        <HasPermission required="add.visits">
          <button
            onClick={() => showFormView(null)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            <PlusIcon className="h-5 w-5" />
            Agendar Visita
          </button>
        </HasPermission>
      </div>

      {/* --- NUEVO: Barra de Búsqueda --- */}
      <HasPermission any={PERMISSIONS.VISITS}>
        <div className="flex gap-2">
          <div className="relative w-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="search"
              placeholder="Buscar por cliente, vendedor o notas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 pl-10 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </HasPermission>

      {/* --- Barra de Acciones - Editar y Eliminar --- */}
      <div className="flex justify-start gap-3">
        <HasPermission required="edit.visits">
          <button
            disabled={!selectedVisit}
            onClick={() => showFormView(selectedVisit)}
            className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-yellow-600 disabled:bg-gray-300"
          >
            <PencilIcon className="h-5 w-5" />
            Editar
          </button>
        </HasPermission>
        <HasPermission required="delete.visits">
          <button
            disabled={!selectedVisit}
            onClick={handleDelete}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-red-700 disabled:bg-gray-300"
          >
            <TrashIcon className="h-5 w-5" />
            Eliminar
          </button>
        </HasPermission>
      </div>

      {/* --- Tabla de Visitas --- */}
      <div className="bg-white shadow-xl rounded-lg overflow-hidden">
        <div className="overflow-y-auto h-[60vh]"> {/* <-- Aquí está el scrollbar */}
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Vendedor Asignado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Fecha Programada</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Notas</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan="5" className="p-6 text-center text-gray-500 animate-pulse">Cargando visitas...</td></tr>
              ) : (
                visits.map((visit) => (
                  <tr
                    key={visit.id}
                    onClick={() => setSelectedVisit(visit)}
                    className={`cursor-pointer ${selectedVisit?.id === visit.id ? 'bg-blue-100' : 'hover:bg-gray-50'}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{visit.client_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{visit.user_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatDateTime(visit.scheduled_for)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        visit.status === 'completed' ? 'bg-green-100 text-green-800' :
                        visit.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800' // 'cancelled'
                      }`}>
                        {visit.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate" title={visit.notes}>{visit.notes}</td>
                  </tr>
                ))
              )}
              {!isLoading && visits.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-6 text-center text-gray-500">
                    {searchTerm ? `No se encontraron visitas para "${searchTerm}"` : 'No hay visitas agendadas.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- Sub-componente del Formulario (con campos de Fecha y Hora separados) ---

const VisitForm = ({ initialData, onClose, onSuccess, onError }) => {
  const { user, hasPermission } = useAuth(); 

  const [formData, setFormData] = useState({
    client_id: null,
    user_id: null,
    // --- CAMBIO: Separamos los campos ---
    visit_date: '', // Nuevo campo para la fecha
    visit_time: '', // Nuevo campo para la hora
    // ---
    notes: '',
    status: 'pending',
  });
  
  const [allClients, setAllClients] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  
  const [clientSearch, setClientSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [clientDropdown, setClientDropdown] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const isEditing = !!initialData;
  const formTitle = isEditing ? 'Editar Visita' : 'Agendar Visita';

  // Cargar Clientes y Usuarios (sin cambios)
  useEffect(() => {
    if (hasPermission('view.clients')) {
      fetch(CLIENTS_ENDPOINT, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setAllClients(data.data);
            if (initialData?.client_id) {
              const client = data.data.find(c => c.id === initialData.client_id);
              if (client) setClientSearch(`${client.first_name} ${client.last_name}`);
            }
          }
        });
    }

    if (hasPermission('assign.visits') && hasPermission('view.users')) {
      fetch(USERS_ENDPOINT, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setAllUsers(data.data);
            if (initialData?.user_id) {
              const user = data.data.find(u => u.ID === initialData.user_id);
              if (user) setUserSearch(user.Nombre);
            }
          }
        });
    }
  }, [initialData, hasPermission]);


  // Cargar datos iniciales o valores por defecto
  useEffect(() => {
    if (isEditing) {
      // --- CAMBIO: Separamos la fecha y hora al cargar ---
      let datePart = '';
      let timePart = '';

      if (initialData.scheduled_for) {
        // Obtenemos 'YYYY-MM-DDTHH:MM'
        const localDateTime = new Date(initialData.scheduled_for).toISOString().slice(0, 16);
        const parts = localDateTime.split('T');
        datePart = parts[0];
        timePart = parts[1];
      }
      
      setFormData({
        client_id: initialData.client_id,
        user_id: initialData.user_id,
        visit_date: datePart,
        visit_time: timePart,
        notes: initialData.notes || '',
        status: initialData.status || 'pending',
      });
      
    } else {
      // Valor por defecto: asignar al usuario actual
      setFormData(prev => ({ ...prev, user_id: user.id }));
      setUserSearch(user.nombre);
    }
  }, [initialData, isEditing, user]);

  // Handlers de selección (sin cambios)
  const selectClient = (client) => {
    setFormData(prev => ({ ...prev, client_id: client.id }));
    setClientSearch(`${client.first_name} ${client.last_name}`);
    setClientDropdown(false);
    setFormErrors(prev => ({ ...prev, client_id: null }));
  };
  
  const selectUser = (user) => {
    setFormData(prev => ({ ...prev, user_id: user.ID }));
    setUserSearch(user.Nombre);
    setUserDropdown(false);
    setFormErrors(prev => ({ ...prev, user_id: null }));
  };
  
  // Validación (ahora revisa fecha y hora)
  const validateForm = () => {
    const errors = {};
    if (!formData.client_id) {
      errors.client_id = 'Debes seleccionar un cliente';
    }
    if (!formData.user_id) {
      errors.user_id = 'Debes asignar la visita a un vendedor';
    }
    // --- CAMBIO: Validamos los campos nuevos ---
    if (!formData.visit_date) {
      errors.visit_date = 'La fecha es obligatoria';
    }
    if (!formData.visit_time) {
      errors.visit_time = 'La hora es obligatoria';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    // --- CAMBIO: Unimos fecha y hora al formato de MySQL ---
    // El input 'time' da 'HH:MM'. Añadimos ':00' para los segundos.
    const mysqlDateTime = `${formData.visit_date} ${formData.visit_time}:00`;
    
    const payload = {
      client_id: formData.client_id,
      scheduled_for: mysqlDateTime, // <-- Enviamos el formato unido
      notes: formData.notes,
    };
    
    if (hasPermission('assign.visits')) {
      payload.user_id = formData.user_id;
    }
    
    if (isEditing) {
      payload.status = formData.status;
    }
    
    const url = isEditing ? `${VISITS_ENDPOINT}/${initialData.id}` : VISITS_ENDPOINT;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess(data.message);
      } else {
        throw new Error(data.message || 'Error al guardar la visita');
      }
    } catch (error) {
      onError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Helper para clases de inputs (sin cambios)
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
        <button
          onClick={onClose} 
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
          title="Regresar a la lista"
        >
          <ArrowLeftIcon className="h-6 w-6" />
        </button>
        <h1 className="text-3xl font-bold text-gray-900">{formTitle}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-xl space-y-6">
        
        {/* Fila de Buscadores (Cliente y Vendedor) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* BUSCADOR DE CLIENTES (Requerido) */}
          <div className="relative">
            <label htmlFor="client" className="block text-sm font-medium text-gray-700">
              Cliente <span className="text-red-500">*</span>
            </label>
            <input
              id="client"
              type="text"
              placeholder="Buscar cliente..."
              value={clientSearch}
              onChange={(e) => { 
                setClientSearch(e.target.value); 
                setClientDropdown(true);
                if (e.target.value === '') {
                  setFormData(prev => ({ ...prev, client_id: null }));
                }
              }}
              onFocus={() => setClientDropdown(true)}
              onBlur={() => setTimeout(() => setClientDropdown(false), 200)}
              className={getInputClasses('client_id')}
            />
            {clientDropdown && (
              <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                {filteredClients.length > 0 ? (
                  filteredClients.map(client => (
                    <li key={client.id} 
                        onMouseDown={() => selectClient(client)}
                        className="p-2 hover:bg-blue-100 cursor-pointer">
                      {client.first_name} {client.last_name}
                    </li>
                  ))
                ) : (
                  <li className="p-2 text-gray-500">No se encontraron clientes</li>
                )}
              </ul>
            )}
            {formErrors.client_id && (
              <p className="mt-1 text-xs text-red-600">{formErrors.client_id}</p>
            )}
          </div>

          {/* BUSCADOR DE USUARIOS (Solo Gerentes, Requerido) */}
          <HasPermission required="assign.visits">
             <div className="relative">
              <label htmlFor="user" className="block text-sm font-medium text-gray-700">
                Asignar a Vendedor <span className="text-red-500">*</span>
              </label>
              <input
                id="user"
                type="text"
                placeholder="Buscar vendedor..."
                value={userSearch}
                onChange={(e) => { 
                  setUserSearch(e.target.value); 
                  setUserDropdown(true);
                  if (e.target.value === '') {
                    setFormData(prev => ({ ...prev, user_id: null }));
                  }
                }}
                onFocus={() => setUserDropdown(true)}
                onBlur={() => setTimeout(() => setUserDropdown(false), 200)}
                className={getInputClasses('user_id')}
              />
              {userDropdown && (
                <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map(user => (
                      <li key={user.ID} 
                          onMouseDown={() => selectUser(user)}
                          className="p-2 hover:bg-blue-100 cursor-pointer">
                        {user.Nombre} ({user.rol})
                      </li>
                    ))
                  ) : (
                    <li className="p-2 text-gray-500">No se encontraron usuarios</li>
                  )}
                </ul>
              )}
              {formErrors.user_id && (
                <p className="mt-1 text-xs text-red-600">{formErrors.user_id}</p>
              )}
            </div>
          </HasPermission>
          
          {/* Asignado (para Vendedor) */}
          {!hasPermission('assign.visits') && (
             <div>
              <label className="block text-sm font-medium text-gray-700">
                Asignado a
              </label>
              <p className="mt-1 block w-full p-2 bg-gray-100 text-gray-700 rounded-md">
                {user.nombre} (Yo)
              </p>
            </div>
          )}

        </div>
        
        {/* --- CAMBIO: Fila de Fecha y Hora --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="visit_date" className="block text-sm font-medium text-gray-700">
              Fecha <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="visit_date"
              value={formData.visit_date}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, visit_date: e.target.value }));
                setFormErrors(prev => ({ ...prev, visit_date: null }));
              }}
              className={getInputClasses('visit_date')}
            />
            {formErrors.visit_date && (
              <p className="mt-1 text-xs text-red-600">{formErrors.visit_date}</p>
            )}
          </div>

          <div>
            <label htmlFor="visit_time" className="block text-sm font-medium text-gray-700">
              Hora <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              id="visit_time"
              value={formData.visit_time}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, visit_time: e.target.value }));
                setFormErrors(prev => ({ ...prev, visit_time: null }));
              }}
              className={getInputClasses('visit_time')}
            />
            {formErrors.visit_time && (
              <p className="mt-1 text-xs text-red-600">{formErrors.visit_time}</p>
            )}
          </div>
        </div>
        
        {/* Fila de Estado (solo editando) */}
        {isEditing && (
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Estado de la Visita
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md bg-white"
            >
              <option value="pending">Pendiente</option>
              <option value="completed">Completada</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </div>
        )}
        
        {/* Fila de Notas (Opcional) */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Notas
          </label>
          <textarea
            id="notes"
            rows="4"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            className={getInputClasses('notes')}
          ></textarea>
        </div>

        {/* Botones de Acción (con Cancelar) */}
        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button" 
            onClick={onClose}
            className="bg-white py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-green-600 text-white px-6 py-2 rounded-lg shadow-md hover:bg-green-700 disabled:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            {isSubmitting ? 'Guardando...' : (isEditing ? 'Actualizar Visita' : 'Agendar Visita')}
          </button>
        </div>
      </form>
    </div>
  );
};