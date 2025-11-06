import { Navigate, Outlet } from 'react-router-dom';
// Voy a asumir que tu AuthContext.jsx está en una carpeta 'context'
// al mismo nivel que 'componentes', dentro de 'src'.
// Si está en otro lugar (como dentro de 'componentes'), esta ruta necesitará ajuste.
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = () => {
  // 1. Obtenemos el estado de autenticación de nuestro contexto
  // Asumimos que tu hook useAuth() devuelve { isAuthenticated }
  const { isAuthenticated } = useAuth();

  // 2. Comprobamos if el usuario está autenticado
  if (!isAuthenticated) {
    // 3. Si no lo está, lo redirigimos a /login
    // 'replace' evita que la ruta a la que intentaba acceder se guarde en el historial
    return <Navigate to="/login" replace />;
  }

  // 4. Si SÍ está autenticado, le dejamos pasar
  // <Outlet /> es el componente que React Router renderiza
  // (en tu caso, sería <Home />)
  return <Outlet />;
};