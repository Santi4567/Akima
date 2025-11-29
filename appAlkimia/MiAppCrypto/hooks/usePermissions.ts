import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const usePermissions = () => {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      // 1. Intentamos leer del almacenamiento local
      const userInfoStr = await AsyncStorage.getItem('userInfo');
      const token = await AsyncStorage.getItem('userToken');

      if (userInfoStr && token) {
        let user = JSON.parse(userInfoStr);

        // 2. Si ya tiene permisos guardados, los usamos
        if (user.permissions && user.permissions.length > 0) {
          setPermissions(user.permissions);
          setLoading(false);
          
          // (Opcional) Podemos actualizar en segundo plano para estar seguros
          fetchProfile(token); 
        } else {
          // 3. Si NO tiene permisos, hay que pedirlos a la API (Profile)
          await fetchProfile(token);
        }
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error inicializando permisos", error);
      setLoading(false);
    }
  };

  const fetchProfile = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success && data.data.permissions) {
        // ACTUALIZAMOS EL ESTADO
        setPermissions(data.data.permissions);

        // ACTUALIZAMOS ASYNC STORAGE (Para no pedirlo cada vez)
        const currentUserInfo = await AsyncStorage.getItem('userInfo');
        if (currentUserInfo) {
           const userObj = JSON.parse(currentUserInfo);
           userObj.permissions = data.data.permissions; // Agregamos/Actualizamos el array
           await AsyncStorage.setItem('userInfo', JSON.stringify(userObj));
        }
        
        console.log("Permisos actualizados desde API:", data.data.permissions);
      }
    } catch (error) {
      console.error("Error obteniendo perfil:", error);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permissionNeeded: string) => {
    // Si está cargando, asumimos false por seguridad, o true si quieres evitar parpadeos
    if (loading) return false; 
    
    // Verificamos si el permiso está en la lista
    return permissions.includes(permissionNeeded);
  };

  return { permissions, hasPermission, loading, refreshPermissions: checkPermissions };
};