import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ScrollView, ActivityIndicator, Modal, FlatList, Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useToast } from '@/components/ToastNotification';
import { usePermissions } from '@/hooks/usePermissions';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function InventarioScreen() {
  // --- ESTADOS ---
  const [query, setQuery] = useState('');
  const [product, setProduct] = useState<any>(null); // Producto seleccionado
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]); // Historial Kardex
  const [activeTab, setActiveTab] = useState<'details' | 'kardex'>('details');

  // Modal de Ajuste
  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [adjustType, setAdjustType] = useState<'add' | 'subtract' | 'set'>('add');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  
  const { showToast } = useToast();
  const { hasPermission } = usePermissions();
  const canAdjust = hasPermission('adjust.inventory');

  // --- 1. BUSCAR PRODUCTO ---
  const searchProduct = async () => {
    if (query.length < 2) return;
    setLoading(true);
    setProduct(null);
    setLogs([]);

    try {
      const token = await AsyncStorage.getItem('userToken');
      // endpoint de búsqueda
      const res = await fetch(`${API_URL}/api/products/search?q=${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success && data.data.length > 0) {
        setProduct(data.data[0]); // Seleccionamos el primero automáticamente
        loadKardex(data.data[0].id); // Cargamos historial inmediatamente
      } else {
        showToast(false, "Producto no encontrado");
      }
    } catch (error) {
      showToast(false, "Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  // --- 2. CARGAR KARDEX (HISTORIAL) ---
  const loadKardex = async (productId: number) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${API_URL}/api/products/${productId}/inventory-logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.data);
      }
    } catch (e) { console.error("Error kardex", e); }
  };

  // --- 3. AJUSTAR STOCK (PUT) ---
  const handleAdjust = async () => {
    if (!adjustQty || !adjustReason) {
        showToast(false, "Cantidad y Razón son obligatorios");
        return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      const payload = {
          type: adjustType,
          quantity: parseInt(adjustQty),
          reason: adjustReason
      };

      const res = await fetch(`${API_URL}/api/products/${product.id}/inventory`, {
          method: 'PUT',
          headers: { 
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify(payload)
      });

      const data = await res.json(); // Tu API no devolvía data en el ejemplo, pero validamos success

      if (res.ok) { // Aceptamos 200 o 201
          showToast(true, "Movimiento registrado ✅");
          setAdjustModalVisible(false);
          setAdjustQty(''); setAdjustReason('');
          
          // Recargamos datos
          searchProduct(); 
      } else {
          showToast(false, "Error al ajustar inventario");
      }

    } catch (error) {
        showToast(false, "Error de conexión");
    }
  };

  // --- RENDERIZADO ---

  // Tarjeta de Movimiento (Kardex)
// Tarjeta de Movimiento (Kardex) - DISEÑO VERTICAL CORREGIDO
  const renderLogItem = ({ item }: { item: any }) => {
    let icon = "swap-horizontal";
    let color = "#555";
    let sign = "";

    if (item.type === 'add') { icon = "arrow-up-circle"; color = "#2e7d32"; sign = "+"; }
    if (item.type === 'subtract') { icon = "arrow-down-circle"; color = "#d32f2f"; sign = "-"; }
    if (item.type === 'set') { icon = "checkmark-circle"; color = "#1565c0"; sign = "="; }

    return (
      <View style={styles.logCard}>
        
        {/* 1. ICONO Y RAZÓN */}
        <View style={{flexDirection:'row', alignItems:'center', marginBottom: 5}}>
            <Ionicons name={icon as any} size={22} color={color} />
            <Text style={styles.logReason}>{item.reason}</Text>
        </View>

        {/* 2. USUARIO */}
        <Text style={styles.logUser}>
            Autor: {item.user_name} <Text style={{color:'#888'}}>({item.user_role})</Text>
        </Text>

        {/* 3. FECHA Y CANTIDAD (NUEVA FILA) */}
        <View style={styles.logDataRow}>
            {/* Fecha a la izquierda */}
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Ionicons name="calendar-outline" size={14} color="#888" />
                <Text style={styles.logDate}>
                    {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                </Text>
            </View>

            {/* Cantidad a la derecha */}
            <Text style={[styles.logQty, {color}]}>
                {item.type === 'set' ? 'Ajuste a: ' : 'Cantidad: '} 
                <Text style={{fontWeight: 'bold', fontSize: 16}}>{sign}{item.quantity}</Text>
            </Text>
        </View>

        {/* 4. FOOTER STOCK */}
        <View style={styles.logFooter}>
            <Text style={styles.logStockChange}>
                Stock: {item.previous_stock} ➔ <Text style={{fontWeight:'bold', color: '#333'}}>{item.new_stock}</Text>
            </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(panel)/almacen')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Consultar Inventario</Text>
        <View style={{width: 24}} />
      </View>

      {/* BUSCADOR (SCANNER SIMULADO) */}
      <View style={styles.searchBar}>
        <Ionicons name="barcode-outline" size={24} color="#666" />
        <TextInput 
            style={styles.searchInput}
            placeholder="Escanear SKU o buscar..."
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={searchProduct}
        />
        <TouchableOpacity onPress={searchProduct} style={styles.searchBtn}>
            <Ionicons name="search" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* CONTENIDO PRINCIPAL */}
      {loading ? (
        <ActivityIndicator size="large" color="#1565c0" style={{marginTop: 50}} />
      ) : product ? (
        <View style={{flex: 1}}>
            
            {/* INFO PRODUCTO */}
            <View style={styles.productCard}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productSku}>SKU: {product.sku}</Text>
                
                <View style={styles.stockRow}>
                    <View>
                        <Text style={styles.stockLabel}>Stock Actual</Text>
                        <Text style={[styles.stockValue, product.stock_quantity < 0 && {color:'#d32f2f'}]}>
                            {product.stock_quantity} pzas
                        </Text>
                    </View>
                    {/* Botón de Ajuste (Solo con permiso) */}
                    {canAdjust && (
                        <TouchableOpacity style={styles.adjustBtn} onPress={() => setAdjustModalVisible(true)}>
                            <Ionicons name="construct-outline" size={20} color="#fff" />
                            <Text style={styles.adjustBtnText}>Ajustar</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* TABS */}
            <View style={styles.tabs}>
                <TouchableOpacity onPress={() => setActiveTab('details')} style={[styles.tab, activeTab === 'details' && styles.activeTab]}>
                    <Text style={[styles.tabText, activeTab === 'details' && styles.activeTabText]}>Detalles</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setActiveTab('kardex')} style={[styles.tab, activeTab === 'kardex' && styles.activeTab]}>
                    <Text style={[styles.tabText, activeTab === 'kardex' && styles.activeTabText]}>Kardex (Historial)</Text>
                </TouchableOpacity>
            </View>

            {/* VISTA: DETALLES */}
            {activeTab === 'details' && (
                <ScrollView contentContainerStyle={{padding: 20}}>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Ubicación:</Text>
                        <Text style={styles.detailValue}>Pasillo A, Estante 4 (Simulado)</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Precio Venta:</Text>
                        <Text style={styles.detailValue}>${product.price}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Costo:</Text>
                        <Text style={styles.detailValue}>${product.cost_price}</Text>
                    </View>
                    <Text style={[styles.detailLabel, {marginTop: 15}]}>Descripción:</Text>
                    <Text style={styles.descText}>{product.description}</Text>
                </ScrollView>
            )}

            {/* VISTA: KARDEX */}
            {activeTab === 'kardex' && (
                <FlatList
                    data={logs}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderLogItem}
                    contentContainerStyle={{padding: 15}}
                    ListEmptyComponent={<Text style={styles.emptyText}>No hay movimientos recientes.</Text>}
                />
            )}

        </View>
      ) : (
        <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={60} color="#ddd" />
            <Text style={styles.emptyText}>Escanea un producto para ver su información.</Text>
        </View>
      )}

      {/* --- MODAL DE AJUSTE DE INVENTARIO --- */}
      <Modal visible={adjustModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Ajuste de Inventario</Text>
                <Text style={styles.modalSub}>{product?.name}</Text>

                {/* SELECTOR DE TIPO */}
                <View style={styles.typeSelector}>
                    <TouchableOpacity 
                        style={[styles.typeBtn, adjustType === 'add' && {backgroundColor: '#e8f5e9', borderColor: '#2e7d32'}]}
                        onPress={() => setAdjustType('add')}
                    >
                        <Ionicons name="arrow-up" size={20} color={adjustType === 'add' ? "#2e7d32" : "#999"} />
                        <Text style={[styles.typeText, adjustType === 'add' && {color: '#2e7d32'}]}>Entrada</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.typeBtn, adjustType === 'subtract' && {backgroundColor: '#ffebee', borderColor: '#d32f2f'}]}
                        onPress={() => setAdjustType('subtract')}
                    >
                        <Ionicons name="arrow-down" size={20} color={adjustType === 'subtract' ? "#d32f2f" : "#999"} />
                        <Text style={[styles.typeText, adjustType === 'subtract' && {color: '#d32f2f'}]}>Salida</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.typeBtn, adjustType === 'set' && {backgroundColor: '#e3f2fd', borderColor: '#1565c0'}]}
                        onPress={() => setAdjustType('set')}
                    >
                        <Ionicons name="pencil" size={20} color={adjustType === 'set' ? "#1565c0" : "#999"} />
                        <Text style={[styles.typeText, adjustType === 'set' && {color: '#1565c0'}]}>Fijar</Text>
                    </TouchableOpacity>
                </View>

                {/* FORMULARIO */}
                <Text style={styles.label}>Cantidad:</Text>
                <TextInput 
                    style={[styles.input, {fontSize: 20, fontWeight:'bold', textAlign:'center'}]} 
                    keyboardType="numeric"
                    placeholder="0"
                    value={adjustQty}
                    onChangeText={setAdjustQty}
                />

                <Text style={styles.label}>Motivo / Razón:</Text>
                <TextInput 
                    style={[styles.input, {height: 60}]} 
                    placeholder="Ej: Llegada de proveedor, Merma..."
                    multiline
                    value={adjustReason}
                    onChangeText={setAdjustReason}
                />

                <View style={styles.modalButtons}>
                    <TouchableOpacity onPress={() => setAdjustModalVisible(false)} style={styles.btnCancel}>
                        <Text>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleAdjust} style={styles.btnConfirm}>
                        <Text style={{color:'#fff', fontWeight:'bold'}}>Confirmar Ajuste</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#fff', elevation: 2 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1565c0' },
  backBtn: { padding: 5 },

  searchBar: { flexDirection: 'row', margin: 15, backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 10, height: 50, alignItems: 'center', elevation: 2 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  searchBtn: { backgroundColor: '#1565c0', padding: 8, borderRadius: 8 },

  productCard: { backgroundColor: '#fff', margin: 15, marginTop: 5, padding: 20, borderRadius: 15, elevation: 3 },
  productName: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  productSku: { fontSize: 14, color: '#666', marginBottom: 15 },
  stockRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 15 },
  stockLabel: { fontSize: 12, color: '#888', textTransform: 'uppercase' },
  stockValue: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  adjustBtn: { flexDirection: 'row', backgroundColor: '#1565c0', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, alignItems: 'center' },
  adjustBtnText: { color: '#fff', fontWeight: 'bold', marginLeft: 5 },

  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  tab: { flex: 1, padding: 15, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#1565c0' },
  tabText: { fontWeight: '600', color: '#888' },
  activeTabText: { color: '#1565c0' },

  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  detailLabel: { fontWeight: '600', color: '#555' },
  detailValue: { color: '#333' },
  descText: { marginTop: 5, lineHeight: 20, color: '#444' },

logCard: { 
    backgroundColor: '#fff', 
    padding: 15, 
    marginBottom: 12, // Un poco más de espacio entre tarjetas
    borderRadius: 12, 
    elevation: 2,
    borderLeftWidth: 4, // Decoración visual
    borderLeftColor: '#ddd' // Se puede hacer dinámico en el render si quieres
  },
  
  // Quitamos logHeader porque ya no usamos esa fila única
  
  logReason: { 
    fontWeight: 'bold', 
    fontSize: 15, 
    color: '#333', 
    marginLeft: 8,
    flex: 1 // Para que si el texto es largo no empuje el icono
  },
  
  logUser: { 
    fontSize: 13, 
    color: '#555', 
    marginBottom: 8, // Separación con la fecha
    marginLeft: 30 // Indentado para alinearse con el texto de arriba
  },

  // ESTILO NUEVO PARA LA FILA DE FECHA/CANTIDAD
  logDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5'
  },

  logDate: { 
    fontSize: 12, 
    color: '#888', 
    marginLeft: 5 
  },
  
  logQty: { 
    fontSize: 13, 
    fontWeight: '600' 
  },
  
  logFooter: { 
    backgroundColor: '#f9f9f9',
    padding: 8,
    borderRadius: 6,
    marginTop: 0 // Ya está separado por el row anterior
  },
  
  logStockChange: { 
    fontSize: 12, 
    color: '#555', 
    textAlign: 'center' 
  },

  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#999', marginTop: 10 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  modalSub: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 },
  
  typeSelector: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  typeBtn: { width: '30%', padding: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, alignItems: 'center' },
  typeText: { fontSize: 12, fontWeight: 'bold', marginTop: 5, color: '#999' },

  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 15, backgroundColor: '#fafafa' },
  label: { marginBottom: 5, fontWeight: '600', color: '#444' },
  
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, marginBottom: 20 },
  btnCancel: { padding: 15, backgroundColor: '#eee', borderRadius: 10, flex: 1, marginRight: 10, alignItems: 'center' },
  btnConfirm: { padding: 15, backgroundColor: '#1565c0', borderRadius: 10, flex: 1, alignItems: 'center' },
});