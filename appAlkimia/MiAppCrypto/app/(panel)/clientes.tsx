import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  TextInput, Modal, ActivityIndicator, Linking,Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard'; // Para copiar coordenadas

import { useToast } from '@/components/ToastNotification';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function ClientesScreen() {
  const [query, setQuery] = useState('');
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null); // Para el Modal de detalle
  
  const { showToast } = useToast();

  // Carga inicial
  useEffect(() => {
    searchClients('');
  }, []);

  // --- FUNCIÓN DE BÚSQUEDA ---
  const searchClients = async (text: string) => {
    setQuery(text);
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      // Si el texto está vacío, traemos todos (o los primeros 20), si no, buscamos
      const endpoint = text.length > 0 
        ? `${API_URL}/api/clients/search?q=${text}`
        : `${API_URL}/api/clients`; // Asumiendo que tienes un endpoint para listar todos

      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        // --- MOCK GPS (Simulación) ---
        // Aquí inyectamos coordenadas falsas a los datos para que pruebes los botones
        const clientsWithGPS = data.data.map((c: any) => ({
            ...c,
            // Si la API no trae gps, ponemos una coordenada aleatoria cerca de CDMX para probar
            gps_coordinates: c.gps_coordinates || "19.432608, -99.133209" 
        }));
        setClients(clientsWithGPS);
      }
    } catch (error) {
      console.error(error);
      showToast(false, "Error al cargar clientes");
    } finally {
      setLoading(false);
    }
  };

  // --- ACCIONES DE GPS ---
  
  // 1. Copiar al portapapeles
  const handleCopyGPS = async (gps: string) => {
    await Clipboard.setStringAsync(gps);
    showToast(true, "Coordenadas copiadas 📋");
  };

  // 2. Abrir Google Maps
  const handleOpenMaps = (gps: string) => {
    // Esquema universal para abrir mapas con marcador
    const url = `https://www.google.com/maps/search/?api=1&query=${gps}`;
    Linking.openURL(url).catch(err => {
        showToast(false, "No se pudo abrir el mapa");
    });
  };

  // --- ACCIONES DE CONTACTO ---
  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  // --- RENDER ITEM LISTA ---
  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} onPress={() => setSelectedClient(item)}>
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>{item.first_name.charAt(0)}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.name}>{item.first_name} {item.last_name}</Text>
        <Text style={styles.company}>{item.company_name}</Text>
        <Text style={styles.subText}>📍 {item.address || "Sin dirección"}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Mis Clientes</Text>
        <View style={{width: 24}} /> 
      </View>

      {/* Buscador */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#666" />
            <TextInput 
                style={styles.input}
                placeholder="Buscar cliente, empresa..."
                value={query}
                onChangeText={searchClients}
            />
            {query.length > 0 && (
                <TouchableOpacity onPress={() => searchClients('')}>
                    <Ionicons name="close-circle" size={18} color="#999" />
                </TouchableOpacity>
            )}
        </View>
      </View>

      {/* Lista */}
      {loading ? (
        <ActivityIndicator size="large" color="#1565c0" style={{marginTop: 50}} />
      ) : (
        <FlatList 
            data={clients}
            keyExtractor={item => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
                <View style={styles.emptyContainer}>
                    <Ionicons name="people-outline" size={50} color="#ccc" />
                    <Text style={styles.emptyText}>No se encontraron clientes.</Text>
                </View>
            }
        />
      )}

      {/* --- MODAL DETALLE CLIENTE --- */}
      <Modal visible={!!selectedClient} animationType="slide" presentationStyle="pageSheet">
        {selectedClient && (
            <View style={styles.modalContainer}>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={() => setSelectedClient(null)} style={styles.closeBtn}>
                        <Ionicons name="close" size={28} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Detalle del Cliente</Text>
                    <TouchableOpacity style={styles.editBtn}>
                         <Text style={styles.editText}>Editar</Text>
                    </TouchableOpacity>
                </View>

                {/* Info Principal */}
                <View style={styles.profileHeader}>
                    <View style={styles.bigAvatar}>
                        <Text style={styles.bigAvatarText}>{selectedClient.first_name.charAt(0)}</Text>
                    </View>
                    <Text style={styles.profileName}>{selectedClient.first_name} {selectedClient.last_name}</Text>
                    <Text style={styles.profileCompany}>{selectedClient.company_name}</Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{selectedClient.status.toUpperCase()}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Sección de Contacto Rápido */}
                <View style={styles.actionGrid}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleCall(selectedClient.phone)}>
                        <View style={[styles.iconBox, {backgroundColor: '#e3f2fd'}]}>
                            <Ionicons name="call" size={24} color="#1565c0" />
                        </View>
                        <Text style={styles.actionText}>Llamar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleEmail(selectedClient.email)}>
                        <View style={[styles.iconBox, {backgroundColor: '#fff3e0'}]}>
                            <Ionicons name="mail" size={24} color="#ef6c00" />
                        </View>
                        <Text style={styles.actionText}>Correo</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn}>
                         <View style={[styles.iconBox, {backgroundColor: '#e8f5e9'}]}>
                            <Ionicons name="logo-whatsapp" size={24} color="#2e7d32" />
                        </View>
                        <Text style={styles.actionText}>WhatsApp</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.divider} />

                {/* SECCIÓN UBICACIÓN Y GPS */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Ubicación</Text>
                    <Text style={styles.addressText}>{selectedClient.address}</Text>
                    
                    {/* Botones GPS */}
                    <View style={styles.gpsContainer}>
                        <View style={styles.gpsInfo}>
                            <Ionicons name="location-sharp" size={20} color="#d32f2f" />
                            <Text style={styles.coordsText}>
                                {selectedClient.gps_coordinates || "Sin coordenadas"}
                            </Text>
                        </View>

                        <View style={styles.gpsButtons}>
                            <TouchableOpacity 
                                style={styles.gpsBtnOutline} 
                                onPress={() => handleCopyGPS(selectedClient.gps_coordinates)}
                            >
                                <Ionicons name="copy-outline" size={18} color="#555" />
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.gpsBtnSolid} 
                                onPress={() => handleOpenMaps(selectedClient.gps_coordinates)}
                            >
                                <Ionicons name="map" size={18} color="#fff" />
                                <Text style={styles.gpsBtnText}>Cómo llegar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                 {/* Notas extras */}
                 {selectedClient.notes && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Notas</Text>
                        <Text style={styles.notesText}>{selectedClient.notes}</Text>
                    </View>
                 )}

            </View>
        )}
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1565c0' },
  backBtn: { padding: 5 },
  
  // Search
  searchContainer: { padding: 15, backgroundColor: '#fff', paddingBottom: 10 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 10, paddingHorizontal: 10, height: 45 },
  input: { flex: 1, marginLeft: 10, fontSize: 16 },

  // List
  listContent: { padding: 15 },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { marginTop: 10, color: '#888' },

  // Card Item
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  avatarContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#e3f2fd', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#1565c0' },
  cardContent: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  company: { fontSize: 14, color: '#1565c0', marginBottom: 2 },
  subText: { fontSize: 12, color: '#666' },

  // --- MODAL STYLES ---
  modalContainer: { flex: 1, backgroundColor: '#fff', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 10 },
  modalTitle: { fontSize: 18, fontWeight: '600' },
  closeBtn: { padding: 5 },
  editBtn: { padding: 5 },
  editText: { color: '#1565c0', fontWeight: 'bold' },

  profileHeader: { alignItems: 'center', marginBottom: 20 },
  bigAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1565c0', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  bigAvatarText: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  profileName: { fontSize: 22, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  profileCompany: { fontSize: 16, color: '#666', marginBottom: 5 },
  badge: { backgroundColor: '#e8f5e9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 5 },
  badgeText: { color: '#2e7d32', fontSize: 10, fontWeight: 'bold' },

  divider: { height: 1, backgroundColor: '#eee', marginVertical: 20 },

  actionGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  actionBtn: { alignItems: 'center' },
  iconBox: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  actionText: { fontSize: 12, color: '#555' },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  addressText: { fontSize: 15, color: '#555', lineHeight: 22, marginBottom: 10 },
  notesText: { fontSize: 14, color: '#666', fontStyle: 'italic', backgroundColor: '#fafafa', padding: 10, borderRadius: 8 },

  // GPS Styles
  gpsContainer: { backgroundColor: '#fafafa', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#eee' },
  gpsInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  coordsText: { marginLeft: 5, color: '#555', fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  gpsButtons: { flexDirection: 'row', gap: 10 },
  gpsBtnOutline: { padding: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  gpsBtnSolid: { flex: 1, flexDirection: 'row', backgroundColor: '#1a73e8', padding: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  gpsBtnText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
});