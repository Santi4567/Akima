import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, 
  ScrollView, Alert, SafeAreaView, TextInput, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, router } from 'expo-router';
import { useToast } from '@/components/ToastNotification';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function SurtidoScreen() {
  const { orderId } = useLocalSearchParams();
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Estados Reajuste
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [missingQty, setMissingQty] = useState(1);
  const [loadingAction, setLoadingAction] = useState(false);

  // Estados Envío
  const [trackingModalVisible, setTrackingModalVisible] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');

  const { showToast } = useToast();

  useEffect(() => {
    if (orderId) loadOrderDetails();
  }, [orderId]);

  const loadOrderDetails = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const res = await fetch(`${API_URL}/api/orders/${orderId}/items`, {
             headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            setOrderItems(data.data || []);
        } else {
            showToast(false, "Error cargando items");
            router.back();
        }
      } catch (e) { showToast(false, "Error de conexión"); }
      finally { setLoading(false); }
  };

  const handleNextProduct = () => {
    if (currentIndex < orderItems.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setIsAdjusting(false);
        setMissingQty(1);
    } else {
        Alert.alert("Surtido Completo", "¿Deseas marcar como ENVIADO ahora?", [
            { text: "Dejar Pendiente", onPress: () => router.back() },
            { text: "Enviar (Tracking)", onPress: () => setTrackingModalVisible(true) }
        ]);
    }
  };

  const handleRefund = async () => {
    const currentItem = orderItems[currentIndex];
    if (missingQty <= 0) return;
    
    setLoadingAction(true);
    try {
        const token = await AsyncStorage.getItem('userToken');
        
        // Estructura requerida por tu Backend
        const payload = {
            order_id: Number(orderId), 
            reason: "Ajuste automático por falta de stock en despacho",
            status: "completed",
            items: [
                {
                    order_item_id: currentItem.id, // ID específico de la fila del pedido
                    quantity: missingQty
                }
            ]
        };
        
        const res = await fetch(`${API_URL}/api/returns`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        
        if (res.ok || data.success) {
            Alert.alert("Reajuste Exitoso", `Se descontaron ${missingQty} piezas.`);
            handleNextProduct();
        } else {
            Alert.alert("Error", data.message || "No se pudo realizar el ajuste.");
        }

    } catch (e) { 
        showToast(false, "Error conexión"); 
    } finally { 
        setLoadingAction(false); 
    }
  };

  const confirmShipping = async () => {
      if (!trackingNumber) { showToast(false, "Falta guía"); return; }
      try {
        const token = await AsyncStorage.getItem('userToken');
        const res = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ status: 'shipped', tracking_number: trackingNumber })
        });
        if (res.ok) {
            showToast(true, "Enviado 🚀");
            router.replace('/(panel)/despacho'); 
        } else { showToast(false, "Error al enviar"); }
      } catch (e) { showToast(false, "Error conexión"); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#1565c0"/></View>;
  if (orderItems.length === 0) return <View style={styles.center}><Text>No hay productos.</Text></View>;

  const currentItem = orderItems[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={30} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Surtir Orden #{orderId}</Text>
        <View style={{width: 30}}/>
      </View>

      <View style={styles.content}>
        
        {/* BARRA PROGRESO */}
        <View style={styles.progressHeader}>
            <Text style={styles.progressText}>Item {currentIndex + 1} de {orderItems.length}</Text>
            <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${((currentIndex + 1) / orderItems.length) * 100}%` }]} />
            </View>
        </View>

        {/* VISUALIZADOR PRODUCTO */}
        <View style={styles.productDisplay}>
            <View style={styles.iconCircle}>
                <Ionicons name="cube-outline" size={80} color="#555" />
            </View>
            
            <Text style={styles.prodName}>{currentItem.product_name}</Text>
            <Text style={styles.prodSku}>SKU: {currentItem.sku}</Text>
            
            <View style={styles.qtyBox}>
                <Text style={styles.qtyLabel}>CANTIDAD A SURTIR</Text>
                <Text style={styles.qtyValue}>{currentItem.quantity}</Text>
            </View>
        </View>

        {/* BOTONES DE ACCIÓN */}
        <ScrollView contentContainerStyle={styles.actionZone}>
            {!isAdjusting ? (
                <View style={{ gap: 20 }}>
                    <TouchableOpacity style={styles.btnSuccess} onPress={handleNextProduct}>
                        <Ionicons name="checkmark-circle" size={32} color="#fff" />
                        <Text style={styles.btnSuccessText}>LISTO / SIGUIENTE</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.btnIssue} onPress={() => {setIsAdjusting(true); setMissingQty(1);}}>
                        <Ionicons name="alert-circle-outline" size={24} color="#d32f2f" />
                        <Text style={styles.btnIssueText}>Reportar Faltante</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.adjustBox}>
                    <Text style={styles.adjustTitle}>Reportar Faltante</Text>
                    
                    <View style={styles.counterRow}>
                        <TouchableOpacity style={styles.counterBtn} onPress={() => setMissingQty(Math.max(1, missingQty - 1))}>
                            <Ionicons name="remove" size={28} color="#fff" />
                        </TouchableOpacity>
                        
                        <Text style={styles.counterVal}>{missingQty}</Text>
                        
                        <TouchableOpacity style={styles.counterBtn} onPress={() => setMissingQty(Math.min(currentItem.quantity, missingQty + 1))}>
                            <Ionicons name="add" size={28} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.adjustActions}>
                        <TouchableOpacity style={styles.btnCancelAdjust} onPress={() => setIsAdjusting(false)}>
                            <Text style={styles.btnCancelText}>Cancelar</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.btnConfirmAdjust} onPress={handleRefund} disabled={loadingAction}>
                            {loadingAction ? <ActivityIndicator color="#fff"/> : <Text style={styles.btnConfirmText}>Confirmar</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </ScrollView>
      </View>

      {/* MODAL TRACKING */}
      <Modal visible={trackingModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
            <View style={styles.modalSmall}>
                <Text style={styles.modalTitle}>Confirmar Envío</Text>
                <Text style={styles.label}>Guía / Tracking:</Text>
                <TextInput 
                    style={styles.input} 
                    placeholder="MX-123..." 
                    value={trackingNumber} 
                    onChangeText={setTrackingNumber} 
                />
                <View style={styles.rowBtns}>
                    <TouchableOpacity onPress={() => setTrackingModalVisible(false)} style={styles.btnCancel}>
                        <Text>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={confirmShipping} style={styles.btnConfirm}>
                        <Text style={{color:'#fff'}}>Enviar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Header más espacioso
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, marginTop: 40, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', backgroundColor: '#fff', elevation: 2 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  closeBtn: { padding: 5 },

  content: { flex: 1, padding: 25, justifyContent: 'space-between' },

  // Progreso
  progressHeader: { marginBottom: 30 },
  progressText: { textAlign: 'center', color: '#888', marginBottom: 10, fontSize: 14 },
  progressBar: { height: 10, backgroundColor: '#f0f0f0', borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#2e7d32' },

  // Producto (Más espacio)
  productDisplay: { alignItems: 'center', flex: 1, justifyContent: 'center', marginBottom: 20, marginTop: 110 },
  iconCircle: { width: 120, height: 120, backgroundColor: '#f5f5f5', borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  prodName: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', color: '#222', marginBottom: 5 },
  prodSku: { fontSize: 18, color: '#888', marginBottom: 30 },
  
  qtyBox: { width: '100%', height: 120, alignItems: 'center', backgroundColor: '#e8f5e9', paddingVertical: 12, borderRadius: 20, borderWidth: 1, borderColor: '#c8e6c9' },
  qtyLabel: { fontSize: 15, color: '#2e7d32', fontWeight: 'bold', marginBottom: 5, letterSpacing: 1 , height:'auto' },
  qtyValue: { fontSize: 60, fontWeight: 'bold', color: '#2e7d32' },

  // Acciones
  actionZone: { marginTop: 10 },
  
  // Botones principales (Grandes y separados)
  btnSuccess: { backgroundColor: '#2e7d32', marginTop: 120, paddingVertical: 20, paddingHorizontal: 20, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#2e7d32', shadowOpacity: 0.3, shadowRadius: 5 },
  btnSuccessText: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginLeft: 15 },
  
  btnIssue: { paddingVertical: 15, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#ffebee', backgroundColor: '#fff' },
  btnIssueText: { color: '#d32f2f', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },

  // Caja de Ajuste
  adjustBox: { backgroundColor: '#fdaebaff', padding: 25, borderRadius: 20, borderWidth: 1, borderColor: '#e94353ff', height: 'auto' },
  adjustTitle: { fontSize: 20, fontWeight: 'bold', color: '#c62828', textAlign: 'center', marginBottom: 20 },
  
  counterRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  counterBtn: { width: 60, height: 60, backgroundColor: '#ef5350', borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  counterVal: { fontSize: 40, fontWeight: 'bold', marginHorizontal: 40, color: '#333' },
  
  adjustActions: { flexDirection: 'row', gap: 15 },
  btnCancelAdjust: { flex: 1, backgroundColor: '#fff', padding: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#ddd' },
  btnCancelText: { color: '#666', fontSize: 16, fontWeight: '600' },
  btnConfirmAdjust: { flex: 1, backgroundColor: '#c62828', padding: 15, borderRadius: 12, alignItems: 'center', elevation: 2 },
  btnConfirmText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 30 },
  modalSmall: { backgroundColor: '#fff', borderRadius: 20, padding: 25, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  label: { fontWeight: '600', marginBottom: 10, fontSize: 16 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 15, fontSize: 18, marginBottom: 20 },
  rowBtns: { flexDirection: 'row', justifyContent: 'space-between', gap: 15 },
  btnCancel: { padding: 15, backgroundColor: '#f5f5f5', borderRadius: 10, flex: 1, alignItems: 'center' },
  btnConfirm: { padding: 15, backgroundColor: '#1565c0', borderRadius: 10, flex: 1, alignItems: 'center' },
});