import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  TextInput, Modal, ActivityIndicator, ScrollView, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useToast } from '@/components/ToastNotification';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function HistorialOrdenesScreen() {
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Estados para el Modal de Detalle
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  // --- 1. OBTENER LISTA DE ÓRDENES ---
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${API_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        // Ordenamos por fecha descendente (más reciente primero)
        const sorted = data.data.sort((a: any, b: any) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setAllOrders(sorted);
        setFilteredOrders(sorted);
      } else {
        showToast(false, "No se pudieron cargar las órdenes");
      }
    } catch (error) {
      showToast(false, "Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  // --- 2. FILTRADO LOCAL (BUSCADOR) ---
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (!text) {
      setFilteredOrders(allOrders);
      return;
    }
    const lower = text.toLowerCase();
    const filtered = allOrders.filter(order => 
      order.client_name?.toLowerCase().includes(lower) || 
      order.id.toString().includes(lower)
    );
    setFilteredOrders(filtered);
  };

  // --- 3. VER DETALLE (CARGAR ITEMS) ---
  const openOrderDetail = async (order: any) => {
    setSelectedOrder(order);
    setLoadingDetails(true);
    setOrderItems([]); // Limpiar anteriores

    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${API_URL}/api/orders/${order.id}/items`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setOrderItems(data.data);
      }
    } catch (error) {
      showToast(false, "Error cargando detalles del pedido");
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeDetail = () => {
    setSelectedOrder(null);
    setOrderItems([]);
  };

  // --- RENDER DE LA TARJETA DE ORDEN ---
  const renderOrderCard = ({ item }: { item: any }) => {
    // Definir color según estado
    let statusColor = '#fbc02d'; // Pending
    let statusText = 'PENDIENTE';
    
    if (item.status === 'completed' || item.status === 'paid') {
        statusColor = '#2e7d32'; 
        statusText = 'COMPLETADA';
    } else if (item.status === 'cancelled') {
        statusColor = '#d32f2f'; 
        statusText = 'CANCELADA';
    }

    return (
      <TouchableOpacity style={styles.card} onPress={() => openOrderDetail(item)}>
        <View style={styles.cardHeader}>
          <Text style={styles.orderId}>Orden #{item.id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
        </View>

        <Text style={styles.clientName}>{item.client_name}</Text>
        
        <View style={styles.rowInfo}>
            <Ionicons name="calendar-outline" size={14} color="#666" />
            <Text style={styles.dateText}>
                {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </Text>
        </View>

        <View style={styles.divider} />
        
        <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>${parseFloat(item.total_amount).toFixed(2)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(panel)/vendedor')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Historial de Órdenes</Text>
        <View style={{width: 24}} /> 
      </View>

      {/* BUSCADOR */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#666" />
            <TextInput 
                style={styles.input}
                placeholder="Buscar por cliente o ID..."
                value={searchQuery}
                onChangeText={handleSearch}
            />
            {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => handleSearch('')}>
                    <Ionicons name="close-circle" size={18} color="#999" />
                </TouchableOpacity>
            )}
        </View>
      </View>

      {/* LISTA DE ÓRDENES */}
      {loading ? (
        <ActivityIndicator size="large" color="#2e7d32" style={{marginTop: 50}} />
      ) : (
        <FlatList 
            data={filteredOrders}
            keyExtractor={item => item.id.toString()}
            renderItem={renderOrderCard}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
                <View style={styles.emptyContainer}>
                    <Ionicons name="receipt-outline" size={50} color="#ccc" />
                    <Text style={styles.emptyText}>No se encontraron órdenes.</Text>
                </View>
            }
        />
      )}

      {/* --- MODAL DETALLE DE ORDEN --- */}
      <Modal visible={!!selectedOrder} animationType="slide" presentationStyle="pageSheet">
        {selectedOrder && (
            <View style={styles.modalContainer}>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={closeDetail} style={styles.closeBtn}>
                        <Ionicons name="close" size={28} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Detalle Orden #{selectedOrder.id}</Text>
                    <View style={{width: 28}} />
                </View>

                <ScrollView contentContainerStyle={styles.modalScroll}>
                    {/* Resumen Cliente */}
                    <View style={styles.sectionCard}>
                        <Text style={styles.label}>Cliente:</Text>
                        <Text style={styles.infoBig}>{selectedOrder.client_name}</Text>
                        
                        <Text style={[styles.label, {marginTop: 10}]}>Dirección de Envío:</Text>
                        <Text style={styles.infoText}>{selectedOrder.shipping_address || "No especificada"}</Text>

                        {selectedOrder.notes && (
                            <>
                                <Text style={[styles.label, {marginTop: 10}]}>Notas:</Text>
                                <Text style={styles.notesBox}>{selectedOrder.notes}</Text>
                            </>
                        )}
                    </View>

                    {/* Lista de Productos */}
                    <Text style={styles.sectionTitle}>Productos</Text>
                    
                    {loadingDetails ? (
                        <ActivityIndicator color="#2e7d32" style={{marginTop: 20}} />
                    ) : (
                        <View style={styles.productsCard}>
                            {orderItems.map((item, index) => (
                                <View key={index} style={styles.productItem}>
                                    <View style={{flex: 1}}>
                                        <Text style={styles.prodName}>{item.product_name}</Text>
                                        <Text style={styles.prodSku}>SKU: {item.sku}</Text>
                                    </View>
                                    <View style={{alignItems: 'flex-end'}}>
                                        <Text style={styles.prodQty}>x{item.quantity}</Text>
                                        <Text style={styles.prodPrice}>${parseFloat(item.subtotal).toFixed(2)}</Text>
                                    </View>
                                </View>
                            ))}
                            
                            {/* Total Final */}
                            <View style={styles.modalTotalRow}>
                                <Text style={styles.modalTotalLabel}>TOTAL</Text>
                                <Text style={styles.modalTotalValue}>${parseFloat(selectedOrder.total_amount).toFixed(2)}</Text>
                            </View>
                        </View>
                    )}
                </ScrollView>
                
                {/* Botón de acción (opcional: Imprimir / Reenviar) */}
                <View style={styles.modalFooter}>
                     <TouchableOpacity style={styles.fullButton} onPress={closeDetail}>
                        <Text style={styles.fullButtonText}>Cerrar</Text>
                     </TouchableOpacity>
                </View>

            </View>
        )}
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  backBtn: { padding: 5 },

  // Search
  searchContainer: { padding: 15, backgroundColor: '#fff', paddingBottom: 10 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 10, paddingHorizontal: 10, height: 45 },
  input: { flex: 1, marginLeft: 10, fontSize: 16 },

  // List
  listContent: { padding: 15 },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { marginTop: 10, color: '#888' },

  // Card
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  orderId: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  clientName: { fontSize: 16, color: '#555', marginBottom: 5 },
  rowInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  dateText: { marginLeft: 5, color: '#888', fontSize: 13 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 14, color: '#666' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: '#2e7d32' },

  // Modal Styles
  modalContainer: { flex: 1, backgroundColor: '#f5f5f5' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  closeBtn: { padding: 5 },
  
  modalScroll: { padding: 20 },
  sectionCard: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 20 },
  label: { fontSize: 12, color: '#888', textTransform: 'uppercase', marginBottom: 4 },
  infoBig: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  infoText: { fontSize: 15, color: '#555' },
  notesBox: { backgroundColor: '#fff3e0', padding: 10, borderRadius: 8, color: '#e65100', fontStyle: 'italic', marginTop: 5 },

  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#555', marginBottom: 10, marginLeft: 5 },
  productsCard: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
  productItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  prodName: { fontSize: 15, fontWeight: '600', color: '#333' },
  prodSku: { fontSize: 12, color: '#999' },
  prodQty: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  prodPrice: { fontSize: 14, color: '#2e7d32' },

  modalTotalRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, backgroundColor: '#fafafa' },
  modalTotalLabel: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  modalTotalValue: { fontSize: 20, fontWeight: 'bold', color: '#2e7d32' },

  modalFooter: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
  fullButton: { backgroundColor: '#333', padding: 15, borderRadius: 10, alignItems: 'center' },
  fullButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});