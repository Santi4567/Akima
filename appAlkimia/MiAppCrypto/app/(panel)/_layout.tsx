import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

export default function PanelLayout() {
  return (
    <>
    <StatusBar style="dark" backgroundColor="#f8f9fa" />
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2e7d32',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: Platform.select({
          ios: { position: 'absolute' },
          default: { height: 60, paddingBottom: 10, paddingTop: 5 },
        }),
      }}>

      {/* 1. INICIO */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
          ),
        }}
      />

      {/* 2. VENTAS */}
      <Tabs.Screen
        name="vendedor"
        options={{
          title: 'Ventas',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "briefcase" : "briefcase-outline"} size={24} color={color} />
          ),
        }}
      />

      {/* 3. ALMACÉN */}
      <Tabs.Screen
        name="almacen"
        options={{
          title: 'Almacén',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "cube" : "cube-outline"} size={24} color={color} />
          ),
        }}
      />
      
      {/* 4. PAGOS (Cobrar) */}
      <Tabs.Screen
        name="pagos"
        options={{
          title: 'Cobrar',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome name="money" size={24} color={color} />
          ),
        }}
      />

      {/* 5. AJUSTES */}
      <Tabs.Screen
        name="configuracion"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "settings" : "settings-outline"} size={24} color={color} />
          ),
        }}
      />


      {/* --- PANTALLAS OCULTAS (HREF: NULL) --- */}
      
      <Tabs.Screen
        name="nueva-orden"
        options={{
          href: null, 
          tabBarStyle: { display: 'none' }, 
        }}
      />

      <Tabs.Screen 
        name="ruta" 
        options={{ 
          href: null, 
          tabBarStyle: { display: 'none' } 
        }} 
      />
      
      <Tabs.Screen 
        name="clientes" 
        options={{ 
          href: null, 
          tabBarStyle: { display: 'none' } 
        }} 
      />

      <Tabs.Screen 
        name="historial-ordenes" 
        options={{ href: null, tabBarStyle: { display: 'none' } }} 
      />
      
      <Tabs.Screen 
         name="generar-pago" 
         options={{ href: null, tabBarStyle: { display: 'none' } }} 
       />
       
       <Tabs.Screen 
        name="inventario" 
        options={{ href: null, tabBarStyle: { display: 'none' } }} 
      />
      
      {/* AQUÍ ESTABA EL ERROR: Solo declaramos despacho una vez */}
      <Tabs.Screen 
        name="despacho" 
        options={{ href: null, tabBarStyle: { display: 'none' } }} 
      />
      
      <Tabs.Screen 
        name="productos" 
        options={{ 
          href: null, 
          tabBarStyle: { display: 'none' } 
        }} 
      />
      
      <Tabs.Screen 
        name="surtido" 
        options={{ href: null, tabBarStyle: { display: 'none' } }} 
      />

    </Tabs>
    </>
  );
}