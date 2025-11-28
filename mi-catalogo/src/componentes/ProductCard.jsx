import React from 'react';
import { Link } from 'react-router-dom'; // <--- Importamos Link para la navegación

export const ProductCard = ({ product }) => {
  
  // 1. Obtenemos la URL de la API desde la variable de entorno (.env)
  const BASE_URL = import.meta.env.VITE_API_URL;

  // 2. Función para obtener la imagen correcta
  const getMainImage = () => {
    // Si no hay imágenes, ponemos una por defecto
    if (!product.images || product.images.length === 0) {
      return "https://via.placeholder.com/400x300?text=Alkimia+Sin+Foto";
    }

    // Buscamos la que sea "primary" (is_primary === 1), si no hay, agarramos la primera [0]
    const primaryImage = product.images.find(img => img.is_primary === 1) || product.images[0];
    
    // Unimos la URL del servidor con la ruta de la imagen
    // Ejemplo: http://localhost:3000 + /uploads/products/foto.webp
    return `${BASE_URL}${primaryImage.image_path}`;
  };

  // 3. Función para que el precio se vea bonito (Ej: $1,200.00 MXN)
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group">
      
      {/* --- ZONA DE IMAGEN (Con enlace al detalle) --- */}
      <Link to={`/producto/${product.id}`} className="block relative h-64 overflow-hidden bg-gray-50">
        <img 
          src={getMainImage()} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { e.target.src = "https://via.placeholder.com/400x300?text=Error+Carga"; }} 
        />
        
        {/* Etiqueta de la categoría flotando */}
        <span className="absolute top-3 right-3 bg-green-950/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
          {product.category_name}
        </span>
      </Link>

      {/* --- ZONA DE INFORMACIÓN --- */}
      <div className="p-5 flex flex-col h-48 justify-between">
        
        {/* Título y Descripción */}
        <div>
          <Link to={`/producto/${product.id}`}>
            <h3 className="text-xl font-bold text-green-950 mb-2 leading-tight line-clamp-2 hover:text-green-700 transition-colors">
              {product.name}
            </h3>
          </Link>
          <p className="text-sm text-gray-500 line-clamp-2">
            {product.description}
          </p>
        </div>
        
        {/* Precio y Botón */}
        <div className="border-t border-gray-100 pt-4 flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Precio</span>
            <span className="text-2xl font-black text-green-950">
              {formatPrice(product.price)}
            </span>
          </div>
          
          {/* Botón "+" que también lleva al detalle */}
          <Link 
            to={`/producto/${product.id}`}
            className="bg-green-950 text-white p-3 rounded-full hover:bg-green-800 transition-colors shadow-md transform active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </Link>
        </div>

      </div>
    </div>
  );
};