import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Ajusta la ruta a tu AuthContext

// Componente simple de carga (puedes mejorarlo después)
const LoadingScreen = () => (
  <div className="flex h-screen items-center justify-center bg-gray-50">
    <p className="animate-pulse text-2xl font-medium text-gray-700">
      Verificando sesión...
    </p>
    {/* Aquí puedes poner un spinner SVG si lo deseas */}
  </div>
);

export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // 1. Si estamos cargando (verificando el /profile), muestra "Cargando..."
  // Este es el paso MÁS importante del nuevo flujo.
  if (isLoading) {
    return <LoadingScreen />;
  }

  // 2. Si terminó de cargar y NO está autenticado, patea a /login
  if (!isAuthenticated) {
    // 'replace' evita que el usuario pueda volver con el botón de atrás
    return <Navigate to="/login" replace />;
  }

  // 3. Si terminó de cargar y SÍ está autenticado, deja pasar
  // Outlet renderizará lo que esté anidado (en tu caso, DashboardLayout)
  return <Outlet />;
};