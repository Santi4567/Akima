import { Stack } from 'expo-router';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { ToastProvider } from '@/components/ToastNotification';
import { CartProvider } from '@/context/CartContext';

export default function RootLayout() {
  return (
    <>
    <ToastProvider>{/* Notificaciones */}
      <CartProvider>{/* Carrito/pedido */}
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          {/* Pantalla de Login (index) */}
          <Stack.Screen name="index" />
          
          {/* Grupo del Panel (Todo lo que está en la carpeta (panel)) */}
          <Stack.Screen name="(panel)" />
        </Stack>
      </CartProvider>
      </ToastProvider>
      
    </>
  );
}