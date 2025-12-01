import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  Modal, ActivityIndicator, Alert, SafeAreaView, ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToast } from '@/components/ToastNotification';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function DespachoScreen() {
  // --- ESTADOS ---
  const [orders, setOrders] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);

  // Estados Picking
  const [pickingModalVisible, setPickingModalVisible] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]); 
  const [currentIndex, setCurrentIndex] = useState(0);     
  const [loadingAction, setLoadingAction] = useState(false);

  // Estados Reajuste
  const [isAdjusting, setIsAdjusting] = useState(false); 
  const [missingQty, setMissingQty] = useState(1);       

  const { showToast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  // 1. CARGAR PEDIDOS PENDIENTES
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${API_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        // Filtramos solo 'pending'
        const list = data.data.filter((o: any) => o.status === 'pending');
        // Ordenamos por fecha
        list.sort((a:any, b:any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        setOrders(list);
      }
    } catch (e) { 
        showToast(false, "Error al cargar pedidos"); 
    } finally { 
        setLoading(false); 
    }
  };

  // 2. INICIAR SURTIDO
  const handleStartOrder = (order: any) => {
    Alert.alert(
        "Iniciar Surtido",
        `¿Comenzar con la Orden #${order.id}?`,
        [
            { text: "Cancelar", style: "cancel" },
            { text: "Aceptar", onPress: () => changeStatusToProcessing(order) }
        ]
    );
  };

  const changeStatusToProcessing = async (order: any) => {
    setLoading(true);
    try {
        const token = await AsyncStorage.getItem('userToken');
        const res = await fetch(`${API_URL}/api/orders/${order.id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ status: 'processing' })
        });

        if (res.ok) {
            loadOrderItems(order);
        } else {
            showToast(false, "No se pudo iniciar.");
            fetchOrders(); 
        }
    } catch (e) {
        showToast(false, "Error de conexión");
    } finally {
        setLoading(false);
    }
  };

  const loadOrderItems = async (order: any) => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const res = await fetch(`${API_URL}/api/orders/${order.id}/items`, {
             headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.success) {
            setCurrentOrder(order);
            setOrderItems(data.data || []);
            setCurrentIndex(0); 
            setIsAdjusting(false);
            setPickingModalVisible(true);
        }
      } catch (e) { showToast(false, "Error cargando productos"); }
  };

  // 3. SIGUIENTE PRODUCTO
  const handleNextProduct = () => {
    if (currentIndex < orderItems.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setIsAdjusting(false); 
        setMissingQty(1);
    } else {
        // FIN
        Alert.alert("¡Pedido Terminado!", "Has revisado todos los productos.", [
            { text: "Finalizar", onPress: () => {
                setPickingModalVisible(false);
                fetchOrders(); 
            }}
        ]);
    }
  };

  // 4. REAJUSTE (DEVOLUCIÓN)
  const handleRefund = async () => {
    const currentItem = orderItems[currentIndex];
    
    if (missingQty <= 0) return;

    setLoadingAction(true);
    try {
        const token = await AsyncStorage.getItem('userToken');
        const payload = {
            order_id: currentOrder.id,
            product_id: currentItem.product_id, // Ajusta si tu API usa otro nombre de campo
            quantity: missingQty,
            reason: "Falta de stock en almacén", 
            action: 'refund'
        };

        const res = await fetch(`${API_URL}/api/returns`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            showToast(true, `Reajuste aplicado: -${missingQty}`);
            handleNextProduct();
        } else {
            showToast(false, "Error al aplicar reajuste");
        }
    } catch (e) { showToast(false, "Error de conexión"); }
    finally { setLoadingAction(false); }
  };

  // RENDER ITEM DE LISTA
  const renderOrderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleStartOrder(item)}>
        <View style={styles.cardHeader}>
            <Text style={styles.orderId}>Orden #{item.id}</Text>
            <View style={styles.badge}><Text style={styles.badgeText}>PENDIENTE</Text></View>
        </View>
        
        <Text style={styles.clientName}>{item.client_name}</Text>
        <Text style={styles.dateText}>{new Date(item.created_at).toLocaleDateString()}</Text>
        
        <View style={styles.startButton}>
            <Text style={styles.startText}>INICIAR CON EL PEDIDO</Text>
            <Ionicons name="arrow-forward-circle" size={24} color="#fff" />
        </View>
    </TouchableOpacity>
  );

  // WIZARD UI
  const renderWizardUI = () => {
    if (!currentOrder || orderItems.length === 0) return null;
    const currentItem = orderItems[currentIndex]; 
    
    return (
        <View style={styles.wizardContainer}>
            <View style={styles.progressHeader}>
                <Text style={styles.progressText}>Producto {currentIndex + 1} de {orderItems.length}</Text>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${((currentIndex + 1) / orderItems.length) * 100}%` }]} />
                </View>
            </View>

            <View style={styles.productDisplay}>
                <Ionicons name="cube-outline" size={100} color="#555" />
                <Text style={styles.prodName}>{currentItem.product_name}</Text>
                <Text style={styles.prodSku}>SKU: {currentItem.sku}</Text>
                
                <View style={styles.qtyBox}>
                    <Text style={styles.qtyLabel}>CANTIDAD SOLICITADA</Text>
                    <Text style={styles.qtyValue}>{currentItem.quantity}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.actionZone}>
                {!isAdjusting ? (
                    <>
                        <TouchableOpacity style={styles.btnSuccess} onPress={handleNextProduct}>
                            <Ionicons name="checkmark-circle" size={28} color="#fff" />
                            <Text style={styles.btnSuccessText}>
                                {currentIndex === orderItems.length - 1 ? "FINALIZAR" : "SIGUIENTE PRODUCTO"}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.btnIssue} onPress={() => {setIsAdjusting(true); setMissingQty(1);}}>
                            <Ionicons name="alert-circle-outline" size={24} color="#d32f2f" />
                            <Text style={styles.btnIssueText}>Reajuste de Cantidad</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <View style={styles.adjustBox}>
                        <Text style={styles.adjustTitle}>Reportar Faltante</Text>
                        <Text style={styles.adjustSub}>¿Cuántas piezas NO hay en stock?</Text>

                        <View style={styles.counterRow}>
                            <TouchableOpacity style={styles.counterBtn} onPress={() => setMissingQty(Math.max(1, missingQty - 1))}>
                                <Ionicons name="remove" size={24} color="#fff" />
                            </TouchableOpacity>
                            <Text style={styles.counterVal}>{missingQty}</Text>
                            <TouchableOpacity style={styles.counterBtn} onPress={() => setMissingQty(Math.min(currentItem.quantity, missingQty + 1))}>
                                <Ionicons name="add" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.btnAllMissing} onPress={() => setMissingQty(currentItem.quantity)}>
                            <Text style={{color: '#d32f2f', fontWeight: 'bold'}}>Falta Todo ({currentItem.quantity})</Text>
                        </TouchableOpacity>

                        <View style={styles.adjustActions}>
                            <TouchableOpacity style={styles.btnCancelAdjust} onPress={() => setIsAdjusting(false)}>
                                <Text style={{color: '#555'}}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.btnConfirmAdjust} onPress={handleRefund} disabled={loadingAction}>
                                {loadingAction ? <ActivityIndicator color="#fff"/> : <Text style={{color: '#fff', fontWeight:'bold'}}>Confirmar</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </ScrollView>
        </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Despacho</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1565c0" style={{marginTop: 50}} />
      ) : (
        <FlatList 
            data={orders}
            keyExtractor={item => item.id.toString()}
            renderItem={renderOrderItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
                <View style={styles.emptyContainer}>
                    <Ionicons name="checkmark-circle-outline" size={60} color="#ccc" />
                    <Text style={styles.emptyText}>No hay pedidos pendientes por surtir.</Text>
                </View>
            }
        />
      )}

      {/* MODAL PICKING */}
      <Modal visible={pickingModalVisible} animationType="slide" onRequestClose={() => {}}>
        <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}}>
            <View style={styles.pickingHeader}>
                <Text style={styles.pickingTitle}>Surtir Orden #{currentOrder?.id}</Text>
                <TouchableOpacity onPress={() => setPickingModalVisible(false)}>
                    <Ionicons name="close" size={28} color="#333" />
                </TouchableOpacity>
            </View>
            {renderWizardUI()}
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 15, backgroundColor: '#fff', elevation: 2 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1565c0' },

  listContent: { padding: 15 },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { marginTop: 10, color: '#888', fontSize: 16 },

  card: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 12, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  orderId: { fontWeight: 'bold', fontSize: 18, color: '#333' },
  badge: { backgroundColor: '#fff3e0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: '#ef6c00', fontSize: 10, fontWeight: 'bold' },
  clientName: { fontSize: 16, color: '#555', marginBottom: 2 },
  dateText: { fontSize: 12, color: '#999', marginBottom: 10 },
  
  startButton: { backgroundColor: '#1565c0', borderRadius: 8, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  startText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  pickingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  pickingTitle: { fontSize: 18, fontWeight: 'bold' },
  
  wizardContainer: { flex: 1, padding: 20, justifyContent: 'space-between' },
  
  progressHeader: { marginBottom: 20 },
  progressText: { textAlign: 'center', color: '#666', marginBottom: 5 },
  progressBar: { height: 8, backgroundColor: '#eee', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#2e7d32' },

  productDisplay: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  prodName: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginTop: 15, color: '#333' },
  prodSku: { fontSize: 16, color: '#888', marginTop: 5 },
  
  qtyBox: { marginTop: 30, alignItems: 'center', backgroundColor: '#e3f2fd', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 15 },
  qtyLabel: { fontSize: 12, color: '#1565c0', fontWeight: 'bold', marginBottom: 5 },
  qtyValue: { fontSize: 50, fontWeight: 'bold', color: '#1565c0' },

  actionZone: { marginTop: 20 },
  btnSuccess: { backgroundColor: '#2e7d32', padding: 18, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 15, elevation: 4 },
  btnSuccessText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  btnIssue: { padding: 15, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#d32f2f' },
  btnIssueText: { color: '#d32f2f', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },

  adjustBox: { backgroundColor: '#ffebee', padding: 20, borderRadius: 15, borderWidth: 1, borderColor: '#ffcdd2' },
  adjustTitle: { fontSize: 18, fontWeight: 'bold', color: '#c62828', textAlign: 'center' },
  adjustSub: { textAlign: 'center', color: '#c62828', marginBottom: 15 },
  
  counterRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  counterBtn: { width: 50, height: 50, backgroundColor: '#ef5350', borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  counterVal: { fontSize: 32, fontWeight: 'bold', marginHorizontal: 30, color: '#333' },
  
  btnAllMissing: { alignItems: 'center', marginBottom: 20, padding: 10 },
  
  adjustActions: { flexDirection: 'row', justifyContent: 'space-between' },
  btnCancelAdjust: { flex: 1, backgroundColor: '#fff', padding: 12, borderRadius: 8, alignItems: 'center', marginRight: 10 },
  btnConfirmAdjust: { flex: 1, backgroundColor: '#c62828', padding: 12, borderRadius: 8, alignItems: 'center' },
});