import { createContext, useContext, useState, useEffect, useCallback } from 'react';

// URL de tu API
// Se ha ajustado para evitar el warning 'import.meta'. 
// Para producción, esto debería venir de un .env
const API_URL = 'http://localhost:3000';

// 1. Crear el Contexto
const AuthContext = createContext();

// 2. Crear el Proveedor
export const AuthProvider = ({ children }) => {
  // 'user' ahora contendrá el objeto { id, nombre, rol, permissions }
  const [user, setUser] = useState(null);
  // 'isLoading' es clave para que ProtectedRoute sepa esperar
  const [isLoading, setIsLoading] = useState(true);

  // Función para verificar la sesión (leyendo la cookie HttpOnly)
  const checkAuthStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (response.ok) {
        const { data } = await response.json();
        setUser(data); // Guardamos { id, nombre, rol, permissions }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error verificando la autenticación:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Al cargar la app por PRIMERA VEZ, verifica la sesión
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // LoginPage llamará a esta función DESPUÉS de un login exitoso
  const login = () => {
    return checkAuthStatus();
  };

  // Logout
  const logout = async () => {
    try {
      await fetch(`${API_URL}/api/users/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      setUser(null);
    }
  };

  // --- NUEVA LÓGICA DE PERMISOS ---

  // Función para chequear si es Admin (tiene "*")
  const isSuperAdmin = useCallback(() => {
    return user?.permissions?.includes('*') || false;
  }, [user]);

  /**
   * Verifica si el usuario tiene un permiso específico.
   * Ej: hasPermission('add.clients')
   */
  const hasPermission = useCallback((requiredPermission) => {
    if (isSuperAdmin()) return true;
    return user?.permissions?.includes(requiredPermission) || false;
  }, [user, isSuperAdmin]);

  /**
   * Verifica si el usuario tiene AL MENOS UNO de los permisos en un array.
   * Ej: hasAnyPermission(['view.clients', 'edit.clients'])
   */
  const hasAnyPermission = useCallback((permissionsArray) => {
    if (isSuperAdmin()) return true;
    return permissionsArray?.some(permission => 
      user?.permissions?.includes(permission)
    ) || false;
  }, [user, isSuperAdmin]);


  // El valor que compartimos
  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    hasPermission,       // <-- Nueva función
    hasAnyPermission,    // <-- Nueva función
    isSuperAdmin,        // <-- Nueva función (interna o externa)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. Hook personalizado
export const useAuth = () => {
  return useContext(AuthContext);
};