import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function VendedorMenuScreen() {
  
  const menuItems = [
    {
      title: "Levantar Pedido",
      subtitle: "Crear nueva venta",
      icon: "cart",
      color: "#2e7d32", // Verde fuerte
      bg: "#e8f5e9",    // Verde claro
      action: () => router.push('/(panel)/nueva-orden')
    },
    {
      title: "Mis Clientes",
      subtitle: "Directorio y contactos",
      icon: "people",
      color: "#1565c0", // Azul
      bg: "#e3f2fd",
      action: () => router.push('/(panel)/clientes')
      
    },
    {
      title: "Mi Ruta",
      subtitle: "Visitas de hoy",
      icon: "map",
      color: "#c62828", // Rojo
      bg: "#ffebee",
      action: () => router.push('/(panel)/ruta')
    },
    {
      title: "Historial",
      subtitle: "Mis ventas pasadas",
      icon: "time",
      color: "#f9a825", // Amarillo oscuro
      bg: "#fffde7",
      action: () => router.push('/(panel)/historial-ordenes')
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Panel de Ventas</Text>
        <Text style={styles.headerSub}>Selecciona una acción</Text>
      </View>

      <ScrollView contentContainerStyle={styles.gridContainer}>
        {/* KPI Rápido (Opcional) */}
        <View style={styles.kpiCard}>
            <View>
                <Text style={styles.kpiLabel}>Ventas del mes</Text>
                <Text style={styles.kpiValue}>$45,200</Text>
            </View>
            <View style={styles.kpiIcon}>
                <Ionicons name="trending-up" size={28} color="#fff" />
            </View>
        </View>

        <Text style={styles.sectionTitle}>Acciones Principales</Text>

        <View style={styles.grid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={[styles.card, { backgroundColor: item.bg }]}
              onPress={item.action}
              activeOpacity={0.7}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#fff' }]}>
                {/* @ts-ignore */}
                <Ionicons name={item.icon} size={32} color={item.color} />
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSub}>{item.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { padding: 20, paddingBottom: 10 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#1f2937' },
  headerSub: { fontSize: 16, color: '#6b7280', marginTop: 5 },
  
  gridContainer: { padding: 20 },
  
  kpiCard: { backgroundColor: '#2e7d32', borderRadius: 16, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, elevation: 4, shadowColor: '#2e7d32', shadowOpacity: 0.3, shadowRadius: 5 },
  kpiLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 5 },
  kpiValue: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  kpiIcon: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 12 },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#374151', marginBottom: 15 },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', padding: 20, borderRadius: 20, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, minHeight: 160, justifyContent: 'center' },
  iconCircle: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  cardSub: { fontSize: 12, color: '#666' },
});