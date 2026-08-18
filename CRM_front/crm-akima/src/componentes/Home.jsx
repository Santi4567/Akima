import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserCircleIcon } from '@heroicons/react/24/solid';

// Importamos los componentes
import { HomeHubNav } from './Home/HomeHubNav';
import { PendingVisitsCard } from './Home/PendingVisitsCard';
import { WebCarousel } from './Home/WebCarousel';
import { CompanySettings } from './Home/CompanySettings';

export const Home = () => {
  const { user, isSuperAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'web', 'settings'

  return (
    <div className="pb-10">
      
      {/* 1. TARJETA DE BIENVENIDA (Efecto Cristal) */}
      <div className="bg-white/80 backdrop-blur-xl shadow-sm border border-slate-200 rounded-3xl p-6 flex items-center gap-5 mb-8 transition-all hover:shadow-md">
          <div className="bg-emerald-100 p-3 rounded-2xl hidden sm:block border border-emerald-200/50 shadow-inner">
              <UserCircleIcon className="h-10 w-10 text-emerald-600" />
          </div>
          <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  Hola, {user?.nombre}
              </h1>
              <p className="text-sm text-slate-500 mt-1 font-medium">
                  Panel de Control | <span className="font-bold capitalize text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">{user?.rol}</span>
              </p>
          </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* 2. NAVEGACIÓN (TABS) */}
        <HomeHubNav activeTab={activeTab} onTabChange={setActiveTab} />

        {/* 3. CONTENIDO DINÁMICO */}
        <div className="animate-fadeIn">
            
            {/* --- VISTA DASHBOARD --- */}
            {activeTab === 'dashboard' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Tarjeta de Visitas */}
                    <PendingVisitsCard />
                    
                    {/* Aquí puedes agregar más tarjetas futuras (ej: accesos rápidos) */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-center items-center text-gray-400 text-sm border-dashed">
                        <p>Próximamente más widgets...</p>
                    </div>
                </div>
            )}

            {/* --- VISTA WEB --- */}
            {activeTab === 'web' && isSuperAdmin() && (
                <div className="max-w-4xl">
                    <div className="mb-4">
                        <h2 className="text-lg font-bold text-gray-800">Gestión de Contenido Web</h2>
                        <p className="text-sm text-gray-500">Administra las imágenes y textos que ven tus clientes en el sitio público.</p>
                    </div>
                    <WebCarousel />
                </div>
            )}

            {/* --- VISTA CONFIGURACIÓN --- */}
            {activeTab === 'settings' && isSuperAdmin() && (
                <div className="max-w-4xl">
                    <div className="mb-4">
                        <h2 className="text-lg font-bold text-gray-800">Ajustes de la Empresa</h2>
                        <p className="text-sm text-gray-500">Estos datos aparecerán en reportes, facturas y encabezados oficiales.</p>
                    </div>
                    <CompanySettings />
                </div>
            )}

        </div>
      </div>
    </div>
  );
};