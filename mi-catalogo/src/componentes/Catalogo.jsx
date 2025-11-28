import React, { useState, useEffect } from 'react';
import { ProductCard } from './ProductCard';

export const Catalogo = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Leemos la variable del archivo .env
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Construimos la URL: http://localhost:3000/api/products/catalog
        // Nota: En tu curl pusiste 'catalog', en tu texto 'catalogo'. 
        // Usaré 'catalog' que es lo que salió en el curl. Si es 'catalogo', cámbialo aquí.
        const response = await fetch(`${API_URL}/api/products/catalog`);
        
        if (!response.ok) {
          throw new Error('Error al conectar con el servidor');
        }

        const json = await response.json();

        // Según tu JSON, los productos están dentro de "data"
        if (json.success) {
          setProducts(json.data);
        } else {
          setError('No se pudieron cargar los productos');
        }

      } catch (err) {
        console.error(err);
        setError('Error de conexión. Intenta más tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-green-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-950"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-600 font-bold">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-black text-green-950 mb-8 border-b-2 border-green-100 pb-2 inline-block">
        Catálogo de Productos
      </h1>
      
      {products.length === 0 ? (
        <p className="text-gray-500">No hay productos disponibles por el momento.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};