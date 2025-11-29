import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  FlatList, Modal, Image, ActivityIndicator, ScrollView, Switch, SafeAreaView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useToast } from '@/components/ToastNotification';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function ProductosScreen() {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Estados para el Modal de Detalle
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [productImages, setProductImages] = useState<any[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  
  // Estado para ocultar información sensible (Modo Cliente)
  const [isClientMode, setIsClientMode] = useState(false);

  const { showToast } = useToast();

  // 1. BUSCAR PRODUCTOS
  const searchProducts = async (text: string) => {
    setQuery(text);
    if (text.length < 2) {
        setProducts([]); 
        return;
    }
    
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${API_URL}/api/products/search?q=${text}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 2. ABRIR DETALLE (Y Cargar Imágenes)
  const openProductDetail = async (prod: any) => {
    setSelectedProduct(prod);
    setProductImages([]); 
    setIsClientMode(false); // Resetear modo cliente al abrir uno nuevo
    setLoadingImages(true);

    try {
        const token = await AsyncStorage.getItem('userToken');
        const res = await fetch(`${API_URL}/api/products/${prod.id}/images`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.success && data.data.length > 0) {
            setProductImages(data.data);
        } else {
            setProductImages([]); 
        }
    } catch (error) {
        showToast(false, "Error al cargar imágenes");
    } finally {
        setLoadingImages(false);
    }
  };

  // 3. RENDER TARJETA (Lista Compacta)
  const renderCard = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} onPress={() => openProductDetail(item)}>
        <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{item.name}</Text>
            <View style={styles.row}>
                <Text style={styles.cardSku}>SKU: {item.sku}</Text>
                <Text style={styles.cardStock}>Stock: {item.stock_quantity}</Text>
            </View>
            <Text style={styles.cardPrice}>${item.price}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#2e7d32" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Catálogo de Productos</Text>
        <View style={{width: 24}} />
      </View>

      {/* BUSCADOR */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#666" />
            <TextInput 
                style={styles.input}
                placeholder="Buscar por nombre o SKU..."
                value={query}
                onChangeText={searchProducts}
                autoFocus={true}
            />
            {query.length > 0 && (
                <TouchableOpacity onPress={() => searchProducts('')}>
                    <Ionicons name="close-circle" size={18} color="#999" />
                </TouchableOpacity>
            )}
        </View>
      </View>

      {/* LISTA DE RESULTADOS */}
      {loading ? (
        <ActivityIndicator size="large" color="#2e7d32" style={{marginTop: 50}} />
      ) : (
        <FlatList 
            data={products}
            keyExtractor={item => item.id.toString()}
            renderItem={renderCard}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
                <View style={styles.emptyContainer}>
                    <Ionicons name="cube-outline" size={60} color="#eee" />
                    <Text style={styles.emptyText}>
                        {query.length < 2 ? "Escribe para buscar..." : "No se encontraron productos."}
                    </Text>
                </View>
            }
        />
      )}

      {/* --- MODAL DETALLE PRODUCTO --- */}
      <Modal visible={!!selectedProduct} animationType="slide" transparent={false}>
        {selectedProduct && (
            <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}}>
                
                {/* Header Modal con Switch */}
                <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={() => setSelectedProduct(null)} style={styles.closeModalBtn}>
                        <Ionicons name="close" size={28} color="#333" />
                    </TouchableOpacity>
                    
                    <View style={styles.switchContainer}>
                        <Text style={styles.switchLabel}>Modo Cliente</Text>
                        <Switch 
                            value={isClientMode} 
                            onValueChange={setIsClientMode}
                            trackColor={{false: '#ccc', true: '#81c784'}}
                            thumbColor={isClientMode ? '#2e7d32' : '#f4f3f4'}
                        />
                    </View>
                </View>

                <ScrollView contentContainerStyle={styles.modalScroll}>
                    
                    {/* IMAGEN (Siempre visible) */}
                    <View style={styles.imageContainer}>
                        {loadingImages ? (
                            <ActivityIndicator size="large" color="#2e7d32" />
                        ) : productImages.length > 0 ? (
                            <Image 
                                source={{ uri: `${API_URL}${productImages[0].image_path}` }} 
                                style={styles.productImage}
                                resizeMode="contain"
                            />
                        ) : (
                            <View style={styles.noImage}>
                                <Ionicons name="image-outline" size={80} color="#ccc" />
                                <Text style={styles.noImageText}>Sin imagen disponible</Text>
                            </View>
                        )}
                    </View>

                    {/* DATOS DEL PRODUCTO */}
                    <View style={styles.detailsContainer}>
                        {/* Nombre siempre visible y centrado en modo cliente */}
                        <Text style={[styles.detailName, isClientMode && {textAlign: 'center', fontSize: 28}]}>
                            {selectedProduct.name}
                        </Text>

                        {/* BLOQUE DE INFORMACIÓN (Solo si NO es modo cliente) */}
                        {!isClientMode && (
                            <>
                                <Text style={styles.detailPrice}>${selectedProduct.price}</Text>
                                
                                <View style={styles.tagContainer}>
                                    <View style={styles.skuBadge}>
                                        <Text style={styles.skuText}>SKU: {selectedProduct.sku}</Text>
                                    </View>
                                    <View style={[styles.skuBadge, {backgroundColor: '#e3f2fd'}]}>
                                        <Text style={[styles.skuText, {color: '#1565c0'}]}>
                                            Stock: {selectedProduct.stock_quantity}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.divider} />

                                <Text style={styles.label}>Descripción:</Text>
                                <Text style={styles.description}>
                                    {selectedProduct.description || "Sin descripción detallada."}
                                </Text>

                                {selectedProduct.attributes_list && (
                                    <View style={styles.attrsBox}>
                                        {selectedProduct.attributes_list.map((attr: any, idx: number) => (
                                            <Text key={idx} style={styles.attrText}>
                                                • {attr.title}: <Text style={{fontWeight:'bold'}}>{attr.description}</Text>
                                            </Text>
                                        ))}
                                    </View>
                                )}
                            </>
                        )}
                    </View>

                </ScrollView>
            </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15,marginTop:30, backgroundColor: '#fff', elevation: 2 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  backBtn: { padding: 5 },

  searchContainer: { padding: 15, backgroundColor: '#fff', paddingBottom: 10 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 10, paddingHorizontal: 10, height: 45 },
  input: { flex: 1, marginLeft: 10, fontSize: 16 },

  listContent: { padding: 15 },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { marginTop: 10, color: '#999', fontSize: 16 },

  // Card Styles
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 12, alignItems: 'center', elevation: 2 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  row: { flexDirection: 'row', gap: 15, marginBottom: 4 },
  cardSku: { fontSize: 12, color: '#888' },
  cardStock: { fontSize: 12, color: '#1565c0', fontWeight: '600' },
  cardPrice: { fontSize: 15, fontWeight: 'bold', color: '#2e7d32' },

  // Modal Header
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee',
    backgroundColor: '#fff'
  },
  closeModalBtn: { padding: 5 },
  switchContainer: { flexDirection: 'row', alignItems: 'center' },
  switchLabel: { marginRight: 10, color: '#666', fontWeight: '600' },
  
  modalScroll: { paddingBottom: 30 },
  
  // Imagen
  imageContainer: { width: '100%', height: 350, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  productImage: { width: '100%', height: '100%' },
  noImage: { alignItems: 'center' },
  noImageText: { color: '#aaa', marginTop: 10 },

  // Detalles
  detailsContainer: { padding: 20 },
  detailName: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  detailPrice: { fontSize: 28, fontWeight: 'bold', color: '#2e7d32', marginBottom: 15 },
  
  tagContainer: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  skuBadge: { backgroundColor: '#eee', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  skuText: { fontSize: 12, color: '#555', fontWeight: 'bold' },

  divider: { height: 1, backgroundColor: '#eee', marginBottom: 20 },
  label: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  description: { fontSize: 15, color: '#555', lineHeight: 22 },

  attrsBox: { marginTop: 20, backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10 },
  attrText: { fontSize: 14, color: '#555', marginBottom: 5 },
});