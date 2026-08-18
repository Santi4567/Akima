// src/componentes/visitas.jsx

import { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeftIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  UserIcon,
  MapPinIcon,
  ClockIcon
} from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext.jsx';
import { HasPermission } from './HasPermission.jsx';
import { Notification } from './Notification.jsx';
import { PERMISSIONS } from '../config/permissions.js';

// URLs de la API
const API_URL = import.meta.env.VITE_API_URL;
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
  }, []);

  // Función para BUSCAR visitas
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
        setVisits([]);
        throw new Error(data.message || 'Error al buscar');
      }
    } catch (error) {
      setNotification({ type: 'error', message: error.message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cargar visitas al montar
  useEffect(() => {
    const canView = hasAnyPermission(PERMISSIONS.VISITS); 
    if (canView) {
      fetchVisits();
    } else {
      setIsLoading(false);
      setNotification({ type: 'error', message: 'No tienes permisos para ver visitas.' });
    }
  }, [fetchVisits, hasAnyPermission]);

  // useEffect para la búsqueda "en vivo" (debounced)
  useEffect(() => {
    if (view !== 'list') return;

    const timerId = setTimeout(() => {
      if (searchTerm === '') {
        fetchVisits(); 
      } else {
        searchVisits(searchTerm); 
      }
    }, 350); 

    return () => clearTimeout(timerId);
    
  }, [searchTerm, view, fetchVisits, searchVisits]);

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
          searchTerm ? searchVisits(searchTerm) : fetchVisits();
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
    setEditingVisit(null);
    setNotification({ type: '', message: '' });
    if (searchTerm !== '') {
      setSearchTerm(''); 
    }
  };

  const showFormView = (visitToEdit = null) => {
    setEditingVisit(visitToEdit);
    setView('form');
    setNotification({ type: '', message: '' });
  };

  if (view === 'form') {
    return (
      <VisitForm
        initialData={editingVisit}
        onClose={showListView}
        onSuccess={() => {
          showListView();
          setNotification({ type: 'success', message: 'Visita guardada exitosamente.' });
        }}
        onError={(message) => {
          setNotification({ type: 'error', message: message });
        }}
      />
    );
  }

  // Vista de Lista
  return (
    <div className="space-y-6 pb-10">
      <Notification
        type={notification.type}
        message={notification.message}
        onClose={() => setNotification({ type: '', message: '' })}
      />
      
      {/* CABECERA (Acento Índigo) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
        <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-xl border border-indigo-200 shadow-sm">
                    <CalendarDaysIcon className="h-7 w-7 text-indigo-600" />
                </div>
                Agenda de Visitas
            </h1>
            <p className="text-sm text-slate-500 mt-2 font-medium">Programa y da seguimiento a las citas comerciales</p>
        </div>
        <HasPermission required="add.visits">
          <button
            onClick={() => showFormView(null)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all active:translate-y-0"
          >
            <PlusIcon className="h-5 w-5" />
            Agendar Visita
          </button>
        </HasPermission>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* BUSCADOR */}
        <HasPermission any={PERMISSIONS.VISITS}>
            <div className="relative w-full md:max-w-md">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                </div>
                <input
                type="search"
                placeholder="Buscar por cliente, vendedor o notas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 pl-11 bg-white/80 backdrop-blur-sm border border-slate-300 text-slate-900 placeholder-slate-400 rounded-xl shadow-sm text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all outline-none"
                />
            </div>
        </HasPermission>

        {/* ACCIONES */}
        <div className="flex gap-3 flex-wrap">
            <HasPermission required="edit.visits">
            <button
                disabled={!selectedVisit}
                onClick={() => showFormView(selectedVisit)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 hover:border-amber-400 disabled:opacity-50 disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400 shadow-sm"
            >
                <PencilIcon className="h-4 w-4" /> Modificar
            </button>
            </HasPermission>
            <HasPermission required="delete.visits">
            <button
                disabled={!selectedVisit}
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100 hover:border-rose-400 disabled:opacity-50 disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400 shadow-sm"
            >
                <TrashIcon className="h-4 w-4" /> Eliminar
            </button>
            </HasPermission>
        </div>
      </div>

      {/* TABLA GLASSMORPHISM */}
      <div className="bg-white/90 backdrop-blur-xl shadow-xl shadow-slate-200/40 rounded-3xl border border-slate-200 overflow-hidden">
        <div className="overflow-y-auto max-h-[60vh]">
          <table className="min-w-full divide-y divide-slate-200 text-left">
            <thead className="bg-slate-50/90 backdrop-blur-md sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Cliente</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Vendedor Asignado</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Fecha Programada</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Estado</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Notas</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan="5" className="p-16 text-center text-slate-400 font-medium"><ArrowPathIcon className="h-8 w-8 animate-spin mx-auto mb-3 text-indigo-500" />Cargando visitas...</td></tr>
              ) : (
                visits.map((visit) => (
                  <tr
                    key={visit.id}
                    onClick={() => setSelectedVisit(visit)}
                    className={`cursor-pointer transition-all duration-200 border-l-4 ${selectedVisit?.id === visit.id ? 'bg-indigo-50/80 border-indigo-500' : 'border-transparent hover:bg-slate-50'}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                                selectedVisit?.id === visit.id ? 'bg-white border-indigo-200 text-indigo-600 shadow-sm' : 'bg-slate-100 border-slate-200 text-slate-400'
                            }`}>
                                <MapPinIcon className="h-5 w-5" />
                            </div>
                            <span className="font-extrabold text-slate-900 text-sm">{visit.client_name}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                            <UserIcon className="h-4 w-4 text-slate-400"/>
                            {visit.user_name}
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm font-bold text-slate-800">
                            <ClockIcon className="h-4 w-4 mr-1.5 text-indigo-400" />
                            {formatDateTime(visit.scheduled_for)}
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs font-extrabold rounded-full border capitalize ${
                        visit.status === 'completed' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                        visit.status === 'pending' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                        'bg-rose-100 text-rose-800 border-rose-300'
                      }`}>
                         <svg className={`mr-1.5 h-2 w-2 ${
                              visit.status === 'completed' ? 'text-emerald-500' : 
                              visit.status === 'pending' ? 'text-amber-500' : 'text-rose-500'
                          }`} fill="currentColor" viewBox="0 0 8 8">
                              <circle cx="4" cy="4" r="3" />
                          </svg>
                        {visit.status === 'completed' ? 'Completada' : visit.status === 'pending' ? 'Pendiente' : 'Cancelada'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-500 max-w-xs truncate" title={visit.notes}>{visit.notes || '-'}</td>
                  </tr>
                ))
              )}
              {!isLoading && visits.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-16 text-center text-slate-400 font-bold text-lg">
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

// --- Sub-componente del Formulario (con lógica original restaurada) ---

const VisitForm = ({ initialData, onClose, onSuccess, onError }) => {
  const { user, hasPermission } = useAuth(); 

  const [formData, setFormData] = useState({
    client_id: null,
    user_id: null,
    visit_date: '', 
    visit_time: '', 
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

  // --- LÓGICA DE FILTRADO (Restaurada) ---
  const filteredClients = clientSearch
    ? allClients.filter(client =>
        `${client.first_name} ${client.last_name}`.toLowerCase().includes(clientSearch.toLowerCase())
      )
    : allClients;

  const filteredUsers = userSearch
    ? allUsers.filter(usr =>
        usr.Nombre.toLowerCase().includes(userSearch.toLowerCase())
      )
    : allUsers;


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
              const usr = data.data.find(u => u.ID === initialData.user_id);
              if (usr) setUserSearch(usr.Nombre);
            }
          }
        });
    }
  }, [initialData, hasPermission]);


  useEffect(() => {
    if (isEditing) {
      let datePart = '';
      let timePart = '';

      if (initialData.scheduled_for) {
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
      setFormData(prev => ({ ...prev, user_id: user.id }));
      setUserSearch(user.nombre);
    }
  }, [initialData, isEditing, user]);

  const selectClient = (client) => {
    setFormData(prev => ({ ...prev, client_id: client.id }));
    setClientSearch(`${client.first_name} ${client.last_name}`);
    setClientDropdown(false);
    setFormErrors(prev => ({ ...prev, client_id: null }));
  };
  
  const selectUser = (usr) => {
    setFormData(prev => ({ ...prev, user_id: usr.ID }));
    setUserSearch(usr.Nombre);
    setUserDropdown(false);
    setFormErrors(prev => ({ ...prev, user_id: null }));
  };
  
  const validateForm = () => {
    const errors = {};
    if (!formData.client_id) errors.client_id = 'Debes seleccionar un cliente';
    if (!formData.user_id) errors.user_id = 'Debes asignar la visita a un vendedor';
    if (!formData.visit_date) errors.visit_date = 'La fecha es obligatoria';
    if (!formData.visit_time) errors.visit_time = 'La hora es obligatoria';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    // Reunir fecha y hora (Restaurado)
    const mysqlDateTime = `${formData.visit_date} ${formData.visit_time}:00`;
    
    const payload = {
      client_id: formData.client_id,
      scheduled_for: mysqlDateTime, 
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
  
  const getInputClasses = (fieldName) => {
    return `mt-1.5 block w-full p-3 bg-slate-50 border rounded-xl text-sm font-medium transition-all outline-none ${
      formErrors[fieldName]
      ? 'border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500'
      : 'border-slate-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500'
    }`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
        <button
          onClick={onClose} 
          className="p-2.5 text-slate-500 bg-white border border-slate-300 hover:bg-slate-50 hover:text-slate-800 hover:border-slate-400 rounded-xl transition-all shadow-sm"
          title="Regresar a la lista"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{formTitle}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 space-y-6">
        
        {/* Buscadores (Cliente y Vendedor) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* BUSCADOR DE CLIENTES */}
          <div className="relative">
            <label htmlFor="client" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              Cliente <span className="text-rose-500">*</span>
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
              <ul className="absolute z-20 w-full bg-white border border-slate-200 rounded-xl mt-2 max-h-60 overflow-y-auto shadow-xl">
                {filteredClients.length > 0 ? (
                  filteredClients.map(client => (
                    <li key={client.id} 
                        onMouseDown={() => selectClient(client)}
                        className="p-3 hover:bg-indigo-50 cursor-pointer text-sm font-bold text-slate-700 border-b border-slate-100 last:border-0">
                      {client.first_name} {client.last_name}
                    </li>
                  ))
                ) : (
                  <li className="p-3 text-slate-500 text-sm font-medium">No se encontraron clientes</li>
                )}
              </ul>
            )}
            {formErrors.client_id && (
              <p className="mt-1.5 text-xs font-bold text-rose-500">{formErrors.client_id}</p>
            )}
          </div>

          {/* BUSCADOR DE USUARIOS */}
          <HasPermission required="assign.visits">
             <div className="relative">
              <label htmlFor="user" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Asignar a Vendedor <span className="text-rose-500">*</span>
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
                <ul className="absolute z-20 w-full bg-white border border-slate-200 rounded-xl mt-2 max-h-60 overflow-y-auto shadow-xl">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map(usr => (
                      <li key={usr.ID} 
                          onMouseDown={() => selectUser(usr)}
                          className="p-3 hover:bg-indigo-50 cursor-pointer text-sm font-bold text-slate-700 border-b border-slate-100 last:border-0">
                        {usr.Nombre} ({usr.rol})
                      </li>
                    ))
                  ) : (
                    <li className="p-3 text-slate-500 text-sm font-medium">No se encontraron usuarios</li>
                  )}
                </ul>
              )}
              {formErrors.user_id && (
                <p className="mt-1.5 text-xs font-bold text-rose-500">{formErrors.user_id}</p>
              )}
            </div>
          </HasPermission>
          
          {/* Asignado (Si no tiene permisos de reasignar) */}
          {!hasPermission('assign.visits') && (
             <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Asignado a
              </label>
              <div className="mt-1.5 block w-full p-3 bg-slate-100 border border-slate-200 text-slate-600 font-bold rounded-xl">
                {user.nombre} (Yo)
              </div>
            </div>
          )}

        </div>
        
        {/* Fila de Fecha y Hora */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="visit_date" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              Fecha <span className="text-rose-500">*</span>
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
              <p className="mt-1.5 text-xs font-bold text-rose-500">{formErrors.visit_date}</p>
            )}
          </div>

          <div>
            <label htmlFor="visit_time" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              Hora <span className="text-rose-500">*</span>
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
              <p className="mt-1.5 text-xs font-bold text-rose-500">{formErrors.visit_time}</p>
            )}
          </div>
        </div>
        
        {/* Fila de Estado (solo editando) */}
        {isEditing && (
          <div>
            <label htmlFor="status" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              Estado de la Visita
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              className={`${getInputClasses('status')} bg-slate-50 font-bold`}
            >
              <option value="pending">Pendiente</option>
              <option value="completed">Completada</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </div>
        )}
        
        {/* Fila de Notas */}
        <div>
          <label htmlFor="notes" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            Notas u Objetivo de la cita
          </label>
          <textarea
            id="notes"
            rows="4"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            className={getInputClasses('notes')}
            placeholder="Ej: Presentación de nuevos productos, cotización presencial..."
          ></textarea>
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
          <button
            type="button" 
            onClick={onClose}
            className="px-6 py-3 border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 disabled:bg-slate-300 disabled:shadow-none transition-all"
          >
            {isSubmitting ? 'Procesando...' : (isEditing ? 'Actualizar Visita' : 'Agendar Visita')}
          </button>
        </div>
      </form>
    </div>
  );
};