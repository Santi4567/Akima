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
    <div className="min-h-screen bg-gray-50 pb-10">
      
      {/* 1. HEADER GLOBAL (Siempre visible) */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex items-center gap-4">
            <div className="bg-green-100 p-2 rounded-full hidden sm:block">
                <UserCircleIcon className="h-10 w-10 text-green-700" />
            </div>
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    Hola, {user?.nombre}
                </h1>
                <p className="text-sm text-gray-500">
                    Panel de Control | <span className="font-semibold capitalize text-green-600">{user?.rol}</span>
                </p>
            </div>
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