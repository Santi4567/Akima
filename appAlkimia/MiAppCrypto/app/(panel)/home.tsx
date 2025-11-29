import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

interface UserData {
  nombre: string;
  correo: string;
  rol: string;
}

export default function HomeScreen() {
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem('userInfo');
        if (jsonValue != null) setUser(JSON.parse(jsonValue));
      } catch (e) { console.error(e); }
    };
    loadUserData();
  }, []);

  const handleLogout = async () => {
    Alert.alert("Cerrar Sesión", "¿Salir?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Salir", style: 'destructive', onPress: async () => {
          await AsyncStorage.clear();
          router.replace('/');
      }}
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* HEADER VERTICAL */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleLogout} style={styles.profileButton}>
            <Image 
              source={{ uri: 'https://ui-avatars.com/api/?name=' + (user?.nombre || 'User') + '&background=2e7d32&color=fff&size=128' }} 
              style={styles.avatar} 
            />
            <View style={styles.editIconBadge}><Ionicons name="log-out" size={12} color="#fff" /></View>
          </TouchableOpacity>

          <View style={styles.headerTextContainer}>
            <Text style={styles.greeting}>Hola, {user?.nombre || 'Usuario'}</Text>
            <Text style={styles.roleText}>{user?.rol ? user.rol.toUpperCase() : '...'}</Text>
          </View>
        </View>

        {/* MENÚ SIMPLIFICADO (Solo 2 Opciones) */}
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
        
        <View style={styles.gridContainer}>
          
          {/* 1. PRODUCTOS (Catálogo Visual) */}
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(panel)/productos')}>
            <View style={[styles.iconBox, { backgroundColor: '#fff3e0' }]}>
              <Ionicons name="images" size={32} color="#f57c00" />
            </View>
            <Text style={styles.menuText}>Catálogo de Productos</Text>
          </TouchableOpacity>

          {/* 2. MI RUTA (Agenda) */}
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(panel)/ruta')}>
            <View style={[styles.iconBox, { backgroundColor: '#fce4ec' }]}>
              <Ionicons name="map" size={32} color="#c2185b" />
            </View>
            <Text style={styles.menuText}>Mi Ruta de Hoy</Text>
          </TouchableOpacity>

        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scrollContent: { padding: 20 },
  header: { alignItems: 'center', marginBottom: 25, marginTop: 10 },
  profileButton: { marginBottom: 15, elevation: 8, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 4 } },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: '#fff' },
  editIconBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#d32f2f', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  headerTextContainer: { alignItems: 'center', width: '100%' },
  greeting: { fontSize: 26, fontWeight: 'bold', color: '#1f2937', textAlign: 'center', marginBottom: 4 },
  roleText: { fontSize: 14, color: '#2e7d32', fontWeight: 'bold', marginTop: 0, letterSpacing: 1, backgroundColor: '#e8f5e9', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, overflow: 'hidden' },
  
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#374151', marginBottom: 15 },
  gridContainer: { flexDirection: 'row', justifyContent: 'space-between' }, // Alineados uno al lado del otro
  menuItem: { width: '48%', backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 15, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, minHeight: 150, justifyContent: 'center' },
  iconBox: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  menuText: { fontSize: 16, fontWeight: '600', color: '#333', textAlign: 'center' },
});