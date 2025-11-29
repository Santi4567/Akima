import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';

export default function PanelLayout() {
  return (
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
      {/* 4 PAGOS */}
      <Tabs.Screen
        name="pagos"
        options={{
          title: 'Cobrar',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome name="money" size={24} color={color} />
          ),
        }}
      />

      {/* 4. AJUSTES */}
      <Tabs.Screen
        name="configuracion"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "settings" : "settings-outline"} size={24} color={color} />
          ),
        }}
      />


      {/* Registramos la nueva pantalla pero la ocultamos del menú */}
      <Tabs.Screen
        name="nueva-orden"
        options={{
          href: null, // No sale botón en el menú
          tabBarStyle: { display: 'none' }, // Oculta la barra al entrar aquí (más espacio para teclado)
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

    </Tabs>
    
  );
}