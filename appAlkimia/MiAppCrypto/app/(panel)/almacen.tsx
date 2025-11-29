import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { usePermissions } from '@/hooks/usePermissions';

export default function AlmacenMenuScreen() {
  const { hasPermission, loading } = usePermissions();
  
  // Permisos requeridos para ver los botones
  const canViewStock = hasPermission('view.products');
  const canViewOrders = hasPermission('view.all.order');

  if (loading) return <View style={styles.container} />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Almacén</Text>
        <Text style={styles.headerSub}>Gestión de Inventario y Despacho</Text>
      </View>

      <ScrollView contentContainerStyle={styles.gridContainer}>
        
        {/* OPCIÓN 1: INVENTARIO (Scanner / Kardex) */}
        <TouchableOpacity 
          style={[styles.card, !canViewStock && styles.cardDisabled]}
          onPress={() => canViewStock ? router.push('/(panel)/inventario') : null}
          activeOpacity={0.7}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#e3f2fd' }]}>
            <Ionicons name="cube" size={32} color="#1565c0" />
          </View>
          <View style={styles.textContainer}>
             <Text style={styles.cardTitle}>Inventario y Kardex</Text>
             <Text style={styles.cardSub}>Consultar stock, auditar y ajustar</Text>
          </View>
          {canViewStock && <Ionicons name="chevron-forward" size={20} color="#ccc" />}
        </TouchableOpacity>

        {/* OPCIÓN 2: DESPACHO (Pedidos) */}
        <TouchableOpacity 
          style={[styles.card, !canViewOrders && styles.cardDisabled]}
          onPress={() => canViewOrders ? router.push('/(panel)/despacho') : null}
          activeOpacity={0.7}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#fff3e0' }]}>
            <Ionicons name="clipboard" size={32} color="#ef6c00" />
          </View>
          <View style={styles.textContainer}>
             <Text style={styles.cardTitle}>Surtir Pedidos</Text>
             <Text style={styles.cardSub}>Empacar y enviar mercancía</Text>
          </View>
          {canViewOrders && <Ionicons name="chevron-forward" size={20} color="#ccc" />}
        </TouchableOpacity>

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
  card: { width: '100%', padding: 20, borderRadius: 20, marginBottom: 15, elevation: 2, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center' },
  cardDisabled: { opacity: 0.5, backgroundColor: '#f0f0f0' },
  iconCircle: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  textContainer: { flex: 1, justifyContent: 'center' }, 
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  cardSub: { fontSize: 13, color: '#666' },
});