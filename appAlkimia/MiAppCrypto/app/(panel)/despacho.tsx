import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  Modal, TextInput, ActivityIndicator, ScrollView, Alert, Switch 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useToast } from '@/components/ToastNotification';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function DespachoScreen() {
  // Estados de Lista
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'processing'>('pending'); // 'pending' = Por Empacar, 'processing' = Por Enviar

  // Estados de Detalle (Packing)
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [checkedItems, setCheckedItems] = useState<{[key: number]: boolean}>({}); // Para marcar checklist

  // Modales
  const [trackingModalVisible, setTrackingModalVisible] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  
  const [exceptionModalVisible, setExceptionModalVisible] = useState(false);
  const [missingItem, setMissingItem] = useState<any>(null);
  const [missingReason, setMissingReason] = useState('damaged_inventory');

  const { showToast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, activeTab]);

  // --- 1. CARGAR PEDIDOS ---
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${API_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        // Solo nos interesan los activos para almacén
        const active = data.data.filter((o: any) => 
            o.status === 'pending' || o.status === 'processing'
        );
        setOrders(active);
      }
    } catch (e) { showToast(false, "Error al cargar pedidos"); }
    finally { setLoading(false); }
  };

  const filterOrders = () => {
    const list = orders.filter(o => o.status === activeTab);
    // Ordenar: Los más viejos primero (FIFO - First In First Out)
    list.sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    setFilteredOrders(list);
  };

  // --- 2. DETALLE Y CHECKLIST ---
  const openOrder = async (order: any) => {
    setSelectedOrder(order);
    setLoadingItems(true);
    setCheckedItems({}); // Resetear checklist
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${API_URL}/api/orders/${order.id}/items`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setOrderItems(data.data);
    } catch (e) { showToast(false, "Error al cargar items"); }
    finally { setLoadingItems(false); }
  };

  const toggleCheck = (itemId: number) => {
    setCheckedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  // --- 3. CAMBIAR ESTADO (WORKFLOW) ---
  
  // A) DE PENDING A PROCESSING (Empezar a Empacar)
  const startPacking = async () => {
    await updateStatus('processing');
    setActiveTab('processing'); // Cambiar de pestaña automáticamente
  };

  // B) DE PROCESSING A SHIPPED (Confirmar Envío)
  const openShippingModal = () => {
    // Validar que todo esté "chequeado" (Opcional, pero buena práctica)
    const allChecked = orderItems.every(i => checkedItems[i.id]);
    if (!allChecked) {
        Alert.alert("Atención", "No has marcado todos los items como empacados. ¿Continuar igual?", [
            { text: "Revisar", style: "cancel" },
            { text: "Sí, enviar", onPress: () => setTrackingModalVisible(true) }
        ]);
    } else {
        setTrackingModalVisible(true);
    }
  };

  const confirmShipping = async () => {
    if (!trackingNumber) {
        showToast(false, "Ingresa el número de guía/rastreo");
        return;
    }
    await updateStatus('shipped', trackingNumber);
    setTrackingModalVisible(false);
    setTrackingNumber('');
  };

  // FUNCIÓN GENÉRICA PUT STATUS
  const updateStatus = async (status: string, tracking?: string) => {
    try {
        const token = await AsyncStorage.getItem('userToken');
        const payload: any = { status };
        if (tracking) payload.tracking_number = tracking;

        const res = await fetch(`${API_URL}/api/orders/${selectedOrder.id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        
        if (res.ok) { // A veces devuelven 200 sin success: true explicito, validamos ok
            showToast(true, status === 'shipped' ? "Pedido Enviado 🚀" : "Iniciando empaque 📦");
            setSelectedOrder(null); // Cerrar modal
            fetchOrders(); // Recargar lista
        } else {
            showToast(false, data.message || "Error al actualizar");
        }
    } catch (e) { showToast(false, "Error de conexión"); }
  };

  // --- 4. EXCEPCIONES (FALTANTES) ---
  const handleReportMissing = (item: any) => {
    setMissingItem(item);
    setExceptionModalVisible(true);
  };

  const confirmException = async () => {
    try {
        const token = await AsyncStorage.getItem('userToken');
        const payload = {
            order_id: selectedOrder.id,
            product_id: missingItem.product_id, // Asegúrate de tener este ID
            quantity: 1, // Por simplicidad reportamos de 1 en 1, o podrías poner input
            reason: missingReason,
            action: 'refund' // O 'backorder' si tu sistema lo soporta
        };

        const res = await fetch(`${API_URL}/api/returns`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (data.success || res.ok) {
            showToast(true, "Faltante reportado. Inventario ajustado.");
            setExceptionModalVisible(false);
            // Opcional: Recargar items para ver si desaparece o cambia
        } else {
            showToast(false, "Error al reportar");
        }
    } catch (e) { showToast(false, "Error de conexión"); }
  };


  // --- RENDERIZADO ---
  const renderOrderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} onPress={() => openOrder(item)}>
        <View style={styles.cardHeader}>
            <Text style={styles.orderId}>Orden #{item.id}</Text>
            <Text style={styles.dateText}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
        <Text style={styles.clientName}>{item.client_name}</Text>
        <Text style={styles.itemsCount}>Ver detalle de empaque...</Text>
        
        {item.shipping_address && (
            <View style={styles.addressBox}>
                <Ionicons name="location-outline" size={12} color="#666" />
                <Text style={styles.addressText} numberOfLines={1}>{item.shipping_address}</Text>
            </View>
        )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Despacho de Pedidos</Text>
        <View style={{width: 24}}/>
      </View>

      {/* TABS */}
      <View style={styles.tabs}>
        <TouchableOpacity 
            style={[styles.tab, activeTab === 'pending' && styles.activeTab]} 
            onPress={() => setActiveTab('pending')}
        >
            <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>Por Empacar</Text>
            {/* Badge Count (Simulado) */}
            <View style={styles.badge}><Text style={styles.badgeText}>{orders.filter(o=>o.status==='pending').length}</Text></View>
        </TouchableOpacity>
        
        <TouchableOpacity 
            style={[styles.tab, activeTab === 'processing' && styles.activeTab]} 
            onPress={() => setActiveTab('processing')}
        >
            <Text style={[styles.tabText, activeTab === 'processing' && styles.activeTabText]}>En Proceso / Envío</Text>
            <View style={[styles.badge, {backgroundColor: '#e3f2fd'}]}><Text style={[styles.badgeText, {color: '#1565c0'}]}>{orders.filter(o=>o.status==='processing').length}</Text></View>
        </TouchableOpacity>
      </View>

      {/* LISTA PEDIDOS */}
      {loading ? (
        <ActivityIndicator size="large" color="#1565c0" style={{marginTop: 50}} />
      ) : (
        <FlatList 
            data={filteredOrders}
            keyExtractor={item => item.id.toString()}
            renderItem={renderOrderItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<Text style={styles.emptyText}>No hay pedidos en esta etapa.</Text>}
        />
      )}

      {/* --- MODAL DETALLE (PACKING LIST) --- */}
      <Modal visible={!!selectedOrder} animationType="slide" presentationStyle="pageSheet">
        {selectedOrder && (
            <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Orden #{selectedOrder.id}</Text>
                    <TouchableOpacity onPress={() => setSelectedOrder(null)}>
                        <Ionicons name="close" size={28} color="#333" />
                    </TouchableOpacity>
                </View>

                {/* Info Cliente */}
                <View style={styles.clientInfo}>
                    <Text style={styles.clientLabel}>Cliente:</Text>
                    <Text style={styles.clientValue}>{selectedOrder.client_name}</Text>
                    <Text style={styles.clientAddress}>📍 {selectedOrder.shipping_address || "Sin dirección"}</Text>
                </View>

                <Text style={styles.sectionTitle}>Lista de Empaque (Packing List)</Text>

                <ScrollView style={styles.itemsList}>
                    {loadingItems ? (
                        <ActivityIndicator color="#1565c0" />
                    ) : (
                        orderItems.map((item, index) => {
                            const isChecked = checkedItems[item.id];
                            return (
                                <View key={index} style={[styles.itemRow, isChecked && styles.itemChecked]}>
                                    <TouchableOpacity 
                                        style={styles.checkboxArea} 
                                        onPress={() => toggleCheck(item.id)}
                                    >
                                        <Ionicons 
                                            name={isChecked ? "checkbox" : "square-outline"} 
                                            size={28} 
                                            color={isChecked ? "#2e7d32" : "#999"} 
                                        />
                                        <View style={{marginLeft: 10, flex: 1}}>
                                            <Text style={[styles.itemName, isChecked && {textDecorationLine:'line-through', color:'#aaa'}]}>
                                                {item.product_name}
                                            </Text>
                                            <Text style={styles.itemSku}>SKU: {item.sku}</Text>
                                        </View>
                                        <Text style={styles.itemQty}>x{item.quantity}</Text>
                                    </TouchableOpacity>
                                    
                                    {/* Botón de Excepción (Solo si no está checkeado) */}
                                    {!isChecked && (
                                        <TouchableOpacity 
                                            style={styles.missingBtn} 
                                            onPress={() => handleReportMissing(item)}
                                        >
                                            <Ionicons name="alert-circle" size={24} color="#d32f2f" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            );
                        })
                    )}
                </ScrollView>

                {/* BOTONES DE ACCIÓN (Workflow) */}
                <View style={styles.footerActions}>
                    {selectedOrder.status === 'pending' ? (
                        <TouchableOpacity style={styles.actionButton} onPress={startPacking}>
                            <Text style={styles.actionText}>EMPEZAR A EMPACAR</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={[styles.actionButton, {backgroundColor: '#2e7d32'}]} onPress={openShippingModal}>
                            <Ionicons name="paper-plane" size={20} color="#fff" style={{marginRight: 10}} />
                            <Text style={styles.actionText}>CONFIRMAR ENVÍO</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        )}
      </Modal>

      {/* --- MODAL TRACKING NUMBER --- */}
      <Modal visible={trackingModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
            <View style={styles.modalSmall}>
                <Text style={styles.modalTitle}>Envío Realizado</Text>
                <Text style={styles.label}>Número de Guía / Tracking:</Text>
                <TextInput 
                    style={styles.input} 
                    placeholder="Ej: MX-123456789" 
                    value={trackingNumber}
                    onChangeText={setTrackingNumber}
                />
                <View style={styles.rowBtns}>
                    <TouchableOpacity onPress={() => setTrackingModalVisible(false)} style={styles.btnCancel}><Text>Cancelar</Text></TouchableOpacity>
                    <TouchableOpacity onPress={confirmShipping} style={styles.btnConfirm}><Text style={{color:'#fff'}}>Guardar y Enviar</Text></TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>

      {/* --- MODAL EXCEPCIÓN (FALTANTE) --- */}
      <Modal visible={exceptionModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
            <View style={[styles.modalSmall, {borderLeftColor: '#d32f2f', borderLeftWidth: 5}]}>
                <Text style={[styles.modalTitle, {color: '#d32f2f'}]}>Reportar Faltante</Text>
                <Text style={styles.modalSub}>{missingItem?.product_name}</Text>
                
                <Text style={styles.label}>Razón:</Text>
                <TouchableOpacity onPress={() => setMissingReason('damaged_inventory')} style={styles.radioRow}>
                    <Ionicons name={missingReason === 'damaged_inventory' ? "radio-button-on" : "radio-button-off"} size={20} color="#d32f2f" />
                    <Text style={{marginLeft: 5}}>Inventario Dañado</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setMissingReason('lost_inventory')} style={styles.radioRow}>
                    <Ionicons name={missingReason === 'lost_inventory' ? "radio-button-on" : "radio-button-off"} size={20} color="#d32f2f" />
                    <Text style={{marginLeft: 5}}>No se encuentra (Perdido)</Text>
                </TouchableOpacity>

                <View style={styles.rowBtns}>
                    <TouchableOpacity onPress={() => setExceptionModalVisible(false)} style={styles.btnCancel}><Text>Cancelar</Text></TouchableOpacity>
                    <TouchableOpacity onPress={confirmException} style={[styles.btnConfirm, {backgroundColor: '#d32f2f'}]}><Text style={{color:'#fff'}}>Reportar</Text></TouchableOpacity>
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

  tabs: { flexDirection: 'row', backgroundColor: '#fff', padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, flexDirection: 'row', justifyContent: 'center' },
  activeTab: { backgroundColor: '#f0f0f0' },
  tabText: { fontWeight: '600', color: '#666', marginRight: 5 },
  activeTabText: { color: '#1565c0' },
  badge: { backgroundColor: '#ffebee', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontSize: 10, color: '#c62828', fontWeight: 'bold' },

  listContent: { padding: 15 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#888' },

  card: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  orderId: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  dateText: { color: '#888', fontSize: 12 },
  clientName: { fontSize: 16, color: '#1565c0', marginBottom: 5 },
  itemsCount: { fontSize: 12, color: '#666', fontStyle: 'italic' },
  addressBox: { flexDirection: 'row', marginTop: 8, alignItems: 'center' },
  addressText: { fontSize: 12, color: '#666', marginLeft: 4, flex: 1 },

  // Detail Modal
  modalContainer: { flex: 1, backgroundColor: '#fff', padding: 20, paddingTop: 50 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  
  clientInfo: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10, marginBottom: 20 },
  clientLabel: { fontSize: 12, color: '#888', textTransform: 'uppercase' },
  clientValue: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  clientAddress: { marginTop: 5, color: '#555', fontSize: 14 },

  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  itemsList: { flex: 1 },
  
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  itemChecked: { backgroundColor: '#f9f9f9' },
  checkboxArea: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  itemName: { fontSize: 15, fontWeight: '600', color: '#333' },
  itemSku: { fontSize: 12, color: '#888' },
  itemQty: { fontSize: 16, fontWeight: 'bold', color: '#1565c0', marginLeft: 10 },
  missingBtn: { padding: 10 },

  footerActions: { marginTop: 20 },
  actionButton: { backgroundColor: '#1565c0', padding: 15, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  actionText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  // Small Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalSmall: { backgroundColor: '#fff', borderRadius: 15, padding: 20 },
  modalSub: { textAlign: 'center', marginBottom: 15, color: '#666' },
  label: { fontWeight: '600', marginBottom: 8, marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 16 },
  rowBtns: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  btnCancel: { padding: 12, backgroundColor: '#eee', borderRadius: 8, flex: 1, marginRight: 10, alignItems: 'center' },
  btnConfirm: { padding: 12, backgroundColor: '#1565c0', borderRadius: 8, flex: 1, alignItems: 'center' },
  
  radioRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
});