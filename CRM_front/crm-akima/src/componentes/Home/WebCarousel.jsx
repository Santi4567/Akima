import { useState, useEffect, useCallback } from 'react';
import { 
  PhotoIcon, 
  PlusIcon, 
  ArrowPathIcon, 
  LinkIcon, 
  ListBulletIcon,
  TagIcon,
  CloudArrowUpIcon,
  TrashIcon // Agregado para el botón eliminar
} from '@heroicons/react/24/solid';
import { Notification } from '../Notification';

const API_URL = import.meta.env.VITE_API_URL;

export const WebCarousel = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });

  // Estado del formulario de subida
  const [newBanner, setNewBanner] = useState({
    title: '',
    link_url: '',
    display_order: 0,
    file: null
  });
  const [previewUrl, setPreviewUrl] = useState(null);

  // --- 1. CARGAR BANNERS (GET) ---
  const fetchBanners = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/content/banners`, { credentials: 'include' });
      const data = await res.json();
      
      if (data.success) {
        const sorted = data.data.sort((a, b) => a.display_order - b.display_order);
        setBanners(sorted);
        
        // Sugerir el siguiente orden
        if (sorted.length > 0) {
            const nextOrder = sorted[sorted.length - 1].display_order + 1;
            setNewBanner(prev => ({ ...prev, display_order: nextOrder }));
        }
      } else {
        setNotification({ type: 'error', message: 'Error al cargar banners.' });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  // --- 2. MANEJAR EL FORMULARIO ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewBanner(prev => ({ ...prev, file: file }));
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewBanner(prev => ({ ...prev, [name]: value }));
  };

  // --- 3. SUBIR BANNER (POST) ---
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!newBanner.file) {
        setNotification({ type: 'error', message: 'Debes seleccionar una imagen.' });
        return;
    }

    setIsUploading(true);
    setNotification({ type: '', message: '' });

    try {
      const formData = new FormData();
      formData.append('image', newBanner.file);
      formData.append('title', newBanner.title);
      formData.append('link_url', newBanner.link_url);
      formData.append('display_order', newBanner.display_order);

      const res = await fetch(`${API_URL}/api/content/banners`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await res.json();

      if (data.success) {
        setNotification({ type: 'success', message: 'Banner subido exitosamente.' });
        setNewBanner({ title: '', link_url: '', display_order: banners.length + 1, file: null });
        setPreviewUrl(null);
        fetchBanners();
      } else {
        setNotification({ type: 'error', message: data.message || 'Error al subir.' });
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Error de conexión.' });
    } finally {
      setIsUploading(false);
    }
  };

  // --- 4. ELIMINAR BANNER (DELETE) ---
  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este banner?')) return;

    try {
      const res = await fetch(`${API_URL}/api/content/banners/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const data = await res.json();

      if (data.success) {
        setNotification({ type: 'success', message: 'Banner eliminado correctamente.' });
        fetchBanners(); // Recargar lista
      } else {
        setNotification({ type: 'error', message: data.message || 'Error al eliminar.' });
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Error de conexión al eliminar.' });
    }
  };

  return (
    <div className="space-y-8">
      <Notification type={notification.type} message={notification.message} onClose={() => setNotification({type:'', message:''})} />

      {/* --- SECCIÓN 1: FORMULARIO DE SUBIDA --- */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
            <CloudArrowUpIcon className="h-6 w-6 text-purple-600"/> Subir Nuevo Banner
        </h2>
        
        <form onSubmit={handleUpload} className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/3">
                <label className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${previewUrl ? 'border-purple-300 bg-purple-50' : 'border-gray-300 hover:bg-gray-50'}`}>
                    {previewUrl ? (
                        <img src={previewUrl} alt="Preview" className="h-full w-full object-cover rounded-lg" />
                    ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <PhotoIcon className="w-10 h-10 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500"><span className="font-semibold">Clic para subir</span> imagen</p>
                            <p className="text-xs text-gray-500">PNG, JPG (Recomendado 1920x600)</p>
                        </div>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
            </div>

            <div className="w-full md:w-2/3 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1 flex items-center gap-1">
                            <TagIcon className="h-3 w-3"/> Título (Opcional)
                        </label>
                        <input 
                            type="text" name="title"
                            placeholder="Ej: Oferta de Verano"
                            className="w-full p-2 border rounded-md focus:ring-purple-500 focus:border-purple-500"
                            value={newBanner.title} onChange={handleInputChange}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1 flex items-center gap-1">
                            <ListBulletIcon className="h-3 w-3"/> Orden
                        </label>
                        <input 
                            type="number" name="display_order"
                            className="w-full p-2 border rounded-md focus:ring-purple-500 focus:border-purple-500"
                            value={newBanner.display_order} onChange={handleInputChange}
                        />
                    </div>
                </div>
                
                <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1 flex items-center gap-1">
                        <LinkIcon className="h-3 w-3"/> Enlace al hacer clic (Opcional)
                    </label>
                    <input 
                        type="text" name="link_url"
                        placeholder="Ej: /productos/categoria/teclados"
                        className="w-full p-2 border rounded-md focus:ring-purple-500 focus:border-purple-500"
                        value={newBanner.link_url} onChange={handleInputChange}
                    />
                </div>

                <div className="text-right pt-2">
                    <button 
                        type="submit" 
                        disabled={isUploading} 
                        className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 disabled:bg-gray-300 shadow-sm flex items-center gap-2 ml-auto"
                    >
                        {isUploading ? <ArrowPathIcon className="h-5 w-5 animate-spin"/> : <PlusIcon className="h-5 w-5"/>}
                        {isUploading ? 'Subiendo...' : 'Publicar Banner'}
                    </button>
                </div>
            </div>
        </form>
      </div>

      {/* --- SECCIÓN 2: LISTA DE BANNERS --- */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Banners Activos ({banners.length})</h3>
        
        {loading ? (
            <p className="text-center text-gray-500 py-8">Cargando contenido...</p>
        ) : banners.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-lg">
                <PhotoIcon className="h-12 w-12 text-gray-300 mx-auto mb-2"/>
                <p className="text-gray-500">No hay banners publicados.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {banners.map((banner) => (
                    <div key={banner.id} className="relative group bg-gray-50 rounded-lg overflow-hidden border shadow-sm transition-all hover:shadow-md">
                        {/* Imagen */}
                        <div className="aspect-[3/1] bg-gray-200 relative">
                            <img 
                                src={`${API_URL}${banner.image_path}`} 
                                alt={banner.title || "Banner"} 
                                className="w-full h-full object-cover"
                            />
                            {/* Overlay de acciones (Eliminar) */}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <button 
                                    onClick={() => handleDelete(banner.id)}
                                    className="bg-red-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-red-700 flex items-center gap-2 font-medium"
                                >
                                    <TrashIcon className="h-5 w-5" /> Eliminar
                                </button>
                            </div>
                        </div>
                        
                        {/* Info */}
                        <div className="p-3 flex justify-between items-center bg-white">
                            <div>
                                <p className="font-bold text-gray-800 text-sm">{banner.title || "Sin título"}</p>
                                <p className="text-xs text-gray-500 truncate max-w-[200px]">
                                    Link: {banner.link_url || "Sin enlace"}
                                </p>
                            </div>
                            <div className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded-full border border-purple-200">
                                Orden: {banner.display_order}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};