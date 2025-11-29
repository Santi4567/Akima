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
  const [activeTab, setActiveTab] = useState<'today' | 'history'>('today');
  
  const { showToast } = useToast();

  // --- ESTADOS PARA MODALES ---
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);

  // --- ESTADOS NUEVA VISITA ---
  const [clientQuery, setClientQuery] = useState('');
  const [clientResults, setClientResults] = useState<any[]>([]);
  const [selectedClientForVisit, setSelectedClientForVisit] = useState<any>(null);
  
  // SEPARACIÓN DE FECHA Y HORA
  const [datePart, setDatePart] = useState(''); // YYYY-MM-DD
  const [timePart, setTimePart] = useState(''); // HH:mm
  const [newVisitNotes, setNewVisitNotes] = useState('');
  const [rescheduleDatePart, setRescheduleDatePart] = useState(''); // YYYY-MM-DD
  const [rescheduleTimePart, setRescheduleTimePart] = useState(''); // HH:mm

  // --- ESTADOS EDICIÓN ---
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [tempDate, setTempDate] = useState(''); 

  useEffect(() => {
    loadVisits();
  }, []);

  useEffect(() => {
    filterVisits();
  }, [allVisits, activeTab]);

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

  // --- 2. FILTRADO CORREGIDO (AQUÍ ESTÁ EL CAMBIO) ---
  const filterVisits = () => {
    const todayStr = new Date().toISOString().split('T')[0]; // Fecha de hoy YYYY-MM-DD

    if (activeTab === 'today') {
      // LOGICA: Mostrar TODAS las pendientes (pasadas, hoy y futuras) 
      // + las completadas SOLO si son de hoy.
      const list = allVisits.filter(v => {
        const vDate = v.scheduled_for.split('T')[0];
        
        // Es pendiente? (Siempre mostrar)
        if (v.status === 'pending') return true;
        
        // Es completada hoy? (Mostrar como avance)
        if (v.status === 'completed' && vDate === todayStr) return true;

        return false;
      });
      // Ordenar: primero las pendientes atrasadas, luego las de hoy
      setFilteredVisits(list.sort((a,b) => new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime()));
    } else {
      // HISTORIAL: Completadas viejas o Canceladas
      const list = allVisits.filter(v => {
        const vDate = v.scheduled_for.split('T')[0];
        // Completadas de dias anteriores O canceladas
        return (v.status === 'completed' && vDate !== todayStr) || v.status === 'cancelled';
      });
      setFilteredVisits(list.sort((a,b) => new Date(b.scheduled_for).getTime() - new Date(a.scheduled_for).getTime()));
    }
  };

  // --- 3. BUSCADOR CLIENTES ---
  const searchClients = async (text: string) => {
    setClientQuery(text);
    if (text.length < 2) {
        setClientResults([]);
        return;
    }
    try {
        const token = await AsyncStorage.getItem('userToken');
        const res = await fetch(`${API_URL}/api/clients/search?q=${text}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setClientResults(data.data);
    } catch (e) { console.error(e); }
  };

  const selectClient = (client: any) => {
    setSelectedClientForVisit(client);
    setClientQuery('');
    setClientResults([]);
  };

  // --- 4. ACCIONES ---

  // ABRIR MODAL NUEVA VISITA (Pre-llenar fecha)
  const openAddModal = () => {
    const now = new Date();
    // Pre-llenamos con la fecha y hora actual redondeada
    const todayISO = now.toISOString().split('T')[0];
    const hour = now.getHours().toString().padStart(2, '0');
    const minutes = '00'; // Redondeamos minutos para facilidad
    
    setDatePart(todayISO);
    setTimePart(`${hour}:${minutes}`);
    setAddModalVisible(true);
  };

  const handleAddVisit = async () => {
    if (!selectedClientForVisit || !datePart || !timePart) {
      showToast(false, "Faltan datos (Cliente, Fecha u Hora)");
      return;
    }

    // Combinar Fecha y Hora -> ISO String
    const combinedDate = `${datePart}T${timePart}:00`;

    try {
        const token = await AsyncStorage.getItem('userToken');
        const res = await fetch(`${API_URL}/api/visits`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
                client_id: selectedClientForVisit.id,
                scheduled_for: combinedDate, 
                notes: newVisitNotes
            })
        });
        const data = await res.json();
        if (data.success) {
            showToast(true, "Visita agendada");
            setAddModalVisible(false);
            // Resetear
            setSelectedClientForVisit(null);
            setClientQuery('');
            setNewVisitNotes('');
            loadVisits();
        }
    } catch (e) { showToast(false, "Error al crear"); }
  };

  // COMPLETAR VISITA
  const handleComplete = (visit: any) => {
    setSelectedVisit(visit);
    setCheckoutNotes('');
    setCheckoutModalVisible(true);
  };

  const submitCheckout = async () => {
    if (!selectedVisit) return;
    await updateVisitStatus(selectedVisit.id, 'completed', checkoutNotes || "Visita completada", selectedVisit.scheduled_for);
    setCheckoutModalVisible(false);
  };

  // REAGENDAR
  const openActionModal = (visit: any) => {
    setSelectedVisit(visit);
    
    // Asumimos formato ISO: "2025-10-30T15:30:00"
    if (visit.scheduled_for) {
        const [date, timeFull] = visit.scheduled_for.split('T');
        setRescheduleDatePart(date);
        // Tomamos solo HH:mm (los primeros 5 caracteres de la hora)
        setRescheduleTimePart(timeFull ? timeFull.substring(0, 5) : '12:00');
    } else {
        setRescheduleDatePart('');
        setRescheduleTimePart('');
    }
    
    setActionModalVisible(true);
  };

const handleReschedule = async () => {
      if (!rescheduleDatePart || !rescheduleTimePart) {
          showToast(false, "Fecha y hora inválidas");
          return;
      }
      // Combinar para enviar a la API
      const combinedDate = `${rescheduleDatePart}T${rescheduleTimePart}:00`;
      
      await updateVisitStatus(selectedVisit.id, 'pending', selectedVisit.notes, combinedDate);
      setActionModalVisible(false);
  };

  const handleCancel = () => {
    Alert.alert("Cancelar", "¿Marcar como cancelada?", [
        { text: "No", style: "cancel" },
        { text: "Sí", style: 'destructive', onPress: async () => {
            await updateVisitStatus(selectedVisit.id, 'cancelled', "Cancelada por usuario", selectedVisit.scheduled_for);
            setActionModalVisible(false);
        }}
    ]);
  };

  const updateVisitStatus = async (id: number, status: string, notes: string, date: string) => {
    try {
        const token = await AsyncStorage.getItem('userToken');
        const res = await fetch(`${API_URL}/api/visits/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ status, notes, scheduled_for: date })
        });
        const data = await res.json();
        if (data.success) {
            showToast(true, status === 'pending' ? "Visita reagendada" : "Estado actualizado");
            loadVisits();
        } else {
            showToast(false, data.message || "Error");
        }
    } catch (e) { showToast(false, "Error de conexión"); }
  };

  // --- RENDER ITEM ---
  const renderItem = ({ item }: { item: any }) => {
    const isCompleted = item.status === 'completed';
    const isCancelled = item.status === 'cancelled';
    
    let badgeColor = '#fbc02d'; // Pending default
    let statusLabel = 'PENDIENTE';
    
    if (isCompleted) { badgeColor = '#2e7d32'; statusLabel = 'COMPLETADA'; }
    else if (isCancelled) { badgeColor = '#d32f2f'; statusLabel = 'CANCELADA'; }

    // Detectar atrasada
    const isOverdue = !isCompleted && !isCancelled && new Date(item.scheduled_for) < new Date();

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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Agenda de Visitas</Text>
        <TouchableOpacity onPress={openAddModal} style={styles.addBtn}>
            <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'today' && styles.activeTab]} onPress={() => setActiveTab('today')}>
            <Text style={[styles.tabText, activeTab === 'today' && styles.activeTabText]}>Hoy / Pendientes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'history' && styles.activeTab]} onPress={() => setActiveTab('history')}>
            <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>Historial</Text>
        </TouchableOpacity>
      </View>

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
                <Ionicons name="calendar-clear-outline" size={50} color="#ccc" />
                <Text style={styles.emptyText}>
                    {activeTab === 'today' ? "No hay visitas pendientes." : "Sin historial reciente."}
                </Text>
            </View>
          }
          refreshing={loading}
          onRefresh={loadVisits}
        />
      )}

      {/* --- MODAL NUEVA VISITA --- */}
      <Modal visible={addModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Nueva Visita</Text>

                <Text style={styles.label}>1. Cliente:</Text>
                {selectedClientForVisit ? (
                    <View style={styles.selectedClientBadge}>
                        <Text style={styles.selectedClientText}>{selectedClientForVisit.first_name} {selectedClientForVisit.last_name}</Text>
                        <TouchableOpacity onPress={() => setSelectedClientForVisit(null)}>
                            <Ionicons name="close-circle" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View>
                        <TextInput 
                            style={styles.input} placeholder="Buscar nombre..." 
                            value={clientQuery} onChangeText={searchClients}
                        />
                        {clientResults.length > 0 && (
                            <View style={styles.searchResults}>
                                <ScrollView style={{maxHeight: 100}}>
                                    {clientResults.map((c) => (
                                        <TouchableOpacity key={c.id} style={styles.searchResultItem} onPress={() => selectClient(c)}>
                                            <Text>{c.first_name} {c.last_name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                    </View>
                )}

                {/* INPUTS SEPARADOS DE FECHA Y HORA */}
                <Text style={styles.label}>2. ¿Cuándo?</Text>
                <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                    <View style={{flex: 1, marginRight: 5}}>
                        <Text style={styles.miniLabel}>Fecha (YYYY-MM-DD)</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder="2025-10-30" 
                            value={datePart} 
                            onChangeText={setDatePart}
                            maxLength={10}
                        />
                    </View>
                    <View style={{width: 100}}>
                        <Text style={styles.miniLabel}>Hora (24h)</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder="14:00" 
                            value={timePart} 
                            onChangeText={setTimePart}
                            maxLength={5}
                        />
                    </View>
                </View>
                
                <Text style={styles.label}>3. Notas:</Text>
                <TextInput 
                    style={[styles.input, {height: 50}]} placeholder="Detalles iniciales..." 
                    value={newVisitNotes} onChangeText={setNewVisitNotes}
                />

                <View style={styles.modalButtons}>
                    <TouchableOpacity onPress={() => setAddModalVisible(false)} style={styles.btnCancel}><Text>Cancelar</Text></TouchableOpacity>
                    <TouchableOpacity onPress={handleAddVisit} style={styles.btnConfirm}><Text style={{color:'#fff'}}>Agendar</Text></TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>

      {/* --- MODAL 2: GESTIÓN (REAGENDAR) --- */}
      <Modal visible={actionModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Gestionar Visita</Text>
                <Text style={styles.modalSub}>{selectedVisit?.client_name}</Text>

                <Text style={styles.label}>Nueva Fecha y Hora:</Text>
                
                {/* INPUTS SEPARADOS */}
                <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15}}>
                    <View style={{flex: 1, marginRight: 5}}>
                        <Text style={styles.miniLabel}>Fecha (YYYY-MM-DD)</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder="2025-10-30" 
                            value={rescheduleDatePart} 
                            onChangeText={setRescheduleDatePart}
                            maxLength={10}
                        />
                    </View>
                    <View style={{width: 100}}>
                        <Text style={styles.miniLabel}>Hora (24h)</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder="14:00" 
                            value={rescheduleTimePart} 
                            onChangeText={setRescheduleTimePart}
                            maxLength={5}
                        />
                    </View>
                </View>

                <TouchableOpacity style={styles.btnReschedule} onPress={handleReschedule}>
                    <Text style={styles.btnTextWhite}>Confirmar Cambio</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity style={styles.btnCancelVisit} onPress={handleCancel}>
                    <Text style={{color: '#d32f2f', fontWeight:'bold'}}>Cancelar Visita</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setActionModalVisible(false)} style={styles.btnClose}>
                    <Text style={{color: '#666'}}>Cerrar</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

      {/* --- MODAL CHECKOUT --- */}
      <Modal visible={checkoutModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Finalizar Visita</Text>
                <Text style={styles.modalSub}>{selectedVisit?.client_name}</Text>

                <Text style={styles.label}>Resultados:</Text>
                <TextInput 
                    style={[styles.input, {height: 80, textAlignVertical: 'top'}]} 
                    placeholder="Resultado..." multiline
                    value={checkoutNotes} onChangeText={setCheckoutNotes}
                />
                <View style={styles.modalButtons}>
                    <TouchableOpacity onPress={() => setCheckoutModalVisible(false)} style={styles.btnCancel}><Text>Cancelar</Text></TouchableOpacity>
                    <TouchableOpacity onPress={submitCheckout} style={styles.btnConfirm}><Text style={{color:'#fff'}}>Finalizar</Text></TouchableOpacity>
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
  
  tabContainer: { flexDirection: 'row', backgroundColor: '#fff', marginTop: 1 },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#2e7d32' },
  tabText: { color: '#888', fontWeight: '600' },
  activeTabText: { color: '#2e7d32' },

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
  btnReschedule: { backgroundColor: '#1976d2', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  btnCancelVisit: { padding: 12, alignItems: 'center', marginBottom: 10 },
  btnClose: { alignSelf: 'center', padding: 10 },
  divider: { height: 1, backgroundColor: '#eee', marginBottom: 10 },
});