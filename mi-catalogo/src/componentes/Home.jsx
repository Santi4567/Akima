import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export const Home = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const API_URL = import.meta.env.VITE_API_URL;
  // Endpoint corregido según tu curl
  const BANNER_ENDPOINT = '/api/content/banners'; 

  // Lógica para el carrusel
  const nextSlide = () => {
    setActiveIndex((prevIndex) => 
      prevIndex === banners.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setActiveIndex((prevIndex) => 
      prevIndex === 0 ? banners.length - 1 : prevIndex - 1
    );
  };

  // --- FETCHING Y ORDENAMIENTO DE BANNERS ---
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await fetch(`${API_URL}${BANNER_ENDPOINT}`);
        const json = await response.json();

        if (json.success && json.data.length > 0) {
          // 1. Ordenar por display_order
          const sortedBanners = json.data.sort((a, b) => a.display_order - b.display_order);
          setBanners(sortedBanners);
        }
      } catch (err) {
        console.error("Error al cargar banners:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, [API_URL]);


  // --- TEMPORIZADOR DE 7 SEGUNDOS ---
  useEffect(() => {
    if (banners.length > 1) {
      const timer = setInterval(nextSlide, 7000);
      return () => clearInterval(timer);
    }
  }, [activeIndex, banners]);


  // --- RENDERIZADO ---

  if (loading) {
    return <div className="text-center py-20">Cargando Banners...</div>;
  }
  
  const currentBanner = banners.length > 0 ? banners[activeIndex] : null;

  return (
    <div className="bg-white min-h-screen">
      
      {/* ======================================= */}
      {/* 1. CARRUSEL DE BANNERS */}
      {/* ======================================= */}
      {currentBanner && (
        <div className="relative w-full overflow-hidden shadow-2xl">
          <div className="relative h-[450px] lg:h-[600px]">
            {/* Imagen Actual */}
            <div className="w-full h-full">
              <img
                src={`${API_URL}${currentBanner.image_path}`}
                alt={currentBanner.title || "Banner Alkimia"}
                className="w-full h-full object-cover transition-opacity duration-1000"
              />
              
              {/* Overlay de Texto si existe */}
              {currentBanner.title && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-8">
                  <h2 className="text-4xl lg:text-6xl font-black text-white text-center font-serif">
                    {currentBanner.title}
                  </h2>
                </div>
              )}
            </div>
            
            {/* Flecha Izquierda */}
            <button
              onClick={prevSlide}
              className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white p-3 rounded-full transition-colors z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>

            {/* Flecha Derecha */}
            <button
              onClick={nextSlide}
              className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white p-3 rounded-full transition-colors z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>

            {/* Puntos Indicadores */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === activeIndex ? 'bg-white scale-110' : 'bg-white/50 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>

          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* 2. APARTADO: NOSOTROS (ALKIMIA) */}
      {/* ======================================= */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 bg-white">
        <div className="text-center">
          <h2 className="text-4xl font-black text-green-950 mb-4 font-serif">
            Alkimia: Nutriendo el Futuro Agrícola
          </h2>
          <p className="max-w-3xl mx-auto text-xl text-gray-600 leading-relaxed">
            Somos un grupo líder en la venta y distribución de **fertilizantes de alta especialidad** para el campo. 
            Nuestra misión es potenciar la productividad y sostenibilidad de los cultivos con soluciones químicas y orgánicas 
            que garantizan el rendimiento y la salud del suelo.
          </p>
          <p className="mt-6">
            <Link to="/contacto" className="inline-flex items-center text-lg font-bold text-white bg-green-950 px-8 py-3 rounded-full shadow-lg hover:bg-green-800 transition-colors transform hover:-translate-y-0.5">
                Conoce más sobre nuestra historia
            </Link>
          </p>
        </div>
      </div>
      
      {/* ======================================= */}
      {/* 3. SUGERENCIA: Sección de Productos Destacados */}
      {/* ======================================= */}
      <div className="py-16 bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-black text-green-950 mb-6 text-center font-serif">
                Fertilizantes Recomendados
            </h2>
            <p className="text-center text-gray-600 mb-10">
                (Aquí implementaremos la sección de Productos Destacados en el siguiente paso)
            </p>
            {/* Aquí iría el componente de Productos Destacados */}
        </div>
      </div>

    </div>
  );
};