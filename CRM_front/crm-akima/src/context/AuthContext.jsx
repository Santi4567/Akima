// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

// 1. Crear el Contexto
const AuthContext = createContext();

// 2. Crear el Proveedor (Provider)
export const AuthProvider = ({ children }) => {
  // Inicializamos el estado leyendo desde localStorage
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem('user')) || null
  );
  const [token, setToken] = useState(
    localStorage.getItem('token') || null
  );
  // Un booleano para saber si está autenticado
  const isAuthenticated = !!token;

  // Efecto para escuchar cambios y actualizar localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user, token]);

  // Función de login: recibe los datos de la API
  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
  };

  // Función de logout
  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. Hook personalizado para consumir el contexto
export const useAuth = () => {
  return useContext(AuthContext);
};