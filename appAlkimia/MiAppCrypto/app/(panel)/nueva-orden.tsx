import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  FlatList, ActivityIndicator, Keyboard, Switch, ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router'; // <--- Importante

// Importamos lo que creamos en la Sección 1
import { useCart } from '@/context/CartContext';
import { useToast } from '@/components/ToastNotification';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// ==========================================
// 1. COMPONENTES AUXILIARES (DEFINIDOS FUERA)
// ==========================================

// --- SELECCIÓN DE CLIENTE ---
const ClientSelector = ({ onSelect }: { onSelect: () => void }) => {
  const [query, setQuery] = useState('');
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { setOrderClient } = useCart();
  const { showToast } = useToast();

  const searchClients = async (text: string) => {
    setQuery(text);
    if (text.length < 2) return; 

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${API_URL}/api/clients/search?q=${text}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setClients(data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (client: any) => {
    setOrderClient(client);
    showToast(true, `Cliente ${client.first_name} seleccionado`);
    onSelect(); 
  };

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.headerTitle}>1. Selecciona un Cliente</Text>
      
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput 
          style={styles.searchInput}
          placeholder="Buscar por nombre..."
          value={query}
          onChangeText={searchClients}
        />
      </View>

      <FlatList
        data={clients}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
            !loading && query.length > 2 ? <Text style={styles.emptyText}>No se encontraron clientes.</Text> : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.clientCard} onPress={() => handleSelect(item)}>
            <View>
              <Text style={styles.clientName}>{item.first_name} {item.last_name}</Text>
              <Text style={styles.clientSub}>{item.company_name}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#2e7d32" />
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

// --- BUSCADOR Y DETALLE DE PRODUCTO ---
const ProductManager = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  
  const [quantity, setQuantity] = useState(1);
  const [hidePrice, setHidePrice] = useState(false);
  
  const { addItem } = useCart();
  const { showToast } = useToast();

  const searchProducts = async (text: string) => {
    setQuery(text);
    if (text.length < 2) {
        setResults([]);
        return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${API_URL}/api/products/search?q=${text}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setResults(data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSelectProduct = (prod: any) => {
    setSelectedProduct(prod);
    setQuantity(1); 
    setResults([]); 
    setQuery('');   
    Keyboard.dismiss();
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    
    addItem(selectedProduct, quantity);
    showToast(true, `${quantity}x ${selectedProduct.name} agregado`);
    
    setSelectedProduct(null);
    setQuantity(1);
  };

  return (
    <View style={styles.productSection}>
      <Text style={styles.headerTitle}>2. Agregar Productos</Text>

      <View style={styles.searchBox}>
        <Ionicons name="cube-outline" size={20} color="#666" />
        <TextInput 
          style={styles.searchInput}
          placeholder="Buscar producto (ej. Teclado)..."
          value={query}
          onChangeText={searchProducts}
        />
      </View>

      {results.length > 0 && !selectedProduct && (
        <View style={styles.resultsList}>
            {results.map((item) => (
                <TouchableOpacity key={item.id} style={styles.resultItem} onPress={() => handleSelectProduct(item)}>
                    <Text style={styles.resultText}>{item.name}</Text>
                    <Text style={styles.resultSku}>{item.sku}</Text>
                </TouchableOpacity>
            ))}
        </View>
      )}

      {selectedProduct && (
        <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
                <Text style={styles.detailTitle}>{selectedProduct.name}</Text>
                <TouchableOpacity onPress={() => setSelectedProduct(null)}>
                    <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
            </View>

            <View style={styles.optionsRow}>
                <View style={styles.checkboxContainer}>
                    <Switch value={hidePrice} onValueChange={setHidePrice} trackColor={{false: '#ccc', true: '#81c784'}} thumbColor={hidePrice ? '#2e7d32' : '#f4f3f4'} />
                    <Text style={styles.label}>Ocultar Precio</Text>
                </View>
                
                {!hidePrice && (
                    <Text style={styles.priceTag}>${selectedProduct.price}</Text>
                )}
            </View>

            <View style={styles.counterContainer}>
                <Text style={styles.counterLabel}>Cantidad:</Text>
                <View style={styles.counterWrapper}>
                    <TouchableOpacity 
                        style={styles.counterBtn} 
                        onPress={() => setQuantity(q => Math.max(1, q - 1))}
                    >
                        <Ionicons name="remove" size={24} color="#fff" />
                    </TouchableOpacity>
                    
                    <Text style={styles.counterValue}>{quantity}</Text>
                    
                    <TouchableOpacity 
                        style={styles.counterBtn} 
                        onPress={() => setQuantity(q => q + 1)}
                    >
                        <Ionicons name="add" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            <TouchableOpacity style={styles.addButton} onPress={handleAddToCart}>
                <Text style={styles.addButtonText}>AGREGAR AL PEDIDO</Text>
            </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// --- LISTA DEL CARRITO (RESUMEN) ---
const CartSummary = () => {
    const { items, removeItem, updateQuantity, client, clearCart, total } = useCart();
    const { showToast } = useToast();
    const [sending, setSending] = useState(false);

    const handleFinalize = async () => {
        if (items.length === 0) return;
        setSending(true);

        try {
            const token = await AsyncStorage.getItem('userToken');
            
            const payload = {
                client_id: client.id,
                shipping_address: client.address || "Dirección registrada",
                notes: "Pedido desde App Móvil",
                items: items.map(i => ({
                    product_id: i.id,
                    quantity: i.quantity
                }))
            };

            const res = await fetch(`${API_URL}/api/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (data.success) {
                showToast(true, "Pedido enviado exitosamente 🚀");
                clearCart(); 
                router.back(); // Volver al menú al terminar
            } else {
                showToast(false, data.message || "Error al enviar pedido");
            }

        } catch (error) {
            showToast(false, "Error de conexión");
        } finally {
            setSending(false);
        }
    };

    if (!client) return null; 

    return (
        <View style={styles.cartContainer}>
            <View style={styles.cartHeader}>
                <Text style={styles.cartTitle}>Resumen del Pedido</Text>
                <Text style={styles.cartClient}>Cliente: {client.first_name}</Text>
            </View>

            <ScrollView style={styles.cartList}>
                {items.length === 0 ? (
                    <Text style={styles.emptyCart}>El carrito está vacío</Text>
                ) : (
                    items.map((item) => (
                        <View key={item.id} style={styles.cartItem}>
                            <View style={{flex: 1}}>
                                <Text style={styles.cartItemName}>{item.name}</Text>
                                <Text style={styles.cartItemPrice}>${item.price} c/u</Text>
                            </View>
                            
                            <View style={styles.miniCounter}>
                                <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity - 1)}>
                                    <Ionicons name="remove-circle-outline" size={24} color="#d32f2f" />
                                </TouchableOpacity>
                                <Text style={styles.miniQty}>{item.quantity}</Text>
                                <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity + 1)}>
                                    <Ionicons name="add-circle-outline" size={24} color="#2e7d32" />
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity onPress={() => removeItem(item.id)} style={{marginLeft: 10}}>
                                <Ionicons name="trash-outline" size={20} color="#888" />
                            </TouchableOpacity>
                        </View>
                    ))
                )}
            </ScrollView>

            {items.length > 0 && (
                <View style={styles.footer}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total Estimado:</Text>
                        <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
                    </View>
                    
                    <TouchableOpacity 
                        style={[styles.checkoutButton, sending && {opacity: 0.7}]} 
                        onPress={handleFinalize}
                        disabled={sending}
                    >
                        {sending ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.checkoutText}>LEVANTAR ORDEN</Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

// ==========================================
// 2. COMPONENTE PRINCIPAL (EXPORTADO)
// ==========================================
export default function NuevaOrdenScreen() {
  const { client, setOrderClient } = useCart();

  // Función para manejar el botón de atrás
  const handleBack = () => {
    if (client) {
      setOrderClient(null); // Si hay cliente, regresamos al paso 1
    } else {
      router.replace('/(panel)/vendedor'); // Si no hay cliente, regresamos al menú anterior
    }
  };

  // PASO 1: Si no hay cliente, mostramos el selector
  if (!client) {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerBar}>
                 <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitleSmall}>Nueva Venta</Text>
            </View>
            <ClientSelector onSelect={() => {}} />
        </SafeAreaView>
    );
  }

  // PASO 2: Si hay cliente, mostramos productos y carrito
  return (
    <SafeAreaView style={styles.container}>
        <View style={styles.headerBar}>
            <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitleSmall}>Pedido para: {client.first_name}</Text>
        </View>

        {/* Buscador de Productos */}
        <ProductManager />

        {/* Separador */}
        <View style={{height: 1, backgroundColor: '#ddd', marginVertical: 10}} />

        {/* Lista del Carrito */}
        <CartSummary />
    </SafeAreaView>
  );
}

// ==========================================
// 3. ESTILOS
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  sectionContainer: { flex: 1, padding: 20 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#2e7d32', marginBottom: 15 },
  headerBar: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#fff', elevation: 2 },
  backBtn: { marginRight: 15 },
  headerTitleSmall: { fontSize: 16, fontWeight: 'bold', color: '#333' },

  // Search Styles
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 10, height: 50, elevation: 2, marginBottom: 10 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  emptyText: { textAlign: 'center', marginTop: 20, color: '#888' },

  // Client Item
  clientCard: { backgroundColor: '#fff', padding: 15, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#2e7d32' },
  clientName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  clientSub: { fontSize: 13, color: '#666' },

  // Product Manager
  productSection: { padding: 15 },
  resultsList: { maxHeight: 150, backgroundColor: '#fff', borderRadius: 8, elevation: 4, marginTop: -5, zIndex: 10 },
  resultItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  resultText: { fontSize: 16, color: '#333' },
  resultSku: { fontSize: 12, color: '#888' },

  // Detail Card
  detailCard: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginTop: 10, elevation: 3 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  detailTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', flex: 1 },
  optionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 15 },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center' },
  label: { marginLeft: 5, color: '#555' },
  priceTag: { fontSize: 18, fontWeight: 'bold', color: '#2e7d32' },
  
  // Counter
  counterContainer: { marginBottom: 15 },
  counterLabel: { marginBottom: 5, color: '#666' },
  counterWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f0f0', borderRadius: 8, padding: 5 },
  counterBtn: { backgroundColor: '#2e7d32', width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  counterValue: { fontSize: 20, fontWeight: 'bold', marginHorizontal: 20, minWidth: 30, textAlign: 'center' },
  
  addButton: { backgroundColor: '#1565c0', padding: 15, borderRadius: 8, alignItems: 'center' },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  // Cart Summary
  cartContainer: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, elevation: 10, shadowColor: '#000', shadowOffset: {width:0,height:-2}, shadowOpacity: 0.1 },
  cartHeader: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#fafafa', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  cartTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  cartClient: { fontSize: 12, color: '#666' },
  cartList: { flex: 1, padding: 15 },
  emptyCart: { textAlign: 'center', marginTop: 30, color: '#ccc', fontStyle: 'italic' },
  
  cartItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  cartItemName: { fontSize: 14, fontWeight: '600', color: '#333' },
  cartItemPrice: { fontSize: 12, color: '#2e7d32' },
  miniCounter: { flexDirection: 'row', alignItems: 'center' },
  miniQty: { marginHorizontal: 10, fontSize: 14, fontWeight: 'bold' },

  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#eee', backgroundColor: '#fff' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  totalLabel: { fontSize: 18, fontWeight: 'bold' },
  totalValue: { fontSize: 20, fontWeight: 'bold', color: '#2e7d32' },
  checkoutButton: { backgroundColor: '#2e7d32', padding: 15, borderRadius: 10, alignItems: 'center' },
  checkoutText: { color: '#fff', fontWeight: 'bold', fontSize: 18, letterSpacing: 1 },
});