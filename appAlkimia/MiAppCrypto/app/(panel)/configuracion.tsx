import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

export default function ConfiguracionScreen() {
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    AsyncStorage.getItem('userInfo').then(data => {
      if (data) setUserInfo(JSON.parse(data));
    });
  }, []);

  const handleLogout = async () => {
    Alert.alert("Cerrar Sesión", "¿Salir de la aplicación?", [
      { text: "Cancelar", style: "cancel" },
      { 
        text: "Salir", style: 'destructive',
        onPress: async () => {
          await AsyncStorage.clear();
          router.replace('/');
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>Configuración</Text>

      {/* Perfil */}
      <View style={styles.profileSection}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{userInfo?.nombre?.charAt(0) || 'U'}</Text>
        </View>
        <Text style={styles.name}>{userInfo?.nombre || 'Usuario'}</Text>
        <Text style={styles.email}>{userInfo?.correo || 'correo@alkimia.com'}</Text>
        <View style={styles.badge}>
            <Text style={styles.badgeText}>{userInfo?.rol || 'Rol'}</Text>
        </View>
      </View>

      {/* Opciones */}
      <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="notifications-outline" size={22} color="#555" />
          <Text style={styles.menuText}>Notificaciones</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="lock-closed-outline" size={22} color="#555" />
          <Text style={styles.menuText}>Seguridad</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#d32f2f" />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', margin: 20, color: '#333' },
  profileSection: { alignItems: 'center', marginBottom: 30, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 20 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#2e7d32', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  name: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  email: { fontSize: 14, color: '#666', marginBottom: 5 },
  badge: { backgroundColor: '#e8f5e9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginTop: 5 },
  badgeText: { color: '#2e7d32', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  menuContainer: { paddingHorizontal: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  menuText: { flex: 1, marginLeft: 15, fontSize: 16, color: '#333' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, marginTop: 20 },
  logoutText: { marginLeft: 15, fontSize: 16, color: '#d32f2f', fontWeight: 'bold' },
});