import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { usePermissions } from '@/hooks/usePermissions';

export default function PagosMenuScreen() {
  const { hasPermission, loading } = usePermissions();
  const canCobrar = hasPermission('add.payment');

  if (loading) return <View style={styles.container} />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Módulo de Pagos</Text>
        <Text style={styles.headerSub}>Gestiona cobros y caja</Text>
      </View>

      <ScrollView contentContainerStyle={styles.gridContainer}>
        
        <TouchableOpacity 
          style={[styles.card, !canCobrar && styles.cardDisabled]}
          onPress={() => canCobrar ? router.push('/(panel)/generar-pago') : null}
          activeOpacity={0.7}
        >
          {/* 1. ÍCONO (Izquierda) */}
          <View style={[styles.iconCircle, { backgroundColor: canCobrar ? '#e8f5e9' : '#eee' }]}>
            <Ionicons 
                name={canCobrar ? "cash" : "lock-closed"} 
                size={32} 
                color={canCobrar ? "#2e7d32" : "#999"} 
            />
          </View>

          {/* 2. CONTENEDOR DE TEXTO (Derecha - Vertical) */}
          <View style={styles.textContainer}> 
             <Text style={styles.cardTitle}>Generar Pago</Text>
             <Text style={styles.cardSub}>
                {canCobrar ? "Registrar abono a orden" : "Sin permisos"}
             </Text>
          </View>
          
          {/* 3. FLECHITA (Opcional, para indicar click) */}
          {canCobrar && <Ionicons name="chevron-forward" size={20} color="#ccc" />}

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
  
  card: { 
    width: '100%', 
    padding: 20, 
    borderRadius: 20, 
    marginBottom: 15, 
    elevation: 2, 
    backgroundColor: '#fff', 
    flexDirection: 'row', // Mantiene los elementos principales en fila
    alignItems: 'center' 
  },
  cardDisabled: { opacity: 0.6, backgroundColor: '#f0f0f0' },
  
  iconCircle: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  
  // ESTILO NUEVO PARA QUE LOS TEXTOS SE APILEN
  textContainer: { flex: 1, justifyContent: 'center' }, 

  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  cardSub: { fontSize: 14, color: '#666' },
});