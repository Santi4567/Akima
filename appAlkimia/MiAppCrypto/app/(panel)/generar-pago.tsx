import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  TextInput, Modal, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useToast } from '@/components/ToastNotification';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Mapeo de métodos de pago (Para mostrar en español)
const PAYMENT_METHODS = [
    { id: 'cash', label: 'Efectivo 💵' },
    { id: 'transfer', label: 'Transferencia 🏦' },
    { id: 'credit_card', label: 'Tarjeta de Crédito 💳' },
];

export default function GenerarPagoScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Estados del Modal de Pago
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  // 1. CARGAR ÓRDENES
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${API_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        // Filtramos: No mostrar las que ya están "paid" o "completed" 
        // (A menos que manejes pagos parciales y el estatus siga en pending)
        const pending = data.data.filter((o: any) => o.status !== 'cancelled');
        setOrders(pending);
        setFilteredOrders(pending);
      }
    } catch (error) {
      showToast(false, "Error al cargar órdenes");
    } finally {
      setLoading(false);
    }
  };

  // 2. BUSCADOR
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (!text) {
      setFilteredOrders(orders);
      return;
    }
    const lower = text.toLowerCase();
    const filtered = orders.filter(o => 
      o.client_name?.toLowerCase().includes(lower) || 
      o.id.toString().includes(lower)
    );
    setFilteredOrders(filtered);
  };

  // 3. SELECCIONAR ORDEN (ABRIR MODAL)
  const handleSelectOrder = (order: any) => {
    // Calculamos saldo pendiente (Simulado si el API no trae 'paid_amount')
    // Asumimos que si no hay info, debe todo.
    const total = parseFloat(order.total_amount);
    const paid = parseFloat(order.paid_amount || '0'); 
    
    // Agregamos datos calculados al objeto para usar en el modal
    const orderWithBalance = {
        ...order,
        pending_balance: total - paid
    };
    
    setSelectedOrder(orderWithBalance);
    setAmount(''); // Limpiar campo
    setNotes('');
    setMethod('cash');
  };

  // 4. ENVIAR PAGO (POST)
  const submitPayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
        showToast(false, "El monto debe ser mayor a 0");
        return;
    }
    setProcessing(true);

    try {
        const token = await AsyncStorage.getItem('userToken');
        const payload = {
            order_id: selectedOrder.id,
            amount: parseFloat(amount),
            method: method,
            notes: notes || "Cobro desde App"
        };

        const res = await fetch(`${API_URL}/api/payments`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (data.success) {
            showToast(true, "Pago registrado exitosamente 💰");
            setSelectedOrder(null); // Cerrar modal
            fetchOrders(); // Recargar lista para actualizar saldos
        } else {
            showToast(false, data.message || "Error al registrar cobro");
        }

    } catch (error) {
        showToast(false, "Error de conexión");
    } finally {
        setProcessing(false);
    }
  };

  // RENDER ITEM DE LA LISTA
  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleSelectOrder(item)}>
        <View style={styles.cardRow}>
            <Text style={styles.orderId}>Orden #{item.id}</Text>
            <Text style={styles.dateText}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
        <Text style={styles.clientName}>{item.client_name}</Text>
        <Text style={styles.totalText}>Total: ${parseFloat(item.total_amount).toFixed(2)}</Text>
        
        {/* Etiqueta de Estado */}
        <View style={[styles.badge, 
            { backgroundColor: item.status === 'pending' ? '#fff3e0' : '#e8f5e9' }
        ]}>
            <Text style={{
                color: item.status === 'pending' ? '#ef6c00' : '#2e7d32', 
                fontWeight: 'bold', fontSize: 12
            }}>
                {item.status === 'pending' ? 'PENDIENTE DE PAGO' : 'PAGADO'}
            </Text>
        </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Registrar Cobro</Text>
        <View style={{width: 24}}/>
      </View>

      {/* BUSCADOR */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#666" />
            <TextInput 
                style={styles.inputSearch}
                placeholder="Buscar cliente u orden..."
                value={searchQuery}
                onChangeText={handleSearch}
            />
        </View>
      </View>

      {/* LISTA */}
      {loading ? (
          <ActivityIndicator size="large" color="#2e7d32" style={{marginTop: 50}} />
      ) : (
          <FlatList 
            data={filteredOrders}
            keyExtractor={item => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
                <Text style={styles.emptyText}>No hay órdenes pendientes.</Text>
            }
          />
      )}

      {/* --- MODAL DE COBRO --- */}
      <Modal visible={!!selectedOrder} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalContent}
            >
                {selectedOrder && (
                    <ScrollView>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Cobrar Orden #{selectedOrder.id}</Text>
                            <TouchableOpacity onPress={() => setSelectedOrder(null)}>
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        {/* INFO DE LA ORDEN */}
                        <View style={styles.infoBox}>
                            <Text style={styles.clientLabel}>Cliente:</Text>
                            <Text style={styles.clientValue}>{selectedOrder.client_name}</Text>
                            
                            <View style={styles.balanceRow}>
                                <View>
                                    <Text style={styles.balanceLabel}>Total:</Text>
                                    <Text style={styles.totalValue}>${parseFloat(selectedOrder.total_amount).toFixed(2)}</Text>
                                </View>
                                <View style={{alignItems: 'flex-end'}}>
                                    <Text style={styles.balanceLabel}>Por Cobrar:</Text>
                                    {/* Usamos el pending_balance calculado o el total si no hay pagos previos */}
                                    <Text style={styles.pendingValue}>
                                        ${selectedOrder.pending_balance 
                                            ? selectedOrder.pending_balance.toFixed(2) 
                                            : parseFloat(selectedOrder.total_amount).toFixed(2)}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* HISTORIAL DE ABONOS (Visualización) */}
                        <Text style={styles.sectionTitle}>Historial de Abonos</Text>
                        <View style={styles.historyBox}>
                             {/* NOTA: Como el endpoint de 'lista' no suele traer el array de pagos, 
                                 aquí validamos si existe. Si no, mostramos mensaje */}
                             {selectedOrder.payments && selectedOrder.payments.length > 0 ? (
                                selectedOrder.payments.map((p: any, index: number) => (
                                    <View key={index} style={styles.paymentRow}>
                                        <Text style={styles.payDate}>{new Date(p.created_at).toLocaleDateString()}</Text>
                                        <Text style={styles.payMethod}>
                                            {PAYMENT_METHODS.find(m => m.id === p.method)?.label || p.method}
                                        </Text>
                                        <Text style={styles.payAmount}>${parseFloat(p.amount).toFixed(2)}</Text>
                                    </View>
                                ))
                             ) : (
                                <Text style={styles.noPayments}>No hay abonos registrados en esta vista.</Text>
                             )}
                        </View>

                        <View style={styles.divider} />

                        {/* FORMULARIO DE PAGO */}
                        <Text style={styles.sectionTitle}>Nuevo Pago</Text>
                        
                        <Text style={styles.label}>Monto a cobrar:</Text>
                        <TextInput 
                            style={styles.inputAmount}
                            placeholder="$0.00"
                            keyboardType="numeric"
                            value={amount}
                            onChangeText={setAmount}
                        />

                        <Text style={styles.label}>Método de Pago:</Text>
                        <View style={styles.methodsContainer}>
                            {PAYMENT_METHODS.map((m) => (
                                <TouchableOpacity 
                                    key={m.id}
                                    style={[styles.methodBtn, method === m.id && styles.methodBtnActive]}
                                    onPress={() => setMethod(m.id)}
                                >
                                    <Text style={[styles.methodText, method === m.id && styles.methodTextActive]}>
                                        {m.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.label}>Notas (Opcional):</Text>
                        <TextInput 
                            style={styles.inputNotes}
                            placeholder="Referencia, folio, etc..."
                            value={notes}
                            onChangeText={setNotes}
                        />

                        <TouchableOpacity 
                            style={[styles.payButton, processing && {opacity: 0.7}]}
                            onPress={submitPayment}
                            disabled={processing}
                        >
                            {processing ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.payButtonText}>REGISTRAR COBRO</Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                )}
            </KeyboardAvoidingView>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#fff', elevation: 2 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#2e7d32' },
  backBtn: { padding: 5 },

  // Search
  searchContainer: { padding: 15, backgroundColor: '#fff', paddingBottom: 10 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 10, paddingHorizontal: 10, height: 45 },
  inputSearch: { flex: 1, marginLeft: 10, fontSize: 16 },

  // List
  listContent: { padding: 15 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#888' },

  card: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 12, elevation: 2 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  orderId: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  dateText: { color: '#888', fontSize: 12 },
  clientName: { fontSize: 16, color: '#555', marginBottom: 5 },
  totalText: { fontSize: 18, fontWeight: 'bold', color: '#2e7d32' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 5 },

  // MODAL STYLES
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '90%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },

  infoBox: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10, marginBottom: 20 },
  clientLabel: { color: '#888', fontSize: 12 },
  clientValue: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 },
  balanceLabel: { color: '#666', fontSize: 12 },
  totalValue: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  pendingValue: { fontSize: 18, fontWeight: 'bold', color: '#d32f2f' },

  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  historyBox: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 10, maxHeight: 100 },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  payDate: { fontSize: 12, color: '#888' },
  payMethod: { fontSize: 12, color: '#333' },
  payAmount: { fontSize: 12, fontWeight: 'bold', color: '#2e7d32' },
  noPayments: { fontSize: 12, color: '#999', fontStyle: 'italic', textAlign: 'center' },

  divider: { height: 1, backgroundColor: '#eee', marginVertical: 20 },

  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 10 },
  inputAmount: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 15, fontSize: 24, fontWeight: 'bold', color: '#2e7d32', textAlign: 'center' },
  
  methodsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  methodBtn: { width: '31%', padding: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, alignItems: 'center', marginBottom: 5 },
  methodBtnActive: { backgroundColor: '#e8f5e9', borderColor: '#2e7d32' },
  methodText: { fontSize: 11, color: '#555', textAlign: 'center' },
  methodTextActive: { color: '#2e7d32', fontWeight: 'bold' },

  inputNotes: { backgroundColor: '#fafafa', borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 10, height: 45 },

  payButton: { backgroundColor: '#2e7d32', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 30, marginBottom: 20 },
  payButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
});