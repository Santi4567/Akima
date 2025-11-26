import { useState, useEffect } from 'react';
import { ArrowLeftIcon, KeyIcon, XMarkIcon } from '@heroicons/react/24/solid'; // Agregué iconos útiles
import { Notification } from '../Notification';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const UserForm = ({ initialData, onClose, onSuccess }) => {
  const isEditing = !!initialData;
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    Nombre: '',
    Correo: '',
    Passwd: '',
    rol: '',
    Estado: true, // CAMBIO: Default true (booleano)
    phone: '',
    address: '',
    sex: 'M'
  });

  // Estado para mostrar/ocultar el input de contraseña en edición
  // Si es "Nuevo Usuario" (!isEditing), siempre se muestra.
  // Si es "Editar", empieza oculto (false).
  const [showPasswordInput, setShowPasswordInput] = useState(!isEditing);

  const [roles, setRoles] = useState([]); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });

  // Cargar Roles disponibles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await fetch(`${API_URL}/api/users/roles-list`, {
          method: 'GET',
          credentials: 'include' // ¡Crucial para que pase el Auth!
        });
        const data = await res.json();
        
        if (data.success) {
          // Tu API devuelve: { data: ["admin", "gerente", ...] }
          // React lo mapeará perfectamente en el <select>
          setRoles(data.data); 
        } else {
          console.error("Error cargando roles:", data.message);
          // Fallback de seguridad por si falla el endpoint
          setRoles(['admin', 'gerente', 'vendedor']); 
        }
      } catch (error) {
        console.error("Error de red al cargar roles");
      }
    };

    fetchRoles();
  }, []);

  // Inicializar datos si es edición
  useEffect(() => {
    if (isEditing) {
      setFormData({
        Nombre: initialData.Nombre || '',
        Correo: initialData.Correo || '',
        Passwd: '', 
        rol: initialData.rol || '',
        // CAMBIO: Aseguramos que sea booleano al cargar (tu API a veces devuelve 1/0)
        Estado: initialData.Estado === 1 || initialData.Estado === true,
        phone: initialData.phone || '',
        address: initialData.address || '',
        sex: initialData.sex || 'M'
      });
      // Al editar, reseteamos para que el input de contraseña esté oculto al inicio
      setShowPasswordInput(false);
    }
  }, [initialData, isEditing]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
        ...prev,
        // CAMBIO: Si es checkbox, usa 'checked' (true/false) directamente
        [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setNotification({ type: '', message: '' });

    // Preparar payload
    const payload = { ...formData };
    
    // Lógica de contraseña:
    // 1. Si estamos editando Y NO activó el cambio de contraseña, borramos el campo
    // 2. Si activó el cambio pero lo dejó vacío, también lo borramos (o podrías validar que sea requerido si lo activó)
    if (isEditing && (!showPasswordInput || !payload.Passwd)) {
        delete payload.Passwd;
    }

    const url = isEditing 
        ? `${API_URL}/api/users/${initialData.ID}`
        : `${API_URL}/api/users`;
    
    const method = isEditing ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (data.success) {
            setNotification({ type: 'success', message: data.message });
            setTimeout(() => onSuccess(), 1500);
        } else {
            setNotification({ type: 'error', message: data.message || data.error });
        }
    } catch (error) {
        setNotification({ type: 'error', message: 'Error de conexión' });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Notification type={notification.type} message={notification.message} onClose={() => setNotification({type:'', message:''})} />
      
      <div className="flex items-center gap-4 border-b pb-4">
        <button onClick={onClose} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
          <ArrowLeftIcon className="h-6 w-6" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Nombre */}
        <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Nombre Completo *</label>
            <input type="text" name="Nombre" required
                value={formData.Nombre} onChange={handleChange}
                className="mt-1 block w-full p-2 border rounded-md" 
            />
        </div>

        {/* Correo */}
        <div>
            <label className="block text-sm font-medium text-gray-700">Correo Electrónico *</label>
            <input type="email" name="Correo" required disabled={isEditing} 
                value={formData.Correo} onChange={handleChange}
                className="mt-1 block w-full p-2 border rounded-md disabled:bg-gray-100" 
            />
        </div>

        {/* Contraseña (Lógica condicional) */}
        <div>
            <label className="block text-sm font-medium text-gray-700">
                Contraseña {showPasswordInput && '*'}
            </label>
            
            {!showPasswordInput ? (
                // MODO EDITAR: Botón para mostrar el input
                <button 
                    type="button"
                    onClick={() => { setShowPasswordInput(true); setFormData(prev => ({...prev, Passwd: ''})); }}
                    className="mt-1 w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                    <KeyIcon className="h-4 w-4 text-gray-500" />
                    Cambiar contraseña
                </button>
            ) : (
                // INPUT VISIBLE (Creando o Editando tras click)
                <div className="relative mt-1">
                    <input 
                        type="password" 
                        name="Passwd" 
                        required={showPasswordInput} // Es requerido si está visible
                        value={formData.Passwd} 
                        onChange={handleChange}
                        placeholder={isEditing ? "Nueva contraseña" : ""}
                        className="block w-full p-2 border rounded-md pr-10" 
                    />
                    {/* Botón Cancelar (Solo si estamos editando, para poder arrepentirse) */}
                    {isEditing && (
                        <button 
                            type="button"
                            onClick={() => { setShowPasswordInput(false); setFormData(prev => ({...prev, Passwd: ''})); }}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                            title="Cancelar cambio de contraseña"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    )}
                </div>
            )}
        </div>

        {/* Rol */}
        <div>
            <label className="block text-sm font-medium text-gray-700">Rol *</label>
            <select name="rol" required value={formData.rol} onChange={handleChange}
                className="mt-1 block w-full p-2 border rounded-md bg-white">
                <option value="">Seleccionar...</option>
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
        </div>

        {/* Teléfono */}
        <div>
            <label className="block text-sm font-medium text-gray-700">Teléfono</label>
            <input type="tel" name="phone"
                value={formData.phone} onChange={handleChange}
                className="mt-1 block w-full p-2 border rounded-md" 
            />
        </div>

        {/* Dirección */}
        <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Dirección</label>
            <input type="text" name="address"
                value={formData.address} onChange={handleChange}
                className="mt-1 block w-full p-2 border rounded-md" 
            />
        </div>

        {/* Sexo y Estado */}
        <div className="flex gap-6 items-center">
            <div>
                <label className="block text-sm font-medium text-gray-700">Sexo</label>
                <select name="sex" value={formData.sex} onChange={handleChange}
                    className="mt-1 p-2 border rounded-md bg-white">
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                </select>
            </div>

            <div className="flex items-center h-full pt-6">
                <label className="inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        name="Estado"
                        // CAMBIO: Ahora checked depende de un valor booleano true/false
                        checked={formData.Estado === true}
                        onChange={handleChange}
                        className="form-checkbox h-5 w-5 text-green-600" 
                    />
                    <span className="ml-2 text-gray-700">Cuenta Activa</span>
                </label>
            </div>
        </div>

        {/* Botones */}
        <div className="md:col-span-2 flex justify-end gap-4 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300">
                {isSubmitting ? 'Guardando...' : 'Guardar Usuario'}
            </button>
        </div>

      </form>
    </div>
  );
};