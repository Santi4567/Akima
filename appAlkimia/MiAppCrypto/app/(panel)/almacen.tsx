import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AlmacenScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Almacén & Stock</Text>
      </View>

      <View style={styles.grid}>
        <TouchableOpacity style={styles.card}>
          <Ionicons name="barcode-outline" size={40} color="#f57c00" />
          <Text style={styles.cardText}>Escanear</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <Ionicons name="cube-outline" size={40} color="#1565c0" />
          <Text style={styles.cardText}>Inventario</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <Ionicons name="swap-horizontal-outline" size={40} color="#43a047" />
          <Text style={styles.cardText}>Salidas</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.card}>
          <Ionicons name="download-outline" size={40} color="#c2185b" />
          <Text style={styles.cardText}>Entradas</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { padding: 20, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#374151' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 15, justifyContent: 'space-between' },
  card: { width: '47%', backgroundColor: '#fff', padding: 30, borderRadius: 15, alignItems: 'center', marginBottom: 20, elevation: 3 },
  cardText: { marginTop: 10, fontSize: 16, fontWeight: '500', color: '#333' },
});