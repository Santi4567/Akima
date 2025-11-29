import React, { createContext, useState, useContext } from 'react';

// Tipos basados en tu API de productos
interface Product {
  id: number;
  name: string;
  price: string;
  sku: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  client: any | null; // Cliente seleccionado para el pedido
  setOrderClient: (client: any) => void;
  addItem: (product: Product, quantity: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextType>({} as CartContextType);

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [client, setClient] = useState<any | null>(null);

  const addItem = (product: Product, quantity: number) => {
    setItems(currentItems => {
      const existingItem = currentItems.find(item => item.id === product.id);
      if (existingItem) {
        // Si ya existe, sumamos la cantidad
        return currentItems.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      // Si no existe, lo agregamos
      return [...currentItems, { ...product, quantity }];
    });
  };

  const removeItem = (productId: number) => {
    setItems(current => current.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems(current => current.map(item => 
      item.id === productId ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => {
    setItems([]);
    setClient(null);
  };

  // Calcular total automáticamente
  const total = items.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

  return (
    <CartContext.Provider value={{ 
      items, client, setOrderClient: setClient, 
      addItem, removeItem, updateQuantity, clearCart, total 
    }}>
      {children}
    </CartContext.Provider>
  );
};