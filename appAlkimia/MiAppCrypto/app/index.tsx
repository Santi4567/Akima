import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ImageBackground, KeyboardAvoidingView, 
  Platform, LayoutAnimation, ActivityIndicator 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons'; 
import { Stack, router } from 'expo-router'; 
import AsyncStorage from '@react-native-async-storage/async-storage'; 

export default function LoginScreen() {
  const [viewMode, setViewMode] = useState<'welcome' | 'login'>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Estado para manejar errores
  const [errorData, setErrorData] = useState<{visible: boolean, title: string, message: string}>({
    visible: false, title: '', message: ''
  });

  // Fecha actual
  const today = new Date().toLocaleDateString('es-ES', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });
  const formattedDate = today.charAt(0).toUpperCase() + today.slice(1);

  // --- VARIABLES DE ENTORNO ---
  const API_URL = process.env.EXPO_PUBLIC_API_URL; 
  // Nota: Si API_URL viene sin barra al final, la agregamos en el fetch

  // --- VALIDACIÓN DE EMAIL ---
  const isValidEmail = (email: string) => {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
  };

  // --- FUNCIÓN DE PING (Health Check) ---
  const checkHealth = async () => {
    setErrorData({ visible: false, title: '', message: '' });
    setIsLoading(true);

    try {
      // USAMOS LA VARIABLE DE ENTORNO AQUÍ
      const response = await fetch(`${API_URL}/api/health`);
      const data = await response.json();
      setIsLoading(false);

      if (data.success) return true;
      else {
        setErrorData({ visible: true, title: 'Servidor no disponible', message: 'El servidor respondió con un error.' });
        return false;
      }
    } catch (error) {
      setIsLoading(false);
      setErrorData({ visible: true, title: 'Sin conexión', message: 'No pudimos contactar con el servidor. Revisa tu internet.' });
      return false;
    }
  };

  // --- FUNCIÓN DE LOGIN ---
  const performLogin = async () => {
    setErrorData({ visible: false, title: '', message: '' });

    if (!email || !password) {
      setErrorData({ visible: true, title: 'Datos incompletos', message: 'Por favor ingresa tu correo y contraseña.' });
      return;
    }

    if (!isValidEmail(email)) {
      setErrorData({ visible: true, title: 'Correo inválido', message: 'El formato del correo no es correcto.' });
      return;
    }

    setIsLoading(true);
    try {
      // USAMOS LA VARIABLE DE ENTORNO AQUÍ TAMBIÉN
      const response = await fetch(`${API_URL}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          Correo: email, 
          Passwd: password 
        }),
      });

      const data = await response.json();
      setIsLoading(false);

      if (data.success) {
        await AsyncStorage.setItem('userToken', data.data.token);
        await AsyncStorage.setItem('userInfo', JSON.stringify(data.data.user));

        // Redirigir al panel protegido
        router.replace('/(panel)/home'); 

      } else {
        setErrorData({ 
          visible: true, 
          title: 'Error de acceso', 
          message: data.message || 'Usuario o contraseña incorrectos.' 
        });
      }

    } catch (error) {
      console.log(error);
      setIsLoading(false);
      setErrorData({ visible: true, title: 'Error de red', message: 'Ocurrió un problema al intentar conectar.' });
    }
  };

  const handleMainButton = async () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    if (viewMode === 'welcome') {
      const isConnected = await checkHealth();
      if (isConnected) setViewMode('login');
    } else {
      await performLogin();
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Usamos expo-status-bar (importante para que se vea bien en Android/iOS) */}
      <StatusBar style="light" /> 

      <ImageBackground 
        source={{ uri: 'https://images.unsplash.com/photo-1625246333195-58197bd47d72?q=80&w=2070&auto=format&fit=crop' }} 
        style={styles.backgroundImage}
      >
        <View style={styles.overlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.contentContainer}
          >
            
            <View style={styles.headerContainer}>
              <Ionicons name="leaf" size={60} color="#4ade80" />
              {/* Aquí también podrías usar la variable APP_NAME si quisieras */}
              <Text style={styles.appName}>ALKIMIA</Text>
              <Text style={styles.tagline}>Soluciones Agrícolas</Text>
            </View>

            {/* CAJA DE ERROR */}
            {errorData.visible && (
              <View style={styles.errorCard}>
                <Ionicons name="alert-circle-outline" size={32} color="#ffcdd2" />
                <View style={styles.errorContent}>
                  <Text style={styles.errorTitle}>{errorData.title}</Text>
                  <Text style={styles.errorBody}>{errorData.message}</Text>
                </View>
              </View>
            )}

            {/* VISTA WELCOME */}
            {viewMode === 'welcome' && !errorData.visible && (
               <View style={styles.welcomeContainer}>
                  <Text style={styles.welcomeText}>Bienvenido al sistema de gestión.</Text>
                  
               </View>
            )}

            {/* VISTA LOGIN */}
            {viewMode === 'login' && (
              <View style={styles.formContainer}>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color="#aaa" style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input}
                    placeholder="Correo Electrónico"
                    placeholderTextColor="#888"
                    value={email}
                    onChangeText={(text) => { setEmail(text); setErrorData({ ...errorData, visible: false }); }}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color="#aaa" style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input}
                    placeholder="Contraseña"
                    placeholderTextColor="#888"
                    secureTextEntry={!showPassword} 
                    value={password}
                    onChangeText={(text) => { setPassword(text); setErrorData({ ...errorData, visible: false }); }}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{padding: 5}}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#aaa" />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* BOTÓN PRINCIPAL */}
            <TouchableOpacity 
              style={[
                styles.loginButton, 
                isLoading && { backgroundColor: '#1b5e20' },
                errorData.visible && { backgroundColor: '#d32f2f', shadowColor: '#ef5350' }
              ]} 
              onPress={handleMainButton}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>
                  {errorData.visible 
                    ? "REINTENTAR" 
                    : (viewMode === 'welcome' ? "COMENZAR" : "INICIAR SESIÓN")}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Versión Interna v1.0.0</Text>
            </View>

          </KeyboardAvoidingView>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  backgroundImage: { flex: 1, justifyContent: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 20 },
  contentContainer: { flex: 1, justifyContent: 'center' },
  headerContainer: { alignItems: 'center', marginBottom: 30 },
  appName: { fontSize: 42, fontWeight: 'bold', color: '#fff', letterSpacing: 2, marginTop: 10 },
  tagline: { fontSize: 16, color: '#4ade80', marginTop: 5, letterSpacing: 1, textTransform: 'uppercase' },
  welcomeContainer: { marginBottom: 30, alignItems: 'center', width: '100%' },
  welcomeText: { color: '#fff', fontSize: 18, textAlign: 'center' },
  dateText: { color: '#ddd', fontSize: 18, fontStyle: 'italic', borderTopWidth: 1, borderTopColor: '#444', paddingTop: 15, width: '80%', textAlign: 'center', marginTop: 15 },
  errorCard: {
    backgroundColor: 'rgba(183, 28, 28, 0.4)', 
    borderWidth: 1, borderColor: '#ef5350', borderRadius: 12, padding: 15, marginBottom: 20, 
    flexDirection: 'row', alignItems: 'center', width: '100%',
  },
  errorContent: { marginLeft: 15, flex: 1 },
  errorTitle: { color: '#ef5350', fontWeight: 'bold', fontSize: 16, marginBottom: 2 },
  errorBody: { color: '#ffcdd2', fontSize: 13 },
  formContainer: { width: '100%', marginBottom: 10 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, marginBottom: 16, paddingHorizontal: 15, height: 55, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: '#fff', fontSize: 16 },
  loginButton: { backgroundColor: '#2e7d32', borderRadius: 12, height: 55, justifyContent: 'center', alignItems: 'center', marginTop: 10, shadowColor: '#4ade80', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4.65, elevation: 8 },
  loginButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  footer: { position: 'absolute', bottom: 30, width: '100%', alignItems: 'center' },
  footerText: { color: '#555', fontSize: 12 },
});