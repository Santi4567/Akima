// Voy a intentar añadir la extensión .jsx a la importación, 
// a veces eso soluciona problemas de resolución de rutas.
import { useAuth } from '../context/AuthContext.jsx'; // Ajusta la ruta a tu AuthContext

/**
 * Componente "Envoltorio" (Wrapper) para UI.
 * Oculta o muestra sus 'children' (botones, links, etc.)
 * basado en los permisos del usuario.
 *
 * Uso para un permiso específico:
 * <HasPermission required="add.clients">
 * <button>Nuevo Cliente</button>
 * </HasPermission>
 *
 * Uso para un grupo de permisos (si tiene CUALQUIERA):
 * <HasPermission any={PERMISSIONS.CLIENTS}>
 * <NavLink to="/clientes">Sección Clientes</NavLink>
 * </HasPermission>
 */
export const HasPermission = ({ children, required, any }) => {
  // Obtenemos las funciones de nuestro contexto
  const { hasPermission, hasAnyPermission } = useAuth();

  let isAuthorized = false;

  // --- Lógica de Autorización ---

  if (required) {
    // 1. Caso: Se requiere un permiso específico
    // Ej: required="add.clients"
    isAuthorized = hasPermission(required);
  } else if (any) {
    // 2. Caso: Se requiere CUALQUIER permiso de un grupo (array)
    // Ej: any={['view.clients', 'edit.clients', ...]}
    isAuthorized = hasAnyPermission(any);
  } else {
    // 3. Caso: (Error) No se especificó 'required' ni 'any'.
    // Por seguridad, no mostramos nada.
    // Podrías poner un console.warn aquí si quisieras.
    isAuthorized = false;
  }

  // --- Renderizado ---
  // Si está autorizado, muestra el contenido (children).
  // Si no, no muestra nada (null).
  return isAuthorized ? <>{children}</> : null;
};