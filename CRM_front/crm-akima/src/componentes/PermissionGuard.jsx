import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Ajusta la ruta a tu AuthContext

/**
 * Este guardián protege una ruta completa (ej. /clientes).
 * Requiere un array de permisos (ej. ['view.clients', 'edit.clients'])
 * Si el usuario no tiene NINGUNO de esos permisos, lo redirige.
 */
export const PermissionGuard = ({ requiredPermissions }) => {
  // Obtenemos la función 'hasAnyPermission' y el estado 'isLoading' del contexto
  const { hasAnyPermission, isLoading } = useAuth();

  // 1. No podemos tomar una decisión si los permisos del usuario aún están cargando
  // (isLoading se vuelve 'false' cuando el fetch a /profile termina)
  if (isLoading) {
    // Puedes poner un spinner de carga aquí
    return <div className="flex h-screen items-center justify-center">Verificando permisos...</div>; 
  }

  // 2. Comprueba si el usuario tiene AL MENOS UNO de los permisos necesarios
  const isAuthorized = hasAnyPermission(requiredPermissions);

  if (!isAuthorized) {
    // 3. Si no está autorizado, lo mandamos a la página de "No Autorizado"
    // 'replace' evita que pueda volver con el botón de atrás
    return <Navigate to="/unauthorized" replace />;
  }

  // 4. Si está autorizado, renderiza la página solicitada (Clientes, Usuarios, etc.)
  // Outlet es el marcador de React Router para el componente hijo
  return <Outlet />;
};