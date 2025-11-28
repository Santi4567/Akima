import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Lógica del botón directo en el componente
  const getLinkClass = ({ isActive }) => 
    `px-6 py-2 rounded-full font-bold text-sm tracking-wide transition-all duration-300 ${
      isActive 
        ? "bg-green-900 text-white shadow-lg scale-105" // ACTIVO: Verde 950 directo
        : "text-gray-600 hover:text-green-950 hover:bg-green-50" // INACTIVO
    }`;

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24">
          
          {/* LOGO ALKIMIA */}
          <div className="flex items-center gap-3">
            {/* Círculo del logo con Green-950 directo */}
            <div className="w-10 h-10 rounded-full bg-green-950 flex items-center justify-center shadow-md text-white">
              <span className="text-xl">⚗️</span>
            </div>
            {/* Texto del logo con Green-950 directo */}
            <Link to="/" className="text-3xl font-black text-green-950 tracking-tighter font-serif">
              Alkimia
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

          {/* BOTÓN HAMBURGUESA */}
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