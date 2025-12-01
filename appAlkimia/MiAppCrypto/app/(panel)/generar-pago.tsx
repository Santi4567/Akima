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
  
  // --- NUEVOS ESTADOS PARA HISTORIAL Y CÁLCULO ---
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [pendingBalance, setPendingBalance] = useState(0);
  // -----------------------------------------------

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  // 1. CARGAR ÓRDENES (Lista General)
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${API_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        // Mostramos las pendientes y procesando (excluyendo canceladas)
        const active = data.data.filter((o: any) => o.status !== 'cancelled');
        // Ordenar por ID descendente
        active.sort((a:any, b:any) => b.id - a.id);
        
        setOrders(active);
        setFilteredOrders(active);
      }
    } catch (error) {
      showToast(false, "Error al cargar órdenes");
    } finally {
      setLoading(false);
    }
  };

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

  // 2. SELECCIONAR ORDEN Y CARGAR HISTORIAL (LÓGICA NUEVA)
  const handleSelectOrder = async (order: any) => {
    setSelectedOrder(order);
    setAmount('');
    setNotes('');
    setMethod('cash');
    setPaymentHistory([]); // Limpiar anterior
    setLoadingHistory(true);

    try {
        const token = await AsyncStorage.getItem('userToken');
        // --- NUEVO ENDPOINT DE HISTORIAL ---
        const res = await fetch(`${API_URL}/api/payments/order/${order.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();

        let totalPaid = 0;
        let history = [];

        if (data.success && Array.isArray(data.data)) {
            history = data.data;
            // Sumar todos los abonos
            totalPaid = history.reduce((sum: number, pay: any) => sum + parseFloat(pay.amount), 0);
        }

        setPaymentHistory(history);
        
        // Calcular saldo pendiente real
        const totalOrder = parseFloat(order.total_amount);
        setPendingBalance(Math.max(0, totalOrder - totalPaid));

    } catch (error) {
        console.error(error);
        showToast(false, "Error al calcular saldo");
    } finally {
        setLoadingHistory(false);
    }
  };

  // 3. ENVIAR PAGO
  const submitPayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
        showToast(false, "Monto inválido");
        return;
    }
    // Validar que no pague más de lo que debe (Opcional, pero recomendado)
    if (parseFloat(amount) > pendingBalance + 1) { // +1 margen por decimales
        showToast(false, `El saldo pendiente es solo $${pendingBalance.toFixed(2)}`);
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
            showToast(true, "Pago registrado 💰");
            // Recargamos el historial interno de este modal para actualizar saldos sin cerrar
            handleSelectOrder(selectedOrder); 
            // También actualizamos la lista de fondo por si cambió el estatus
            fetchOrders(); 
        } else {
            showToast(false, data.message || "Error al registrar");
        }

    } catch (error) {
        showToast(false, "Error de conexión");
    } finally {
        setProcessing(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleSelectOrder(item)}>
        <View style={styles.cardRow}>
            <Text style={styles.orderId}>Orden #{item.id}</Text>
            <Text style={styles.dateText}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
        <Text style={styles.clientName}>{item.client_name}</Text>
        <Text style={styles.totalText}>Total: ${parseFloat(item.total_amount).toFixed(2)}</Text>
        
        <View style={[styles.badge, { backgroundColor: item.status === 'completed' ? '#e8f5e9' : '#fff3e0' }]}>
            <Text style={{color: item.status === 'completed' ? '#2e7d32' : '#ef6c00', fontWeight: 'bold', fontSize: 12}}>
                {item.status.toUpperCase()}
            </Text>
        </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Registrar Cobro</Text>
        <View style={{width: 24}}/>
      </View>

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

      {loading ? (
          <ActivityIndicator size="large" color="#2e7d32" style={{marginTop: 50}} />
      ) : (
          <FlatList 
            data={filteredOrders}
            keyExtractor={item => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<Text style={styles.emptyText}>No hay órdenes.</Text>}
          />
      )}

      {/* --- MODAL DE COBRO --- */}
      <Modal visible={!!selectedOrder} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
                {selectedOrder && (
                    <ScrollView>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Orden #{selectedOrder.id}</Text>
                            <TouchableOpacity onPress={() => setSelectedOrder(null)}>
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        {/* INFO DE LA ORDEN Y SALDOS */}
                        <View style={styles.infoBox}>
                            <Text style={styles.clientLabel}>Cliente:</Text>
                            <Text style={styles.clientValue}>{selectedOrder.client_name}</Text>
                            
                            <View style={styles.balanceRow}>
                                <View>
                                    <Text style={styles.balanceLabel}>Total Orden:</Text>
                                    <Text style={styles.totalValue}>${parseFloat(selectedOrder.total_amount).toFixed(2)}</Text>
                                </View>
                                <View style={{alignItems: 'flex-end'}}>
                                    <Text style={styles.balanceLabel}>Por Cobrar:</Text>
                                    {/* USAMOS EL SALDO CALCULADO DEL ENDPOINT NUEVO */}
                                    {loadingHistory ? (
                                        <ActivityIndicator size="small" color="#d32f2f" />
                                    ) : (
                                        <Text style={[styles.pendingValue, pendingBalance <= 0 && {color: '#2e7d32'}]}>
                                            ${pendingBalance.toFixed(2)}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        </View>

                        {/* HISTORIAL DE ABONOS (TABLA) */}
                        <Text style={styles.sectionTitle}>Historial de Abonos</Text>
                        
                        <View style={styles.table}>
                             {/* Encabezados de la Tabla */}
                             <View style={styles.tableHeader}>
                                <Text style={[styles.th, {flex: 1}]}>Fecha</Text>
                                <Text style={[styles.th, {flex: 1.5}]}>Método</Text>
                                <Text style={[styles.th, {flex: 1, textAlign: 'right'}]}>Monto</Text>
                             </View>

                            <ScrollView 
                                style={styles.tableBody} 
                                nestedScrollEnabled={true} // VITAL para Android
                             >
                                 {loadingHistory ? (
                                     <ActivityIndicator color="#2e7d32" style={{padding: 20}} />
                                 ) : paymentHistory.length > 0 ? (
                                    paymentHistory.map((p: any, index: number) => (
                                        <View key={index} style={[styles.tableRow, index % 2 !== 0 && styles.tableRowAlt]}>
                                            <View style={{flex: 1}}>
                                                <Text style={styles.td}>{new Date(p.payment_date).toLocaleDateString()}</Text>
                                                <Text style={styles.tdSmall}>{new Date(p.payment_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
                                            </View>
                                            <View style={{flex: 1.5}}>
                                                <Text style={styles.tdBold}>{PAYMENT_METHODS.find(m => m.id === p.method)?.label.replace(/[^a-zA-Z ]/g, "") || p.method}</Text>
                                                <Text style={styles.tdSmall} numberOfLines={1}>Recibió: {p.received_by?.split(' ')[0] || 'Sistema'}</Text>
                                            </View>
                                            <Text style={[styles.tdAmount, {flex: 1}]}>${parseFloat(p.amount).toFixed(2)}</Text>
                                        </View>
                                    ))
                                 ) : (
                                    <View style={styles.emptyRow}>
                                        <Text style={styles.noPayments}>Sin abonos registrados.</Text>
                                    </View>
                                 )}
                             </ScrollView>
                        </View>

                        <View style={styles.divider} />

                        {/* FORMULARIO DE PAGO (SOLO SI HAY SALDO) */}
                        {pendingBalance > 0.01 ? (
                            <>
                                <Text style={styles.sectionTitle}>Nuevo Abono</Text>
                                
                                <Text style={styles.label}>Monto:</Text>
                                <TextInput 
                                    style={styles.inputAmount}
                                    placeholder="$0.00"
                                    keyboardType="numeric"
                                    value={amount}
                                    onChangeText={setAmount}
                                />

                                <Text style={styles.label}>Método:</Text>
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

                                <Text style={styles.label}>Notas:</Text>
                                <TextInput 
                                    style={styles.inputNotes}
                                    placeholder="Referencia..."
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
                            </>
                        ) : (
                            <View style={styles.paidContainer}>
                                <Ionicons name="checkmark-circle" size={40} color="#2e7d32" />
                                <Text style={styles.paidText}>¡Orden Pagada Completamente!</Text>
                            </View>
                        )}
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

  

  searchContainer: { padding: 15, backgroundColor: '#fff', paddingBottom: 10 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 10, paddingHorizontal: 10, height: 45 },
  inputSearch: { flex: 1, marginLeft: 10, fontSize: 16 },

  listContent: { padding: 15 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#888' },

  card: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 12, elevation: 2 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  orderId: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  dateText: { color: '#888', fontSize: 12 },
  clientName: { fontSize: 16, color: '#555', marginBottom: 5 },
  totalText: { fontSize: 18, fontWeight: 'bold', color: '#2e7d32' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 5 },

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

  // ... estilos anteriores ...

  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },

  // ESTILOS NUEVOS DE TABLA
  table: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    overflow: 'hidden', // Asegura que las esquinas redondeadas se respeten
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  th: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#555',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f9f9f9',
    backgroundColor: '#fff',
  },
  tableRowAlt: {
    backgroundColor: '#fafafa', // Color cebra para filas alternas
  },
  emptyRow: {
    padding: 20,
    alignItems: 'center',
  },
  tableBody: {
    maxHeight: 200, // <--- ESTO ES EL LÍMITE (aprox 4 o 5 filas)
  },
  
  // Celdas
  td: { fontSize: 13, color: '#333' },
  tdBold: { fontSize: 13, fontWeight: '600', color: '#333' },
  tdSmall: { fontSize: 10, color: '#999', marginTop: 2 },
  tdAmount: { fontSize: 13, fontWeight: 'bold', color: '#2e7d32', textAlign: 'right' },
  
  noPayments: { fontSize: 12, color: '#999', fontStyle: 'italic' },
  historyBox: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 10, maxHeight: 150 },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f9f9f9', paddingBottom: 5 },
  payDate: { fontSize: 12, color: '#888' },
  payUser: { fontSize: 11, color: '#aaa' },
  payMethod: { fontSize: 11, color: '#666' },
  payAmount: { fontSize: 14, fontWeight: 'bold', color: '#2e7d32' },
  

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

  paidContainer: { alignItems: 'center', marginTop: 30, padding: 20, backgroundColor: '#e8f5e9', borderRadius: 12 },
  paidText: { color: '#2e7d32', fontWeight: 'bold', fontSize: 16, marginTop: 10 }
});