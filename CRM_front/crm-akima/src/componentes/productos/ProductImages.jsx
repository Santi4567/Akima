import { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeftIcon, 
  MagnifyingGlassIcon, 
  CloudArrowUpIcon, 
  PhotoIcon, 
  TrashIcon,
  StarIcon // Para indicar la portada
} from '@heroicons/react/24/solid';
import imageCompression from 'browser-image-compression';

import { ProductHubNav } from './ProductHubNav';
import { useAuth } from '../../context/AuthContext';
import { HasPermission } from '../HasPermission'; 
import { Notification } from '../Notification'; 

const API_URL = import.meta.env.VITE_API_URL;
const PRODUCTS_ENDPOINT = `${API_URL}/api/products`;

export const ProductImages = ({ initialProduct, onClose, onTabChange }) => {
  // --- Estados ---
  const [selectedProduct, setSelectedProduct] = useState(initialProduct || null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  const [images, setImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // Estado para el input de orden de imagenes secundarias
  const [secondaryOrder, setSecondaryOrder] = useState(0);
  
  // Notificaciones locales
  const [notification, setNotification] = useState({ type: '', message: '' });

  const { hasPermission } = useAuth();

  // --- 1. NAVEGACIÓN DEL HUB ---
  const handleNavChange = (tab) => {
    if (onTabChange) {
        onTabChange(tab); // Si el padre nos dio la función, cambiamos a cualquier pestaña
    } else {
        if (tab === 'list') onClose(); // Fallback de seguridad
    }
  };

  // --- 2. BUSCADOR DE PRODUCTOS ---
  useEffect(() => {
    if (!searchTerm) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${PRODUCTS_ENDPOINT}/search?q=${searchTerm}`, { credentials: 'include' });
        const data = await res.json();
        if (data.success) setSearchResults(data.data);
      } catch (e) { console.error(e); }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // --- 3. CARGAR IMÁGENES ---
  const fetchImages = useCallback(async () => {
    if (!selectedProduct) return;
    if (!hasPermission('view.products')) {
        setNotification({ type: 'error', message: 'No tienes permiso para ver imágenes.' });
        return;
    }

    try {
      const res = await fetch(`${PRODUCTS_ENDPOINT}/${selectedProduct.id}/images`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setImages(data.data);
        const maxOrder = data.data.reduce((max, img) => (img.display_order > max ? img.display_order : max), 0);
        setSecondaryOrder(maxOrder + 1);
      }
    } catch (error) {
      console.error("Error cargando imágenes", error);
    }
  }, [selectedProduct, hasPermission]);

  useEffect(() => {
    if (selectedProduct) {
      fetchImages();
    } else {
      setImages([]);
    }
  }, [selectedProduct, fetchImages]);


  // --- 4. SUBIR IMAGEN ---
  const handleUpload = async (file, isPrimary, displayOrder) => {
    if (!file || !selectedProduct) return;
    setIsUploading(true);
    // Limpiamos notificación previa para que si sube otra se note el cambio
    setNotification({ type: '', message: '' }); 

    try {
      const options = { maxSizeMB: 1, maxWidthOrHeight: 1200, useWebWorker: true, fileType: 'image/webp' };
      const compressedFile = await imageCompression(file, options);
      
      const formData = new FormData();
      const newFileName = file.name.split('.')[0] + '.webp';
      formData.append('image', compressedFile, newFileName);
      formData.append('is_primary', isPrimary);
      formData.append('display_order', displayOrder);

      const res = await fetch(`${PRODUCTS_ENDPOINT}/${selectedProduct.id}/images`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      
      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: '¡Imagen subida correctamente!' });
        fetchImages(); 
      } else {
        setNotification({ type: 'error', message: data.message });
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Error de conexión al subir imagen' });
    } finally {
      setIsUploading(false);
    }
  };

  // --- 5. ELIMINAR IMAGEN ---
  const handleDeleteImage = async (imageId) => {
    if(!window.confirm("¿Eliminar esta imagen?")) return;

    try {
        const res = await fetch(`${API_URL}/api/products/images/${imageId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        const data = await res.json();
        if(data.success) {
            setNotification({ type: 'success', message: 'Imagen eliminada' });
            fetchImages();
        } else {
            setNotification({ type: 'error', message: data.message });
        }
    } catch (error) {
        setNotification({ type: 'error', message: error.message });
    }
  };

  const handleResetSelection = () => {
    setSelectedProduct(null);
    setSearchTerm('');
    setImages([]);
    setNotification({ type: '', message: '' });
  };

  const primaryImage = images.find(img => img.is_primary === 1 || img.is_primary === true);
  const secondaryImages = images.filter(img => img.is_primary === 0 || img.is_primary === false);

  // --- RENDER ---
  return (
    <div className=" mx-auto space-y-6 pb-10">
      
      <Notification 
        type={notification.type} 
        message={notification.message} 
        onClose={() => setNotification({ type: '', message: '' })} 
      />

      <ProductHubNav activeTab="images" onTabChange={handleNavChange} />

      <div className="flex items-center gap-4">
        <button onClick={onClose} className="p-2.5 text-slate-500 bg-white border border-slate-300 hover:bg-slate-50 hover:text-slate-800 hover:border-slate-400 rounded-xl transition-all shadow-sm">
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Galería de Productos</h1>
      </div>

      {/* --- ÁREA DE SELECCIÓN DE PRODUCTO --- */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-300">
        
        {/* CASO 1: NO HAY PRODUCTO SELECCIONADO (Muestra Buscador) */}
        {!selectedProduct && (
            <div className="max-w-2xl">
                <label className="block text-sm font-bold text-slate-700 mb-2">Seleccionar Producto a Gestionar</label>
                <div className="relative">
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Buscar por nombre o SKU..."
                            className="w-full pl-11 p-3 bg-white border border-slate-300 rounded-xl shadow-sm text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            onFocus={() => setSearchResults([])} 
                        />
                    </div>
                    {/* Lista de resultados */}
                    {searchResults.length > 0 && (
                        <ul className="absolute z-20 w-full bg-white border border-slate-200 mt-2 max-h-60 overflow-y-auto shadow-xl rounded-xl">
                            {searchResults.map(prod => (
                                <li key={prod.id} 
                                    onClick={() => { setSelectedProduct(prod); setSearchTerm(''); setSearchResults([]); }}
                                    className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 flex justify-between items-center transition-colors"
                                >
                                    <span className="font-bold text-slate-800 text-sm">{prod.name}</span>
                                    <span className="text-slate-400 text-xs font-mono font-bold bg-slate-100 px-2 py-1 rounded-md">{prod.sku}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        )}

        {/* CASO 2: PRODUCTO SELECCIONADO (Muestra Info + Botón Cancelar) */}
        {selectedProduct && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                     <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Editando galería de:</p>
                     <div className="flex items-center gap-4 bg-slate-50 px-5 py-3 rounded-xl border border-slate-200">
                        <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                            <PhotoIcon className="h-6 w-6 text-emerald-600"/>
                        </div>
                        <div>
                            <p className="font-extrabold text-slate-900 text-lg leading-tight">{selectedProduct.sku}</p>
                            <p className="text-slate-500 text-sm font-medium">{selectedProduct.name}</p>
                        </div>
                    </div>
                </div>
                
                <button 
                    onClick={handleResetSelection}
                    className="whitespace-nowrap px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm transition-all"
                >
                    Cambiar Producto
                </button>
            </div>
        )}
      </div>

      {/* --- CONTENIDO PRINCIPAL (Solo si hay producto y permiso) --- */}
      {selectedProduct && hasPermission('view.products') ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* === PORTADA === */}
            <div className="lg:col-span-1 space-y-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-300">
                    <h3 className="text-lg font-extrabold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                        <StarIcon className="h-5 w-5 text-amber-500" /> Portada Principal
                    </h3>
                    
                    {primaryImage ? (
                        <div className="relative group">
                            <img 
                                src={`${API_URL}${primaryImage.image_path}`} 
                                alt="Portada" 
                                className="w-full h-72 object-cover rounded-xl border border-slate-200 shadow-sm"
                            />
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <HasPermission required="edit.products">
                                    <button 
                                        onClick={() => handleDeleteImage(primaryImage.id)}
                                        className="bg-rose-500/90 backdrop-blur-sm text-white p-2 rounded-lg shadow-md hover:bg-rose-600 transition-colors"
                                        title="Eliminar portada"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </HasPermission>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
                            <PhotoIcon className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 text-sm mb-4 font-medium">Sin portada asignada</p>
                            
                            <HasPermission required="edit.products">
                                <label className="cursor-pointer inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 text-sm font-bold shadow-md shadow-emerald-500/20 transition-all">
                                    <CloudArrowUpIcon className="h-4 w-4" />
                                    {isUploading ? 'Subiendo...' : 'Subir Portada'}
                                    <input 
                                        type="file" className="hidden" accept="image/*"
                                        disabled={isUploading}
                                        onChange={(e) => handleUpload(e.target.files[0], true, 0)} 
                                    />
                                </label>
                            </HasPermission>
                        </div>
                    )}
                </div>
            </div>

            {/* === GALERÍA === */}
            <div className="lg:col-span-2 space-y-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-300">
                    <h3 className="text-lg font-extrabold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                        <PhotoIcon className="h-5 w-5 text-sky-500" /> Galería Secundaria
                    </h3>

                    {secondaryImages.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                            {secondaryImages
                                .sort((a, b) => a.display_order - b.display_order)
                                .map(img => (
                                <div key={img.id} className="relative group border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-slate-50">
                                    <img 
                                        src={`${API_URL}${img.image_path}`} 
                                        alt={`Img ${img.display_order}`} 
                                        className="w-full h-36 object-cover"
                                    />
                                    <div className="absolute bottom-0 left-0 bg-slate-900/70 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-tr-lg">
                                        # {img.display_order}
                                    </div>
                                    
                                    <HasPermission required="edit.products">
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleDeleteImage(img.id)}
                                                className="bg-rose-500/90 backdrop-blur-sm text-white p-1.5 rounded-lg shadow-sm hover:bg-rose-600 transition-colors"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </HasPermission>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-200 mb-8">
                            <p className="text-slate-500 font-medium text-sm">No hay imágenes secundarias en esta galería.</p>
                        </div>
                    )}

                    <HasPermission required="edit.products">
                        <div className="border-t border-slate-100 pt-5">
                            <h4 className="text-sm font-extrabold text-slate-700 mb-3">Añadir Nueva Imagen</h4>
                            <div className="flex flex-col sm:flex-row gap-4 items-stretch">
                                
                                <div className="w-full sm:w-28 shrink-0">
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Orden (#)</label>
                                    <input 
                                        type="number" 
                                        min="0"
                                        value={secondaryOrder}
                                        onChange={(e) => setSecondaryOrder(Number(e.target.value))}
                                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none text-center"
                                    />
                                </div>

                                <div className="flex-grow">
                                    <label className="flex items-center justify-center h-full min-h-[46px] px-6 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <CloudArrowUpIcon className="h-5 w-5 text-slate-400" />
                                            <span className="font-bold text-sky-600 hover:text-sky-700">
                                                {isUploading ? 'Procesando...' : 'Seleccionar Imagen'}
                                            </span>
                                        </div>
                                        <input 
                                            type="file" 
                                            className="hidden" 
                                            accept="image/*"
                                            disabled={isUploading}
                                            onChange={(e) => {
                                                handleUpload(e.target.files[0], false, secondaryOrder);
                                                e.target.value = null; 
                                            }}
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </HasPermission>
                </div>
            </div>
        </div>
      ) : (
        // Estado Vacío (Initial State)
        <div className="text-center py-20 bg-white shadow-sm rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center">
            {selectedProduct && !hasPermission('view.products') ? (
                <div className="bg-rose-50 p-4 rounded-xl border border-rose-200">
                    <p className="text-rose-600 font-bold">Acceso restringido: No tienes permisos para ver las imágenes.</p>
                </div>
            ) : (
                <div className="max-w-sm">
                    <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200">
                        <PhotoIcon className="h-10 w-10 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-extrabold text-slate-800 mb-2">Ningún producto seleccionado</h3>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed">Usa el buscador de arriba para encontrar un producto y comenzar a gestionar su galería de imágenes.</p>
                </div>
            )}
        </div>
      )}
    </div>
  );
};