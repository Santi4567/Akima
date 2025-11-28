import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export const ProductDetail = () => {
  const { id } = useParams(); // Obtiene el ID de la URL (ej: /producto/8)
  const navigate = useNavigate();
  
  // Estados
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0); // Para el carrusel

  // Variable de entorno
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // Petición al endpoint: /api/products/catalog/8
        const response = await fetch(`${API_URL}/api/products/catalog/${id}`);
        const json = await response.json();

        if (json.success) {
          setProduct(json.data);
          
          // Si la imagen primaria no es la primera, podríamos ordenar aquí, 
          // pero por defecto mostraremos la posición 0 del array.
        } else {
          // Si el producto no existe o hay error
          navigate('/catalogo');
        }
      } catch (error) {
        console.error("Error cargando producto:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, API_URL, navigate]);

  // Renderizado de carga
  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-green-950 border-solid"></div>
      </div>
    );
  }

  // Si no hay producto
  if (!product) return null;

  // Helpers para URL de imagen y Precio
  const getImageUrl = (path) => `${API_URL}${path}`;
  
  const formatPrice = (price) => new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN'
  }).format(price);

  return (
    <div className="bg-white min-h-screen pb-12">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Botón Volver */}
        <button 
          onClick={() => navigate(-1)} 
          className="mb-8 text-gray-500 hover:text-green-950 flex items-center gap-2 transition-colors font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Volver al catálogo
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          
          {/* --- COLUMNA IZQUIERDA: CARRUSEL DE IMÁGENES --- */}
          <div className="space-y-6">
            
            {/* Imagen Principal (Grande) */}
            <div className="aspect-square bg-gray-50 rounded-3xl overflow-hidden shadow-sm border border-gray-100 relative">
              {product.images && product.images.length > 0 ? (
                <img 
                  src={getImageUrl(product.images[currentImageIndex].image_path)} 
                  alt={product.name} 
                  className="w-full h-full object-contain p-4 transition-all duration-500"
                />
              ) : (
                <img src="https://via.placeholder.com/600x600?text=Sin+Imagen" alt="N/A" className="w-full h-full object-cover opacity-50"/>
              )}
            </div>

            {/* Miniaturas (Thumbnails) */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {product.images.map((img, index) => (
                  <button
                    key={img.id}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                      currentImageIndex === index 
                        ? 'border-green-950 ring-2 ring-green-950/20 shadow-md scale-105' 
                        : 'border-transparent bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <img 
                      src={getImageUrl(img.image_path)} 
                      alt={`Vista ${index}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* --- COLUMNA DERECHA: INFORMACIÓN --- */}
          <div className="flex flex-col justify-center">
            
            {/* Categoría */}
            <span className="inline-block text-green-950 font-bold tracking-widest uppercase text-xs mb-3 bg-green-50 px-3 py-1 rounded-full w-fit">
              {product.category_name}
            </span>
            
            {/* Título */}
            <h1 className="text-4xl sm:text-5xl font-black text-green-950 mb-4 font-serif leading-tight">
              {product.name}
            </h1>

            {/* Precio */}
            <div className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              {formatPrice(product.price)}
              <span className="text-sm font-normal text-gray-400">MXN</span>
            </div>

            {/* Descripción */}
            <div className="prose prose-green text-gray-600 mb-8 text-lg leading-relaxed">
              <p>{product.description}</p>
            </div>

            {/* Características (Attributes List) */}
            {product.attributes_list && product.attributes_list.length > 0 && (
              <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100">
                <h3 className="text-green-950 font-bold text-lg mb-4 flex items-center gap-2">
                  <span className="text-xl">📋</span> Especificaciones
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                  {product.attributes_list.map((attr, idx) => (
                    <div key={idx} className="flex flex-col">
                      <dt className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">
                        {attr.title.replace('_', ' ')} {/* Reemplaza guiones bajos por espacios */}
                      </dt>
                      <dd className="text-green-950 font-semibold text-base capitalize">
                        {attr.description}
                      </dd>
                    </div>
                  ))}
                  {/* Agregamos Dimensiones si existen */}
                  <div className="flex flex-col">
                    <dt className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Peso</dt>
                    <dd className="text-green-950 font-semibold text-base">{product.weight} kg</dd>
                  </div>
                </div>
              </div>
            )}

            {/* Botón de Acción */}
            <div className="mt-auto">
              <button className="w-full bg-green-950 text-white text-lg font-bold py-5 rounded-2xl shadow-xl hover:bg-green-900 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex justify-center items-center gap-3 group">
                <span>Solicitar Cotización</span>
                <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
              <p className="text-center text-gray-400 text-xs mt-4">
                Envío calculado al confirmar pedido con asesor.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};