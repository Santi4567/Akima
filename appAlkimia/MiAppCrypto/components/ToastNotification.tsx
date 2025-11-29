import React, { useEffect, useState, createContext, useContext } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Definimos el contexto para poder llamarlo desde cualquier lado
const ToastContext = createContext({
  showToast: (success: boolean, message: string) => {},
});

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [visible, setVisible] = useState(false);
  const [success, setSuccess] = useState(true);
  const [message, setMessage] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));

  const showToast = (isSuccess: boolean, msg: string) => {
    setSuccess(isSuccess);
    setMessage(msg);
    setVisible(true);

    // Animación de entrada
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Desaparecer en 5 segundos
    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setVisible(false));
    }, 5000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {visible && (
        <Animated.View style={[
          styles.toastContainer, 
          { opacity: fadeAnim, backgroundColor: success ? '#2e7d32' : '#c62828' }
        ]}>
          <Ionicons name={success ? "checkmark-circle" : "alert-circle"} size={24} color="#fff" />
          <Text style={styles.message}>{message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    left: 20,
    right: 20,
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 9999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  message: {
    color: '#fff',
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '600',
    flex: 1, // Para que el texto se ajuste si es largo
  }
});