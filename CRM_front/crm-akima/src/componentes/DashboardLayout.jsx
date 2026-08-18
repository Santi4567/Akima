import { Outlet } from 'react-router-dom';
import { Header } from './Header'; 

export const DashboardLayout = () => {
  return (
    // Contenedor principal con bg-slate-50 y overflow-hidden para contener los efectos
    <div className="min-h-screen bg-slate-50 relative overflow-hidden font-sans text-slate-900">
      
      {/* --- EFECTOS DE FONDO (BACKGROUND GLOWS) --- */}
      {/* 1. Sombra superior sutil bajo el header */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-slate-200/60 to-transparent pointer-events-none z-0" />
      
      {/* 2. Luz esmeralda difuminada en la esquina superior derecha */}
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none z-0" />
      
      {/* 3. Luz azulada difuminada en el lado izquierdo */}
      <div className="absolute top-60 -left-40 w-96 h-96 rounded-full bg-blue-500/5 blur-[100px] pointer-events-none z-0" />
      {/* ------------------------------------------ */}

      {/* El Header debe estar por encima de los efectos de fondo */}
      <div className="relative z-10">
        <Header />
      </div>

      {/* Contenido principal de la página */}
      <main className="relative z-10">
        <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
      
    </div>
  );
};