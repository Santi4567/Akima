import { createContext, useContext, useState, useEffect } from 'react';

// 1. Crear el Contexto
const AuthContext = createContext();

// 2. Crear el Proveedor (Provider)
export const AuthProvider = ({ children }) => {
  // -----------------------------------------------------------------
  // ¡AQUÍ ESTÁ LA CLAVE!
  // Inicializamos el estado LEYENDO desde localStorage.
  // -----------------------------------------------------------------
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem('user')) || null
  );
  const [token, setToken] = useState(
    localStorage.getItem('token') || null
  );

  // Un booleano para el ProtectedRoute
  const isAuthenticated = !!token; 

  // -----------------------------------------------------------------
  // Este 'useEffect' VIGILA los cambios en 'user' y 'token'
  // y los ESCRIBE en localStorage.
  // -----------------------------------------------------------------
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [user, token]); // Se ejecuta cada vez que 'user' o 'token' cambian

  // Función de login: la llama LoginPage.jsx
  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
  };

  // Función de logout: la llama Home.jsx
  const logout = () => {
    setUser(null);
    setToken(null);
  };

  // 3. Compartimos los valores con toda la app
  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// 4. Hook personalizado para consumir el contexto fácilmente
export const useAuth = () => {
  return useContext(AuthContext);
};