import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ProductCard } from './ProductCard';
import { useDebounce } from './hooks/useDebounce'; // <--- IMPORTAMOS EL HOOK

export const Catalogo = () => {
  const [products, setProducts] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para Filtros
  const [searchTerm, setSearchTerm] = useState(''); // Valor en el input (tiempo real)
  const debouncedSearchTerm = useDebounce(searchTerm, 500); // Valor retrasado 500ms (para el fetch)
  
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 0 }); 
  const [priceBounds, setPriceBounds] = useState({ min: 0, max: 0 }); 

  const API_URL = import.meta.env.VITE_API_URL;
  const CATALOG_ENDPOINT = '/api/products/catalog';


  // --- FUNCIÓN DE FETCH GENERALIZADA ---
  const fetchData = useCallback(async (query = '') => {
    setLoading(true);
    setError(null);

    try {
      const endpoint = query 
        ? `${API_URL}/api/products/catalog/search?q=${query}` 
        : `${API_URL}${CATALOG_ENDPOINT}`;
      
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Error de servidor');

      const json = await response.json();
      
      if (json.success) {
        setProducts(json.data);
        
        // --- CALCULAR LÍMITES DE PRECIOS (CON BUFFER DE PULIDO) ---
      if (json.data.length > 0) {
        const prices = json.data.map(p => Number(p.price));
        const minP = Math.floor(Math.min(...prices));
        let maxP = Math.ceil(Math.max(...prices)); // Usamos 'let' para poder modificarlo
        
        // Si el precio mínimo es igual al máximo (un solo producto), 
        // expandimos el rango para que los sliders sean interactivos.
        if (minP === maxP) {
            // Añadimos un buffer de 10 unidades (o más, según el valor típico de tus precios)
            // Esto asegura que el precio máximo sea siempre mayor que el mínimo.
            maxP = minP + 10; 
        }

        setPriceBounds({ min: minP, max: maxP });
        
        // Solo resetea el slider al rango completo si es la primera carga 
        if (priceRange.min === 0 && priceRange.max === 0) {
           setPriceRange({ min: minP, max: maxP });
        }
      } else {
        setPriceBounds({ min: 0, max: 0 });
        setPriceRange({ min: 0, max: 0 });
      }
    } else {
      setError('No se encontraron resultados.');
    }
  } catch (err) {
    console.error(err);
    setError('Error al cargar datos. Verifica la conexión.');
  } finally {
    setLoading(false);
  }
}, [API_URL, priceRange.min, priceRange.max]);


  // --- EFECTO: DISPARAR FETCH AL CAMBIAR EL TÉRMINO DE BÚSQUEDA ---
  // Este useEffect se dispara 500ms después de que el usuario deja de escribir.
  useEffect(() => {
    fetchData(debouncedSearchTerm);
  }, [debouncedSearchTerm, fetchData]);


  // --- LÓGICA DE FILTRADO (Cliente: Categoría y Precio) ---
  const { categories, filteredProducts } = useMemo(() => {
    
    // 1. Extracción de Categorías (misma lógica)
    const categoryNames = {};
    products.forEach(p => {
        if (p.category_id) categoryNames[p.category_id] = p.category_name;
        if (p.parent_category_id) categoryNames[p.parent_category_id] = p.parent_category_name;
    });

    const categoriesArray = Object.keys(categoryNames).map(id => ({ 
        id: Number(id), 
        name: categoryNames[id] 
    })).sort((a, b) => a.name.localeCompare(b.name));
    
    // 2. Aplicar filtros
    let currentFiltered = products.filter(product => {
      // Filtro de Categoría
      if (selectedCategories.length > 0) {
        const productCategoryIds = [product.category_id, product.parent_category_id].filter(id => id !== null);
        const isCategoryMatch = selectedCategories.some(catId => productCategoryIds.includes(catId));
        if (!isCategoryMatch) return false;
      }

      // Filtro de Precio: Ajustamos el precio del producto y los límites
      const price = Number(product.price);
      if (price < priceRange.min || price > priceRange.max) {
        return false;
      }

      return true;
    });

    return { filteredProducts: currentFiltered, categories: categoriesArray };
  }, [products, selectedCategories, priceRange]);


  // --- MANEJADOR DE INTERACCIÓN ---
  
  // Lógica para checkbox
  const handleCategoryToggle = (id) => {
    setSelectedCategories(prev => 
      prev.includes(id) 
        ? prev.filter(catId => catId !== id)
        : [...prev, id]
    );
  };

  // Lógica de Prevención de Sobreposición en Sliders
  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    const numValue = Number(value);

    setPriceRange(prev => {
        let newState = { ...prev, [name]: numValue };
        
        // Evita que el mínimo sea mayor que el máximo y viceversa
        if (name === 'min' && numValue > prev.max) {
            newState.max = numValue;
        } else if (name === 'max' && numValue < prev.min) {
            newState.min = numValue;
        }
        
        return newState;
    });
  };


  if (loading) {
    return <div className="flex justify-center items-center h-screen text-green-950">...</div>;
  }

  // --- RENDERIZADO DEL CATALOGO ---

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* 1. BUSCADOR EXTENDIDO (ARRIBA) */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-green-950 mb-4 font-serif">Catálogo Web de Alkimia</h1>
        <div className="relative">
            <input
                type="text"
                placeholder="Buscar por fertilizante o componente químico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} // <--- Real-time search
                className="w-full p-4 pr-12 border-2 border-green-950/30 rounded-xl focus:ring-green-950 focus:border-green-950 transition-all text-lg shadow-inner"
            />
            <svg className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-green-950" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        {debouncedSearchTerm && (
             <p className="mt-2 text-sm text-gray-500">Mostrando resultados para: <span className="font-semibold text-green-950">"{debouncedSearchTerm}"</span></p>
        )}
      </div>

      
      {/* --- LAYOUT DE 2 COLUMNAS: FILTROS (1/4) + PRODUCTOS (3/4) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
        
        {/* === COLUMNA IZQUIERDA: FILTROS === */}
        <div className="lg:sticky lg:top-28 h-fit p-6 bg-gray-50 rounded-xl shadow-lg border border-gray-100">
          
          {/* FILTRO DE CATEGORÍAS (Checkboxes) */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-green-950 mb-4 border-b pb-2">Filtrar por Categoría</h3>
            
            {/* Contenedor de Checkboxes */}
            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
                {categories.map(cat => (
                    <label 
                        key={cat.id} 
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                            selectedCategories.includes(cat.id) 
                                ? 'bg-green-950 border-green-950 text-white shadow-md' 
                                : 'bg-white border-gray-200 text-gray-700 hover:bg-green-50'
                        }`}
                    >
                        {/* Checkbox Oculto para estilos personalizados */}
                        <input
                            type="checkbox"
                            checked={selectedCategories.includes(cat.id)}
                            onChange={() => handleCategoryToggle(cat.id)}
                            className="opacity-0 absolute h-4 w-4" 
                        />
                        {/* Ícono de Checkbox (Diseño) */}
                        <div className={`w-5 h-5 border-2 rounded-sm flex items-center justify-center transition-colors ${
                            selectedCategories.includes(cat.id) 
                                ? 'bg-white border-white' 
                                : 'bg-white border-gray-400'
                        }`}>
                            {selectedCategories.includes(cat.id) && (
                                <svg className="w-4 h-4 text-green-950" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                            )}
                        </div>
                        
                        <span className="font-semibold text-sm select-none">{cat.name}</span>
                    </label>
                ))}
            </div>
            
            {/* Botón para resetear */}
            {selectedCategories.length > 0 && (
                <button 
                    onClick={() => setSelectedCategories([])} 
                    className="mt-4 text-sm text-green-950 hover:text-green-700 font-medium"
                >
                    Limpiar Filtros ({selectedCategories.length})
                </button>
            )}
          </div>

          {/* FILTRO DE PRECIOS */}
          <div className="mb-4 border-t pt-6 border-gray-200">
            <h3 className="text-lg font-bold text-green-950 mb-4 border-b pb-2">Rango de Precios</h3>
            
            {priceBounds.max > 0 ? (
                <div className="space-y-6">
                    {/* Display de Precios */}
                    <div className="flex justify-between font-bold text-green-950 text-md">
                        <span>Min: {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(priceRange.min)}</span>
                        <span>Max: {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(priceRange.max)}</span>
                    </div>
                    
                    {/* Controles de Rango */}
                    <div className="relative pt-2">
                        {/* Slider Mínimo */}
                        <input
                            type="range"
                            name="min"
                            min={priceBounds.min}
                            max={priceBounds.max}
                            step="1"
                            value={priceRange.min}
                            onChange={handlePriceChange}
                            className="w-full h-2 bg-transparent absolute appearance-none cursor-pointer z-10 [&::-webkit-slider-thumb]:bg-green-950 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4"
                        />
                        {/* Slider Máximo */}
                        <input
                            type="range"
                            name="max"
                            min={priceBounds.min}
                            max={priceBounds.max}
                            step="1"
                            value={priceRange.max}
                            onChange={handlePriceChange}
                            className="w-full h-2 bg-transparent absolute appearance-none cursor-pointer z-10 [&::-webkit-slider-thumb]:bg-green-950 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4"
                        />
                        {/* Barra de Fondo */}
                        <div className="h-2 w-full bg-green-100 rounded-lg absolute"></div>
                        
                        {/* Barra de Relleno (Opcional, requiere JS complejo o librería) */}
                        {/* Dejamos las dos barras separadas para evitar la complejidad de la librería */}
                    </div>
                </div>
            ) : (
                <p className="text-sm text-gray-500">Rango de precios no disponible.</p>
            )}
          </div>
        </div>

        {/* === COLUMNA DERECHA: GRILLA DE PRODUCTOS === */}
        <div>
          <p className="text-gray-500 mb-6 font-medium">
            Mostrando {filteredProducts.length} producto(s) del total de {products.length}.
          </p>
          
          {filteredProducts.length === 0 && !loading ? (
            <div className="text-center py-20 bg-white rounded-xl shadow-lg">
              <p className="text-2xl font-bold text-red-500">⚠️ Sin resultados.</p>
              <p className="text-gray-500 mt-2">Intenta modificar la búsqueda o los filtros.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};