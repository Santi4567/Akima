import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

// Definimos la estructura de los datos del usuario que guardamos
interface UserData {
  nombre: string;
  correo: string;
  rol: string;
}

export default function HomeScreen() {
  const [user, setUser] = useState<UserData | null>(null);

  // Al cargar la pantalla, leemos los datos guardados en el celular
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem('userInfo');
        if (jsonValue != null) {
          setUser(JSON.parse(jsonValue));
        }
      } catch (e) {
        console.error("Error cargando datos", e);
      }
    };
    loadUserData();
  }, []);

  // Función para Cerrar Sesión
  const handleLogout = async () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro que deseas salir?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Salir", 
          style: 'destructive',
          onPress: async () => {
            // 1. Borramos el token y los datos
            await AsyncStorage.clear();
            // 2. Redirigimos al Login (usamos replace para no volver atrás)
            router.replace('/');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* HEADER: Saludo y Perfil */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola, {user?.nombre || 'Usuario'}</Text>
            <Text style={styles.roleText}>
              {user?.rol ? user.rol.toUpperCase() : 'CARGANDO...'}
            </Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.profileButton}>
            <Image 
              source={{ uri: 'https://ui-avatars.com/api/?name=' + (user?.nombre || 'User') + '&background=2e7d32&color=fff' }} 
              style={styles.avatar} 
            />
          </TouchableOpacity>
        </View>

        {/* TARJETA DE RESUMEN (KPIs de Venta) */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Resumen del Mes</Text>
          <View style={styles.kpiContainer}>
            <View style={styles.kpiItem}>
              <Text style={styles.kpiNumber}>12</Text>
              <Text style={styles.kpiLabel}>Visitas</Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.kpiItem}>
              <Text style={styles.kpiNumber}>5</Text>
              <Text style={styles.kpiLabel}>Pedidos</Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.kpiItem}>
              <Text style={styles.kpiNumber}>98%</Text>
              <Text style={styles.kpiLabel}>Meta</Text>
            </View>
          </View>
        </View>

        {/* MENÚ DE ACCIONES (GRID) */}
        <Text style={styles.sectionTitle}>Menú Principal</Text>
        
        <View style={styles.gridContainer}>
          {/* Opción 1: Clientes */}
          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.iconBox, { backgroundColor: '#e8f5e9' }]}>
              <Ionicons name="people" size={32} color="#2e7d32" />
            </View>
            <Text style={styles.menuText}>Mis Clientes</Text>
          </TouchableOpacity>

          {/* Opción 2: Catálogo */}
          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.iconBox, { backgroundColor: '#fff3e0' }]}>
              <Ionicons name="cube" size={32} color="#f57c00" />
            </View>
            <Text style={styles.menuText}>Productos</Text>
          </TouchableOpacity>

          {/* Opción 3: Pedidos */}
          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.iconBox, { backgroundColor: '#e3f2fd' }]}>
              <Ionicons name="cart" size={32} color="#1565c0" />
            </View>
            <Text style={styles.menuText}>Nuevo Pedido</Text>
          </TouchableOpacity>

          {/* Opción 4: Rutas */}
          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.iconBox, { backgroundColor: '#fce4ec' }]}>
              <Ionicons name="map" size={32} color="#c2185b" />
            </View>
            <Text style={styles.menuText}>Mi Ruta</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scrollContent: { padding: 20 },
  
  // Header Style
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
  roleText: { fontSize: 14, color: '#2e7d32', fontWeight: '600', marginTop: 2 },
  profileButton: { elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
  avatar: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: '#fff' },

  // Summary Card Style
  summaryCard: { backgroundColor: '#2e7d32', borderRadius: 20, padding: 20, marginBottom: 30, shadowColor: '#2e7d32', shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  summaryTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 15, fontWeight: 'bold', textTransform: 'uppercase' },
  kpiContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kpiItem: { alignItems: 'center', flex: 1 },
  kpiNumber: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  kpiLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 },
  separator: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.3)' },

  // Grid Style
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#374151', marginBottom: 15 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  menuItem: { width: '48%', backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 15, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  iconBox: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  menuText: { fontSize: 15, fontWeight: '600', color: '#333' },
}); 