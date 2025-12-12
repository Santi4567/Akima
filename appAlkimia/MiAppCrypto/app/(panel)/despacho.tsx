import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, Alert, SafeAreaView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useToast } from '@/components/ToastNotification';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function DespachoScreen() {
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [displayedOrders, setDisplayedOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Tabs: 'pending' (Bolsa General) vs 'processing' (Mis Asignaciones)
  const [activeTab, setActiveTab] = useState<'pending' | 'processing'>('pending');

  const { showToast } = useToast();

  // 1. CARGAR USUARIO
  useEffect(() => {
    const loadUser = async () => {
        try {
            const userStr = await AsyncStorage.getItem('userInfo');
            if (userStr) {
                const user = JSON.parse(userStr);
                setCurrentUser(user);
            }
        } catch (e) { console.error("Error cargando usuario", e); }
    };
    loadUser();
  }, []);

  // 2. CARGAR PEDIDOS AL INICIO (Y cuando tengamos usuario)
  useEffect(() => {
    if (currentUser) {
        fetchOrders();
    }
  }, [currentUser]);

  // 3. FILTRAR CUANDO CAMBIE ALGO
  useEffect(() => {
    filterDataByTab();
  }, [allOrders, activeTab, currentUser]);

  const fetchOrders = async (isRefreshing = false) => {
    if (!isRefreshing) setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${API_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        // Traemos TODO lo activo (pending + processing)
        const active = data.data.filter((o: any) => {
            const s = o.status?.toLowerCase();
            return s === 'pending' || s === 'processing';
        });
        
        // Ordenar por fecha (FIFO)
        active.sort((a:any, b:any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        setAllOrders(active);
      }
    } catch (e) { 
        showToast(false, "Error al actualizar lista"); 
    } finally { 
        setLoading(false); 
        if (isRefreshing) setRefreshing(false);
    }
  };

  const onRefresh = () => {
      setRefreshing(true);
      fetchOrders(true);
  };

  // --- LÓGICA DE FILTRADO ESTRICTA ---
  const filterDataByTab = () => {
      if (!currentUser) return;

      const list = allOrders.filter(o => {
          const status = o.status?.toLowerCase();

          // CASO A: PESTAÑA "POR EMPACAR" (PENDING)
          // Mostramos todos los pedidos que nadie ha tomado aún.
          if (activeTab === 'pending') {
              return status === 'pending';
          }

          // CASO B: PESTAÑA "MIS ASIGNACIONES" (PROCESSING)
          // Solo mostramos los que tienen MI ID en 'processing_id'
          if (activeTab === 'processing') {
              // Usamos '==' para que no importe si uno es string "8" y el otro number 8
              return status === 'processing' && o.processing_id == currentUser.id;
          }

          return false;
      });
      
      setDisplayedOrders(list);
  };

  const handleStartOrder = (order: any) => {
    // Si ya está en proceso (y es mío porque ya filtré), entro directo
    if (order.status?.toLowerCase() === 'processing') {
        router.push({ pathname: '/(panel)/surtido', params: { orderId: order.id } });
        return;
    }

    // Si es pending, pregunto si quiere tomarlo
    Alert.alert("Tomar Pedido", `¿Asignarte la Orden #${order.id}?`, [
        { text: "Cancelar", style: "cancel" },
        { text: "Aceptar", onPress: () => assignAndStart(order) }
    ]);
  };

  const assignAndStart = async (order: any) => {
    setLoading(true);
    try {
        const token = await AsyncStorage.getItem('userToken');
        
        // ENVIAMOS MIS DATOS PARA APARTAR EL PEDIDO
        const payload = { 
            status: 'processing',
            processing_id: currentUser.id, 
            processor_name: currentUser.nombre 
        };

        const res = await fetch(`${API_URL}/api/orders/${order.id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            // Navegamos al surtido
            router.push({ pathname: '/(panel)/surtido', params: { orderId: order.id } });
            // Al volver, se recargará la lista gracias al useEffect o al refresh manual
        } else {
            showToast(false, "Error. Tal vez ya fue tomada.");
            fetchOrders();
        }
    } catch (e) { showToast(false, "Error de conexión"); }
    finally { setLoading(false); }
  };

  const renderOrderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleStartOrder(item)}>
        <View style={styles.cardHeader}>
            <Text style={styles.orderId}>Orden #{item.id}</Text>
            <View style={[styles.badge, {backgroundColor: item.status === 'processing' ? '#e3f2fd' : '#fff3e0'}]}>
                <Text style={[styles.badgeText, {color: item.status === 'processing' ? '#1565c0' : '#ef6c00'}]}>
                    {item.status === 'processing' ? 'EN PROCESO' : 'POR SURTIR'}
                </Text>
            </View>
        </View>
        <Text style={styles.clientName}>{item.client_name}</Text>
        
        {/* Mostramos quién lo tiene asignado si ya está en proceso */}
        {item.status === 'processing' && (
            <Text style={styles.processor}>
                Asignado a: {item.processor_name || "Mí"}
            </Text>
        )}
        
        <View style={[styles.startButton, item.status === 'processing' && {backgroundColor: '#1565c0'}]}>
            <Text style={styles.startText}>
                {item.status === 'processing' ? 'CONTINUAR' : 'TOMAR PEDIDO'}
            </Text>
            <Ionicons name="arrow-forward-circle" size={24} color="#fff" />
        </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(panel)/almacen')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Despacho</Text>
        <View style={{width: 24}}/>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === 'pending' && styles.activeTab]} onPress={() => setActiveTab('pending')}>
            <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>Por Empacar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'processing' && styles.activeTab]} onPress={() => setActiveTab('processing')}>
            <Text style={[styles.tabText, activeTab === 'processing' && styles.activeTabText]}>Mis Asignaciones</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#1565c0" style={{marginTop: 50}} />
      ) : (
        <FlatList 
            data={displayedOrders}
            keyExtractor={item => item.id.toString()}
            renderItem={renderOrderItem}
            contentContainerStyle={styles.listContent}
            refreshing={refreshing}
            onRefresh={onRefresh}
            ListEmptyComponent={
                <View style={styles.emptyContainer}>
                    <Ionicons name="checkmark-done-circle-outline" size={60} color="#ccc" />
                    <Text style={styles.emptyText}>
                        {activeTab === 'pending' ? "No hay pedidos pendientes." : "No tienes pedidos asignados."}
                    </Text>
                </View>
            }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15,marginTop: 40, backgroundColor: '#fff', elevation: 2 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1565c0' },
  backBtn: { padding: 5 },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', padding: 5, borderBottomWidth: 1, borderBottomColor: '#eee' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#1565c0' },
  tabText: { fontWeight: '600', color: '#888' },
  activeTabText: { color: '#1565c0' },
  listContent: { padding: 15 },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { marginTop: 10, color: '#888', fontSize: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 12, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  orderId: { fontWeight: 'bold', fontSize: 18, color: '#333' },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  clientName: { fontSize: 16, color: '#555', marginBottom: 5 },
  processor: { fontSize: 12, color: '#1565c0', marginBottom: 10, fontStyle: 'italic', fontWeight: '600' },
  startButton: { backgroundColor: '#ef6c00', borderRadius: 8, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  startText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});