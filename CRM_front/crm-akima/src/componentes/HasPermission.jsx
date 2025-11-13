import { useAuth } from '../context/AuthContext.jsx'; // Sube un nivel para encontrar 'context'

/**
 * Componente Guardián para la UI.
 * Oculta o muestra sus 'children' (ej. un botón) basado en los permisos.
 *
 * @param {React.ReactNode} children - El componente a renderizar (ej. <button />).
 * @param {string} [required] - Un solo permiso requerido (ej. "add.users").
 * @param {string[]} [any] - Un array de permisos; el usuario debe tener AL MENOS UNO (ej. ["view.users", "add.users"]).
 */
export const HasPermission = ({ children, required, any }) => {
  // Obtenemos la función de comprobación del contexto
  const { hasPermission, hasAnyPermission } = useAuth();

  let isAuthorized = false;

  if (required) {
    // Caso 1: Se requiere un permiso específico
    isAuthorized = hasPermission(required);
  } else if (any) {
    // Caso 2: Se requiere CUALQUIERA de una lista de permisos
    isAuthorized = hasAnyPermission(any);
  } else {
    // Caso 3 (Por defecto): Si no se especifican permisos, se muestra.
    // O puedes cambiar esto a 'false' si quieres que sea estricto.
    isAuthorized = true;
  }

  // Si no está autorizado, no renderiza nada (null)
  if (!isAuthorized) {
    return null;
  }

  // Si está autorizado, renderiza el componente hijo (el botón, enlace, etc.)
  return children;
};