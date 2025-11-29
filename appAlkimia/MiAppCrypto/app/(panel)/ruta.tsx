import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  Modal, TextInput, ActivityIndicator, Alert, ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useToast } from '@/components/ToastNotification';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function RutaScreen() {
  const [allVisits, setAllVisits] = useState<any[]>([]);
  const [filteredVisits, setFilteredVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- CONTROL DE PESTAÑAS PRINCIPALES ---
  const [activeTab, setActiveTab] = useState<'today' | 'history'>('today');

  // --- SUB-FILTROS ---
  // Hoy: 'all' (todas las pendientes), 'upcoming' (futuras/hoy), 'overdue' (atrasadas)
  const [todayFilter, setTodayFilter] = useState<'all' | 'upcoming' | 'overdue'>('all');
  
  // Historial: Estado ('all', 'completed', 'cancelled') y Fecha específica
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [historyDateFilter, setHistoryDateFilter] = useState(''); // YYYY-MM-DD

  const { showToast } = useToast();

  // --- ESTADOS PARA MODALES ---
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);

  // Estados Nueva Visita
  const [clientQuery, setClientQuery] = useState('');
  const [clientResults, setClientResults] = useState<any[]>([]);
  const [selectedClientForVisit, setSelectedClientForVisit] = useState<any>(null);
  const [datePart, setDatePart] = useState(''); 
  const [timePart, setTimePart] = useState(''); 
  const [newVisitNotes, setNewVisitNotes] = useState('');

  // Estados Edición
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [cancelNotes, setCancelNotes] = useState('');
  const [rescheduleDatePart, setRescheduleDatePart] = useState('');
  const [rescheduleTimePart, setRescheduleTimePart] = useState('');

  useEffect(() => {
    loadVisits();
  }, []);

  // Re-filtrar cuando cambian los datos o CUALQUIER filtro
  useEffect(() => {
    filterVisits();
  }, [allVisits, activeTab, todayFilter, historyStatusFilter, historyDateFilter]);

  // --- 1. CARGAR VISITAS ---
  const loadVisits = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${API_URL}/api/visits`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setAllVisits(data.data);
    } catch (error) {
      showToast(false, "Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  // --- 2. FILTRADO CORREGIDO (CON HORA LOCAL) ---
  const filterVisits = () => {
    // CORRECCIÓN: Usamos fecha local del dispositivo, no UTC
    const now = new Date();
    // Construimos YYYY-MM-DD manualmente para asegurar zona horaria local
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    let list: any[] = [];

    if (activeTab === 'today') {
      // BASE: Solo tomamos las PENDIENTES
      // (Las completadas/canceladas siempre van a historial)
      list = allVisits.filter(v => v.status === 'pending');

      // SUB-FILTROS
      if (todayFilter === 'overdue') {
          // Atrasadas: Estrictamente MENOR a hoy
          list = list.filter(v => {
            const vDate = v.scheduled_for.split('T')[0];
            return vDate < todayStr;
          });
      } else if (todayFilter === 'upcoming') {
          // Próximas: HOY o FUTURO (Mayor o igual a hoy)
          list = list.filter(v => {
            const vDate = v.scheduled_for.split('T')[0];
            return vDate >= todayStr;
          });
      }
      // Si es 'all', no filtramos fecha, mostramos todas las pendientes (atrasadas + hoy + futuras)
      
      // ORDENAMIENTO: Ascendente (Lo más viejo o próximo arriba)
      list.sort((a,b) => new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime());

    } else {
      // HISTORIAL: Completadas o Canceladas (Sin importar fecha)
      list = allVisits.filter(v => v.status === 'completed' || v.status === 'cancelled');

      // Sub-filtro de Estado en Historial
      if (historyStatusFilter !== 'all') {
          list = list.filter(v => v.status === historyStatusFilter);
      }

      // Sub-filtro de Fecha Específica
      if (historyDateFilter.length === 10) {
          list = list.filter(v => v.scheduled_for.startsWith(historyDateFilter));
      }

      // ORDENAMIENTO: Descendente (Lo más reciente arriba)
      list.sort((a,b) => new Date(b.scheduled_for).getTime() - new Date(a.scheduled_for).getTime());
    }

    setFilteredVisits(list);
  };

  // --- 3. FUNCIONES AUXILIARES ---
  const searchClients = async (text: string) => {
    setClientQuery(text);
    if (text.length < 2) { setClientResults([]); return; }
    try {
        const token = await AsyncStorage.getItem('userToken');
        const res = await fetch(`${API_URL}/api/clients/search?q=${text}`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.success) setClientResults(data.data);
    } catch (e) { console.error(e); }
  };

  const selectClient = (client: any) => {
    setSelectedClientForVisit(client);
    setClientQuery('');
    setClientResults([]);
  };

  const openAddModal = () => {
    const now = new Date();
    setDatePart(now.toISOString().split('T')[0]);
    setTimePart(`${now.getHours().toString().padStart(2,'0')}:00`);
    setAddModalVisible(true);
  };

  // --- 4. ACCIONES CRUD ---

  const handleAddVisit = async () => {
    if (!selectedClientForVisit || !datePart || !timePart) {
      showToast(false, "Faltan datos"); return;
    }
    const combinedDate = `${datePart}T${timePart}:00`;
    try {
        const token = await AsyncStorage.getItem('userToken');
        const res = await fetch(`${API_URL}/api/visits`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ client_id: selectedClientForVisit.id, scheduled_for: combinedDate, notes: newVisitNotes })
        });
        const data = await res.json();
        if (data.success) {
            showToast(true, "Visita agendada");
            setAddModalVisible(false);
            setSelectedClientForVisit(null); setNewVisitNotes('');
            loadVisits();
        }
    } catch (e) { showToast(false, "Error al crear"); }
  };

  const updateVisitStatus = async (id: number, status: string, notes: string, date?: string) => {
    try {
        const token = await AsyncStorage.getItem('userToken');
        const payload: any = { status, notes };
        if (date && status === 'pending') payload.scheduled_for = date;

        const res = await fetch(`${API_URL}/api/visits/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
            showToast(true, "Actualizado correctamente");
            loadVisits();
            return true;
        } else {
            showToast(false, data.message || "Error"); return false;
        }
    } catch (e) { showToast(false, "Error de conexión"); return false; }
  };

  // Manejadores de botones
  const handleComplete = (visit: any) => { setSelectedVisit(visit); setCheckoutNotes(''); setCheckoutModalVisible(true); };
  const submitCheckout = async () => { if(await updateVisitStatus(selectedVisit.id, 'completed', checkoutNotes)) setCheckoutModalVisible(false); };
  
  const handleCancelBtn = () => { setCancelNotes(''); setCancelModalVisible(true); setActionModalVisible(false); };
  const submitCancel = async () => { if(await updateVisitStatus(selectedVisit.id, 'cancelled', cancelNotes)) setCancelModalVisible(false); };

  const openActionModal = (visit: any) => {
      setSelectedVisit(visit);
      if (visit.scheduled_for) {
        const [d, t] = visit.scheduled_for.split('T');
        setRescheduleDatePart(d); setRescheduleTimePart(t ? t.substring(0,5) : '12:00');
      }
      setActionModalVisible(true);
  };
  const handleReschedule = async () => {
      const combined = `${rescheduleDatePart}T${rescheduleTimePart}:00`;
      if(await updateVisitStatus(selectedVisit.id, 'pending', selectedVisit.notes, combined)) setActionModalVisible(false);
  };

  // --- RENDER ITEM ---
  const renderItem = ({ item }: { item: any }) => {
    const isCompleted = item.status === 'completed';
    const isCancelled = item.status === 'cancelled';
    const isOverdue = !isCompleted && !isCancelled && new Date(item.scheduled_for) < new Date();
    
    let badgeColor = '#fbc02d'; 
    let statusLabel = 'PENDIENTE';
    if (isCompleted) { badgeColor = '#2e7d32'; statusLabel = 'COMPLETADA'; }
    else if (isCancelled) { badgeColor = '#d32f2f'; statusLabel = 'CANCELADA'; }

    return (
      <View style={[styles.card, isCancelled && { opacity: 0.6 }]}>
        <View style={styles.cardHeader}>
          <Text style={styles.clientName}>{item.client_name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: isOverdue ? '#e65100' : badgeColor }]}>
             <Text style={styles.statusText}>{isOverdue ? 'ATRASADA' : statusLabel}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color="#555" />
          <Text style={styles.infoText}>
             {new Date(item.scheduled_for).toLocaleDateString()} • {new Date(item.scheduled_for).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
          </Text>
        </View>
        {item.notes && <Text style={styles.notes}>📝 {item.notes}</Text>}
        
        {/* Solo mostrar acciones si es pendiente */}
        {!isCompleted && !isCancelled && (
            <View style={styles.actionRow}>
                <TouchableOpacity style={styles.btnPrimary} onPress={() => handleComplete(item)}>
                    <Ionicons name="checkmark-circle" size={18} color="#fff" />
                    <Text style={styles.btnTextWhite}>Registrar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnSecondary} onPress={() => openActionModal(item)}>
                    <Ionicons name="options" size={18} color="#2e7d32" />
                    <Text style={styles.btnTextGreen}>Opciones</Text>
                </TouchableOpacity>
            </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(panel)/vendedor')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Agenda de Visitas</Text>
        <TouchableOpacity onPress={openAddModal} style={styles.addBtn}>
            <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* TABS PRINCIPALES */}
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'today' && styles.activeTab]} onPress={() => {setActiveTab('today'); setTodayFilter('all');}}>
            <Text style={[styles.tabText, activeTab === 'today' && styles.activeTabText]}>Pendientes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'history' && styles.activeTab]} onPress={() => {setActiveTab('history'); setHistoryStatusFilter('all'); setHistoryDateFilter('');}}>
            <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>Historial</Text>
        </TouchableOpacity>
      </View>

      {/* --- BARRA DE FILTROS SECUNDARIOS --- */}
      <View style={styles.filterBar}>
        {activeTab === 'today' ? (
            // FILTROS PARA TAB HOY
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                 <TouchableOpacity onPress={() => setTodayFilter('all')} style={[styles.filterChip, todayFilter === 'all' && styles.filterChipActive]}>
                    <Text style={[styles.filterChipText, todayFilter === 'all' && styles.filterChipTextActive]}>Todas</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setTodayFilter('upcoming')} style={[styles.filterChip, todayFilter === 'upcoming' && styles.filterChipActive]}>
                    <Text style={[styles.filterChipText, todayFilter === 'upcoming' && styles.filterChipTextActive]}>Próximas</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setTodayFilter('overdue')} style={[styles.filterChip, todayFilter === 'overdue' && styles.filterChipActive, {borderColor: '#e65100'}]}>
                    <Text style={[styles.filterChipText, todayFilter === 'overdue' && styles.filterChipTextActive, {color: todayFilter === 'overdue' ? '#fff' : '#e65100'}]}>Atrasadas</Text>
                </TouchableOpacity>
            </ScrollView>
        ) : (
            // FILTROS PARA TAB HISTORIAL
            <View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 10}}>
                    <TouchableOpacity onPress={() => setHistoryStatusFilter('all')} style={[styles.filterChip, historyStatusFilter === 'all' && styles.filterChipActive]}>
                        <Text style={[styles.filterChipText, historyStatusFilter === 'all' && styles.filterChipTextActive]}>Todo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setHistoryStatusFilter('completed')} style={[styles.filterChip, historyStatusFilter === 'completed' && styles.filterChipActive]}>
                        <Text style={[styles.filterChipText, historyStatusFilter === 'completed' && styles.filterChipTextActive]}>Completadas</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setHistoryStatusFilter('cancelled')} style={[styles.filterChip, historyStatusFilter === 'cancelled' && styles.filterChipActive]}>
                        <Text style={[styles.filterChipText, historyStatusFilter === 'cancelled' && styles.filterChipTextActive]}>Canceladas</Text>
                    </TouchableOpacity>
                </ScrollView>
                
                {/* BUSCADOR DE FECHA */}
                <View style={styles.dateFilterRow}>
                    <Ionicons name="search" size={20} color="#666" />
                    <TextInput 
                        style={styles.dateFilterInput}
                        placeholder="Filtrar fecha (YYYY-MM-DD)"
                        value={historyDateFilter}
                        onChangeText={setHistoryDateFilter}
                        maxLength={10}
                    />
                    {historyDateFilter.length > 0 && (
                        <TouchableOpacity onPress={() => setHistoryDateFilter('')}>
                            <Ionicons name="close-circle" size={18} color="#999" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        )}
      </View>

      {/* LISTA */}
      {loading ? (
        <ActivityIndicator size="large" color="#2e7d32" style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={filteredVisits}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Ionicons name="file-tray-outline" size={50} color="#ccc" />
                <Text style={styles.emptyText}>No hay visitas con estos filtros.</Text>
            </View>
          }
          refreshing={loading}
          onRefresh={loadVisits}
        />
      )}

      {/* MODAL 1: NUEVA VISITA */}
      <Modal visible={addModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Nueva Visita</Text>
                <Text style={styles.label}>1. Cliente:</Text>
                {selectedClientForVisit ? (
                    <View style={styles.selectedClientBadge}>
                        <Text style={styles.selectedClientText}>{selectedClientForVisit.first_name} {selectedClientForVisit.last_name}</Text>
                        <TouchableOpacity onPress={() => setSelectedClientForVisit(null)}><Ionicons name="close-circle" size={20} color="#fff" /></TouchableOpacity>
                    </View>
                ) : (
                    <View>
                        <TextInput style={styles.input} placeholder="Buscar nombre..." value={clientQuery} onChangeText={searchClients} />
                        {clientResults.length > 0 && (
                            <View style={styles.searchResults}>
                                <ScrollView style={{maxHeight: 100}}>
                                    {clientResults.map(c => (<TouchableOpacity key={c.id} style={styles.searchResultItem} onPress={() => selectClient(c)}><Text>{c.first_name} {c.last_name}</Text></TouchableOpacity>))}
                                </ScrollView>
                            </View>
                        )}
                    </View>
                )}
                <Text style={styles.label}>2. ¿Cuándo?</Text>
                <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                    <View style={{flex: 1, marginRight: 5}}><Text style={styles.miniLabel}>Fecha (YYYY-MM-DD)</Text><TextInput style={styles.input} value={datePart} onChangeText={setDatePart} maxLength={10} /></View>
                    <View style={{width: 100}}><Text style={styles.miniLabel}>Hora (24h)</Text><TextInput style={styles.input} value={timePart} onChangeText={setTimePart} maxLength={5} /></View>
                </View>
                <Text style={styles.label}>3. Notas:</Text>
                <TextInput style={[styles.input, {height: 50}]} placeholder="Detalles..." value={newVisitNotes} onChangeText={setNewVisitNotes} />
                <View style={styles.modalButtons}>
                    <TouchableOpacity onPress={() => setAddModalVisible(false)} style={styles.btnCancel}><Text>Cancelar</Text></TouchableOpacity>
                    <TouchableOpacity onPress={handleAddVisit} style={styles.btnConfirm}><Text style={{color:'#fff'}}>Agendar</Text></TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>

      {/* MODAL 2: GESTIÓN */}
      <Modal visible={actionModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Gestionar Visita</Text>
                <Text style={styles.modalSub}>{selectedVisit?.client_name}</Text>
                <Text style={styles.label}>Nueva Fecha y Hora:</Text>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15}}>
                    <View style={{flex: 1, marginRight: 5}}><TextInput style={styles.input} placeholder="YYYY-MM-DD" value={rescheduleDatePart} onChangeText={setRescheduleDatePart} /></View>
                    <View style={{width: 100}}><TextInput style={styles.input} placeholder="HH:mm" value={rescheduleTimePart} onChangeText={setRescheduleTimePart} /></View>
                </View>
                <TouchableOpacity style={styles.btnReschedule} onPress={handleReschedule}><Ionicons name="calendar-outline" size={18} color="#fff" /><Text style={styles.btnTextWhite}>Confirmar Cambio</Text></TouchableOpacity>
                <View style={styles.divider} />
                <TouchableOpacity style={styles.btnCancelVisit} onPress={handleCancelBtn}><Ionicons name="close-circle-outline" size={20} color="#d32f2f" /><Text style={{color: '#d32f2f', fontWeight:'bold', marginLeft: 5}}>Cancelar Visita</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setActionModalVisible(false)} style={styles.btnClose}><Text style={{color: '#666'}}>Cerrar</Text></TouchableOpacity>
            </View>
        </View>
      </Modal>

      {/* MODAL 3: CHECKOUT */}
      <Modal visible={checkoutModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Finalizar Visita</Text>
                <Text style={styles.label}>Resultados:</Text>
                <TextInput style={[styles.input, {height: 80, textAlignVertical: 'top'}]} placeholder="Resultado..." multiline value={checkoutNotes} onChangeText={setCheckoutNotes} />
                <View style={styles.modalButtons}>
                    <TouchableOpacity onPress={() => setCheckoutModalVisible(false)} style={styles.btnCancel}><Text>Cancelar</Text></TouchableOpacity>
                    <TouchableOpacity onPress={submitCheckout} style={styles.btnConfirm}><Text style={{color:'#fff'}}>Finalizar</Text></TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>

      {/* MODAL 4: CANCELAR */}
      <Modal visible={cancelModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, {borderLeftWidth: 5, borderLeftColor: '#d32f2f'}]}>
                <Text style={[styles.modalTitle, {color: '#d32f2f'}]}>Cancelar Visita</Text>
                <Text style={styles.label}>Motivo (Obligatorio):</Text>
                <TextInput style={[styles.input, {height: 80, textAlignVertical: 'top'}]} placeholder="Motivo..." multiline value={cancelNotes} onChangeText={setCancelNotes} />
                <View style={styles.modalButtons}>
                    <TouchableOpacity onPress={() => setCancelModalVisible(false)} style={styles.btnCancel}><Text>Regresar</Text></TouchableOpacity>
                    <TouchableOpacity onPress={submitCancel} style={[styles.btnConfirm, {backgroundColor: '#d32f2f'}]}><Text style={{color:'#fff', fontWeight: 'bold'}}>Confirmar</Text></TouchableOpacity>
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
  title: { fontSize: 20, fontWeight: 'bold', color: '#2e7d32' },
  backBtn: { padding: 5 },
  addBtn: { backgroundColor: '#2e7d32', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  
  tabContainer: { flexDirection: 'row', backgroundColor: '#fff', marginTop: 1, borderBottomWidth: 1, borderBottomColor: '#eee' },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#2e7d32' },
  tabText: { color: '#888', fontWeight: '600' },
  activeTabText: { color: '#2e7d32' },

  // FILTER BAR
  filterBar: { backgroundColor: '#fff', padding: 10, paddingBottom: 15 },
  filterChip: { paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', marginRight: 10, backgroundColor: '#f9f9f9' },
  filterChipActive: { backgroundColor: '#2e7d32', borderColor: '#2e7d32' },
  filterChipText: { color: '#666', fontSize: 13, fontWeight: '500' },
  filterChipTextActive: { color: '#fff' },

  dateFilterRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 8, paddingHorizontal: 10, height: 40, marginTop: 5 },
  dateFilterInput: { flex: 1, marginLeft: 10, color: '#333' },

  listContent: { padding: 15 },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { marginTop: 10, color: '#888' },

  card: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  clientName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  infoText: { marginLeft: 6, color: '#555', fontSize: 13 },
  notes: { fontSize: 12, color: '#666', fontStyle: 'italic', backgroundColor: '#f9f9f9', padding: 8, borderRadius: 4, marginTop: 5 },

  actionRow: { flexDirection: 'row', marginTop: 12 },
  btnPrimary: { flex: 1, backgroundColor: '#2e7d32', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 10, borderRadius: 8, marginRight: 8 },
  btnSecondary: { flex: 1, backgroundColor: '#e8f5e9', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#2e7d32' },
  btnTextWhite: { color: '#fff', fontWeight: 'bold', marginLeft: 5 },
  btnTextGreen: { color: '#2e7d32', fontWeight: 'bold', marginLeft: 5 },

  // MODALES
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 15, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  modalSub: { textAlign: 'center', color: '#666', marginBottom: 15 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 10, backgroundColor: '#fafafa' },
  label: { marginBottom: 5, fontWeight: '600', color: '#444' },
  miniLabel: { fontSize: 12, color: '#666', marginBottom: 2 },
  searchResults: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee', borderRadius: 8, maxHeight: 100, marginBottom: 10 },
  searchResultItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  selectedClientBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#2e7d32', padding: 10, borderRadius: 8, marginBottom: 15 },
  selectedClientText: { color: '#fff', fontWeight: 'bold' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  btnCancel: { padding: 12, backgroundColor: '#eee', borderRadius: 8, flex: 1, marginRight: 10, alignItems: 'center' },
  btnConfirm: { padding: 12, backgroundColor: '#2e7d32', borderRadius: 8, flex: 1, alignItems: 'center' },
  btnReschedule: { backgroundColor: '#1976d2', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 15, flexDirection: 'row', justifyContent: 'center' },
  btnCancelVisit: { padding: 12, alignItems: 'center', marginBottom: 10, flexDirection: 'row', justifyContent: 'center' },
  btnClose: { alignSelf: 'center', padding: 10 },
  divider: { height: 1, backgroundColor: '#eee', marginBottom: 10 },
});