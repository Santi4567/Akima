import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const usePermissions = () => {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      const userInfo = await AsyncStorage.getItem('userInfo');
      if (userInfo) {
        const user = JSON.parse(userInfo);
        // Asumiendo que guardaste el objeto usuario completo que venía en el login/profile
        // y que dentro tiene un array "permissions"
        if (user.permissions) {
            setPermissions(user.permissions);
        }
      }
    } catch (error) {
      console.error("Error leyendo permisos", error);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permissionNeeded: string) => {
    return permissions.includes(permissionNeeded);
  };

  return { permissions, hasPermission, loading };
};