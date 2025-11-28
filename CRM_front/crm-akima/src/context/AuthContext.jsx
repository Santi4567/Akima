import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ... (checkAuthStatus, login, logout siguen igual) ...
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
        // data ahora trae: { ..., permissions: [...], grouped_permissions: { PRODUCTS: [...] } }
        setUser(data); 
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { checkAuthStatus(); }, [checkAuthStatus]);

  const login = () => checkAuthStatus();
  
  const logout = async () => {
    try {
      await fetch(`${API_URL}/api/users/logout`, { method: 'POST', credentials: 'include' });
    } catch (error) { console.error(error); } 
    finally { setUser(null); }
  };

  // --- LÓGICA DE PERMISOS ACTUALIZADA ---

  const isSuperAdmin = useCallback(() => {
    return user?.permissions?.includes('*') || false;
  }, [user]);

  // 1. Verificar un permiso específico (Igual que antes)
  // Uso: hasPermission('add.order')
  const hasPermission = useCallback((requiredPermission) => {
    if (isSuperAdmin()) return true;
    return user?.permissions?.includes(requiredPermission) || false;
  }, [user, isSuperAdmin]);

  // 2. Verificar lista de permisos (Igual que antes)
  const hasAnyPermission = useCallback((permissionsArray) => {
    if (isSuperAdmin()) return true;
    if (!Array.isArray(permissionsArray)) return false;
    return permissionsArray.some(permission => 
      user?.permissions?.includes(permission)
    ) || false;
  }, [user, isSuperAdmin]);

  // 3. NUEVA FUNCIÓN: Verificar acceso por GRUPO del Backend
  // Uso: hasGroupAccess('PRODUCTS') -> Devuelve true si el usuario tiene algún permiso de ese grupo
  const hasGroupAccess = useCallback((groupName) => {
    if (isSuperAdmin()) return true;
    // Verifica si el grupo existe en la respuesta del backend y tiene permisos asignados
    const groupPerms = user?.grouped_permissions?.[groupName];
    return Array.isArray(groupPerms) && groupPerms.length > 0;
  }, [user, isSuperAdmin]);

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    hasPermission,
    hasAnyPermission,
    hasGroupAccess, // <-- Exportamos la nueva función
    isSuperAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);