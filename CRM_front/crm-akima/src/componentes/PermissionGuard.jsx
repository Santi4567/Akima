// src/componentes/PermissionGuard.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Asegúrate que la ruta sea correcta

// Componente de carga
const LoadingPermissions = () => (
  <div className="flex h-screen items-center justify-center bg-gray-50">
    <p className="animate-pulse text-2xl font-medium text-gray-700">
      Verificando permisos...
    </p>
  </div>
);

/**
 * Este guardián protege una ruta completa (ej. /clientes).
 * Recibe los permisos en el prop 'any'.
 * Recibe el componente a renderizar (ej. <Clientes />) como 'children'.
 */
export const PermissionGuard = ({ children, any }) => {
  // Obtenemos la función y el estado de carga
  const { hasAnyPermission, isLoading } = useAuth();

  // 1. No podemos tomar una decisión si los permisos aún están cargando
  if (isLoading) {
    return <LoadingPermissions />;
  }

  // 2. Comprueba si el usuario tiene AL MENOS UNO de los permisos necesarios
  //    (Usamos el prop 'any', que es el que pasaste en main.jsx)
  //    Si 'any' está vacío (como en Home), isAuthorized es true.
  const isAuthorized = !any || any.length === 0 || hasAnyPermission(any);

  if (!isAuthorized) {
    // 3. Si no está autorizado, lo mandamos a la página de "No Autorizado"
    return <Navigate to="/unauthorized" replace />;
  }

  // 4. Si está autorizado, renderiza el 'children' que le pasaste
  //    (Es decir, <Clientes />, <Productos />, etc.)
  return children;
};