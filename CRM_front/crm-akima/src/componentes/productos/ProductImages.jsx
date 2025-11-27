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

export const ProductImages = ({ initialProduct, onClose }) => {
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
  const handleTabChange = (tab) => {
    if (tab === 'list') onClose();
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
        // MENSAJE DE ÉXITO VISIBLE SIEMPRE
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

  // Función para resetear la selección (Botón Cancelar)
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
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      
      {/* Notificación visible siempre arriba */}
      <Notification 
        type={notification.type} 
        message={notification.message} 
        onClose={() => setNotification({ type: '', message: '' })} 
      />

      <ProductHubNav activeTab="images" onTabChange={handleTabChange} />

      <div className="flex items-center gap-4">
        <button onClick={onClose} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
          <ArrowLeftIcon className="h-6 w-6" />
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Galería de Productos</h1>
      </div>

      {/* --- ÁREA DE SELECCIÓN DE PRODUCTO --- */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        
        {/* CASO 1: NO HAY PRODUCTO SELECCIONADO (Muestra Buscador) */}
        {!selectedProduct && (
            <>
                <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Producto</label>
                <div className="relative">
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Buscar por nombre o SKU..."
                            className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            onFocus={() => setSearchResults([])} 
                        />
                    </div>
                    {/* Lista de resultados */}
                    {searchResults.length > 0 && (
                        <ul className="absolute z-10 w-full bg-white border mt-1 max-h-60 overflow-y-auto shadow-xl rounded-md">
                            {searchResults.map(prod => (
                                <li key={prod.id} 
                                    onClick={() => { setSelectedProduct(prod); setSearchTerm(''); setSearchResults([]); }}
                                    className="p-3 hover:bg-blue-50 cursor-pointer border-b flex justify-between"
                                >
                                    <span className="font-medium">{prod.name}</span>
                                    <span className="text-gray-500 text-sm">{prod.sku}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </>
        )}

        {/* CASO 2: PRODUCTO SELECCIONADO (Muestra Info + Botón Cancelar) */}
        {selectedProduct && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                     <p className="text-sm text-gray-500 mb-1">Editando imágenes de:</p>
                     <div className="flex items-center gap-3 bg-green-100 px-4 py-3 rounded-md border border-green-300">
                        <PhotoIcon className="h-6 w-6 text-green-700"/>
                        <div>
                            <p className="font-bold text-green-900 text-lg">{selectedProduct.sku}</p>
                            <p className="text-green-800 text-sm">{selectedProduct.name}</p>
                        </div>
                    </div>
                </div>
                
                {/* Botón "Cambiar" fuera del recuadro verde */}
                <button 
                    onClick={handleResetSelection}
                    className="whitespace-nowrap px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors"
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
                <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <StarIcon className="h-5 w-5 text-yellow-500" /> Portada
                    </h3>
                    
                    {primaryImage ? (
                        <div className="relative group">
                            <img 
                                src={`${API_URL}${primaryImage.image_path}`} 
                                alt="Portada" 
                                className="w-full h-64 object-cover rounded-md border"
                            />
                            <div className="absolute top-2 right-2">
                                <HasPermission required="edit.products">
                                    <button 
                                        onClick={() => handleDeleteImage(primaryImage.id)}
                                        className="bg-red-600 text-white p-2 rounded-full shadow hover:bg-red-700 transition"
                                        title="Eliminar portada"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </HasPermission>
                            </div>
                            <p className="mt-2 text-sm text-center text-gray-500 font-medium">Imagen Principal</p>
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-gray-50 rounded-md border-2 border-dashed border-gray-300">
                            <PhotoIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-500 text-sm mb-4">Sin portada asignada</p>
                            
                            <HasPermission required="edit.products">
                                <label className="cursor-pointer inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm">
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
                <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <PhotoIcon className="h-5 w-5 text-blue-500" /> Galería
                    </h3>

                    {secondaryImages.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                            {secondaryImages
                                .sort((a, b) => a.display_order - b.display_order)
                                .map(img => (
                                <div key={img.id} className="relative group border rounded-md overflow-hidden">
                                    <img 
                                        src={`${API_URL}${img.image_path}`} 
                                        alt={`Img ${img.display_order}`} 
                                        className="w-full h-32 object-cover"
                                    />
                                    <div className="absolute bottom-0 left-0 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-tr-md">
                                        #{img.display_order}
                                    </div>
                                    
                                    <HasPermission required="edit.products">
                                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleDeleteImage(img.id)}
                                                className="bg-red-600 text-white p-1.5 rounded-full shadow hover:bg-red-700"
                                            >
                                                <TrashIcon className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </HasPermission>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 italic mb-6">No hay imágenes secundarias.</p>
                    )}

                    <HasPermission required="edit.products">
                        <div className="border-t pt-4">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">Agregar a Galería</h4>
                            <div className="flex flex-col sm:flex-row gap-4 items-end">
                                
                                <div className="w-full sm:w-32">
                                    <label className="block text-xs text-gray-500 mb-1">Orden (Num)</label>
                                    <input 
                                        type="number" 
                                        min="0"
                                        value={secondaryOrder}
                                        onChange={(e) => setSecondaryOrder(Number(e.target.value))}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div className="flex-grow w-full">
                                    <label className="flex justify-center px-6 pt-2 pb-2 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:bg-gray-50">
                                        <div className="space-y-1 text-center">
                                            <div className="text-sm text-gray-600">
                                                <span className="font-medium text-blue-600 hover:text-blue-500">
                                                    {isUploading ? 'Procesando...' : 'Seleccionar Imagen'}
                                                </span>
                                            </div>
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
        // Estado Vacío o Sin Permisos
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            {selectedProduct && !hasPermission('view.products') ? (
                <p className="text-red-500 font-bold">Acceso restringido: No tienes permisos para ver las imágenes.</p>
            ) : (
                <>
                    <PhotoIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">Selecciona un producto arriba para gestionar.</p>
                </>
            )}
        </div>
      )}
    </div>
  );
};