import { useState, useEffect } from 'react';
import { BuildingOfficeIcon, PhotoIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { Notification } from '../Notification';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const CompanySettings = () => {
  const [formData, setFormData] = useState({
    name: '', legal_name: '', tax_id: '',
    email: '', phone: '', address: '', website: ''
  });
  const [logoPreview, setLogoPreview] = useState(null); // URL para mostrar
  const [logoFile, setLogoFile] = useState(null); // Archivo para subir
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });

  // Cargar datos actuales
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await fetch(`${API_URL}/api/company`, { credentials: 'include' });
        const data = await res.json();
        if (data.success && data.data) {
          setFormData({
            name: data.data.name || '',
            legal_name: data.data.legal_name || '',
            tax_id: data.data.tax_id || '',
            email: data.data.email || '',
            phone: data.data.phone || '',
            address: data.data.address || '',
            website: data.data.website || ''
          });
          // Si el backend devuelve la ruta del logo
          if (data.data.logo_path) {
             setLogoPreview(`${API_URL}${data.data.logo_path}`);
          }
        }
      } catch (err) {
        console.error("Error cargando empresa", err);
      }
    };
    fetchCompany();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file)); // Previsualización local inmediata
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setNotification({ type: '', message: '' });

    try {
      const dataToSend = new FormData();
      // Agregamos campos de texto
      Object.keys(formData).forEach(key => {
        dataToSend.append(key, formData[key]);
      });
      // Agregamos logo solo si cambió
      if (logoFile) {
        dataToSend.append('logo', logoFile);
      }

      const res = await fetch(`${API_URL}/api/company`, {
        method: 'PUT',
        credentials: 'include', // Importante
        body: dataToSend // No poner Content-Type, el navegador lo pone automático con el boundary
      });

      const data = await res.json();

      if (data.success) {
        setNotification({ type: 'success', message: 'Información de la empresa actualizada.' });
      } else {
        setNotification({ type: 'error', message: data.message || 'Error al actualizar.' });
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'Error de conexión.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <Notification type={notification.type} message={notification.message} onClose={() => setNotification({type:'', message:''})} />
      
      <div className="flex items-center gap-2 mb-6 border-b pb-2">
        <BuildingOfficeIcon className="h-6 w-6 text-gray-600"/>
        <h2 className="text-xl font-bold text-gray-800">Configuración de Empresa</h2>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* LOGO UPLOAD */}
        <div className="md:col-span-2 flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
            {logoPreview ? (
                <img src={logoPreview} alt="Logo Empresa" className="h-32 object-contain mb-4" />
            ) : (
                <PhotoIcon className="h-16 w-16 text-gray-300 mb-2" />
            )}
            <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm">
                Cambiar Logo
                <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
            </label>
        </div>

        {/* CAMPOS */}
        <div>
            <label className="block text-sm font-medium text-gray-700">Nombre Comercial *</label>
            <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full p-2 border rounded mt-1"/>
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700">Razón Social</label>
            <input type="text" name="legal_name" value={formData.legal_name} onChange={handleChange} className="w-full p-2 border rounded mt-1"/>
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700">RFC / Tax ID</label>
            <input type="text" name="tax_id" value={formData.tax_id} onChange={handleChange} className="w-full p-2 border rounded mt-1"/>
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700">Teléfono</label>
            <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full p-2 border rounded mt-1"/>
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700">Email Contacto</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-2 border rounded mt-1"/>
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700">Sitio Web</label>
            <input type="url" name="website" value={formData.website} onChange={handleChange} className="w-full p-2 border rounded mt-1"/>
        </div>
        <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Dirección Fiscal</label>
            <textarea name="address" rows="2" value={formData.address} onChange={handleChange} className="w-full p-2 border rounded mt-1"></textarea>
        </div>

        <div className="md:col-span-2 text-right">
            <button type="submit" disabled={loading} className="bg-green-600 text-white px-6 py-2 rounded shadow hover:bg-green-700 flex items-center gap-2 ml-auto disabled:opacity-50">
                {loading ? 'Guardando...' : <><ArrowPathIcon className="h-5 w-5"/> Actualizar Datos</>}
            </button>
        </div>
      </form>
    </div>
  );
};