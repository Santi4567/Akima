import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function PagosScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Módulo de Pagos</Text>
      <Text style={styles.subtext}>Selecciona una orden para cobrar</Text>
      {/* Aquí desarrollaremos la lógica de pagos más adelante */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 20, fontWeight: 'bold' },
  subtext: { color: '#666', marginTop: 10 }
});