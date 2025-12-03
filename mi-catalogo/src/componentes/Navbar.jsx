import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  // Estado para almacenar la URL completa del logo
  const [logoUrl, setLogoUrl] = useState(''); 

  const API_URL = import.meta.env.VITE_API_URL;

  // --- FUNCIÓN PARA OBTENER EL LOGO ---
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const response = await fetch(`${API_URL}/api/company/public`);
        const json = await response.json();

        if (json.success && json.data.logo_path) {
          // Construye la URL completa: http://localhost:3000/uploads/company/logo-....jpeg
          const fullLogoPath = `${API_URL}${json.data.logo_path}`;
          setLogoUrl(fullLogoPath);
        }
      } catch (error) {
        console.error("Error al obtener el logo:", error);
      }
    };
    fetchLogo();
  }, [API_URL]); // Se ejecuta una sola vez al montar el componente

  // Lógica del botón activo
  const getLinkClass = ({ isActive }) => 
    `px-6 py-2 rounded-full font-bold text-sm tracking-wide transition-all duration-300 ${
      isActive 
        ? "bg-green-950 text-white shadow-lg scale-105" // ACTIVO: Verde 950 directo
        : "text-gray-600 hover:text-green-950 hover:bg-green-50" // INACTIVO
    }`;

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24">
          
          {/* LOGO ALKIMIA (IMAGEN DINÁMICA) */}
          <div className="flex items-center gap-3">
            
            <Link to="/" className="flex items-center gap-3">
              {/* Reemplazamos el div con emoji por la imagen del logo */}
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt="Logo de Alkimia" 
                  className="h-10 w-auto object-contain" // Ajusta h-10 según el tamaño deseado
                />
              ) : (
                // Muestra un placeholder o el texto si el logo aún no carga
                <div className="w-10 h-10 rounded-full bg-green-950 flex items-center justify-center shadow-md text-white">
                   <span className="text-xl">⚗️</span>
                </div>
              )}
              
              {/* Texto del logo */}
              <span className="text-3xl font-black text-green-950 tracking-tighter font-serif">
                Alkimia
              </span>
            </Link>
          </div>

          {/* MENÚ DESKTOP */}
          <nav className="hidden md:flex items-center space-x-2"> 
            <NavLink to="/" end className={getLinkClass}>
              INICIO
            </NavLink>
            
            <NavLink to="/catalogo" className={getLinkClass}>
              CATÁLOGO
            </NavLink>
            
            <NavLink to="/contacto" className={getLinkClass}>
              CONTACTO
            </NavLink>
          </nav>

          {/* BOTÓN HAMBURGUESA Y MENÚ MÓVIL (Sin cambios) */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-green-950 p-2">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* MENÚ MÓVIL */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 p-4 shadow-inner">
          <div className="flex flex-col space-y-3">
            <NavLink to="/" end className={getLinkClass} onClick={() => setIsOpen(false)}>INICIO</NavLink>
            <NavLink to="/catalogo" className={getLinkClass} onClick={() => setIsOpen(false)}>CATÁLOGO</NavLink>
            <NavLink to="/contacto" className={getLinkClass} onClick={() => setIsOpen(false)}>CONTACTO</NavLink>
          </div>
        </div>
      )}
    </header>
  );
};