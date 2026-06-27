import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { View } from 'react-native';
import * as Font from 'expo-font';
import { COLORS } from '@/constants';
import Notifications from '@/components/Notifications';
import ChatIA from '@/components/ChatIA';
import OfflineBanner from '@/components/OfflineBanner';
import CookieBanner from '@/components/CookieBanner';
import SplashScreen from '@/components/SplashScreen';
import WelcomeOverlay from '@/components/WelcomeOverlay';
import { useSocketNotificaciones } from '@/hooks/useSocket';
import { useAuthStore } from '@/store/useAuthStore';

type Fase = 'splash' | 'welcome' | 'app';

function AppWrapper() {
  useSocketNotificaciones();
  return null;
}

export default function RootLayout() {
  const [fase, setFase] = useState<Fase>('splash');
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const cargarTokenSeguro = useAuthStore(s => s.cargarTokenSeguro);

  // Recuperar token cifrado de SecureStore al arrancar la app
  useEffect(() => {
    cargarTokenSeguro();
  }, []);
  useEffect(() => {
    const originalHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      if (__DEV__) {
        console.error(`🔴 ${isFatal ? 'FATAL' : 'ERROR'}:`, error?.message || error);
        console.error('Stack:', error?.stack?.slice(0, 300));
      }
      originalHandler(error, isFatal);
    });
    return () => ErrorUtils.setGlobalHandler(originalHandler);
  }, []);

  useEffect(() => {
    Font.loadAsync({
      'BodoniModa-Regular': require('../assets/fonts/BodoniModa-Regular.ttf'),
      'BodoniModa-Italic':  require('../assets/fonts/BodoniModa-Italic.ttf'),
      'Prata-Regular':      require('../assets/fonts/Prata-Regular.ttf'),
    }).then(() => setFontsLoaded(true)).catch(e => {
      console.warn('⚠️ Fuentes no cargadas:', e.message);
      setFontsLoaded(true);
    });
  }, []);

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: '#000' }} />;

  return (
    <>
      <StatusBar style="light" backgroundColor={COLORS.negroHeader} />

      {/* Stack — siempre montado para que cargue en segundo plano */}
      <View style={{ flex: 1 }}>
        <AppWrapper />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: COLORS.negroHeader },
            headerTintColor: COLORS.dorado,
            headerTitleStyle: { fontWeight: 'bold', color: COLORS.dorado, fontFamily: 'Prata-Regular' },
            headerTitleAlign: 'center',
            animation: 'fade_from_bottom',
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="registro" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="producto/[id]" options={{ title: 'Producto', headerBackTitle: '', animation: 'slide_from_right' }} />
          <Stack.Screen name="checkout" options={{ title: 'Finalizar compra', headerBackTitle: '', animation: 'slide_from_right' }} />
          <Stack.Screen name="favoritos" options={{ title: 'Mis Favoritos', headerBackTitle: '', animation: 'slide_from_right' }} />
          <Stack.Screen name="credito" options={{ title: 'Crédito EGOS', headerBackTitle: '', animation: 'slide_from_right' }} />
          <Stack.Screen name="recuperar-contrasena" options={{ headerShown: false }} />
          <Stack.Screen name="pagos" options={{ title: 'Métodos de Pago', headerBackTitle: '', animation: 'slide_from_right' }} />
          <Stack.Screen name="estilo" options={{ title: 'Descubre Tu Estilo', headerBackTitle: '', animation: 'slide_from_right' }} />
          <Stack.Screen name="webview" options={{ title: '', headerBackTitle: '', animation: 'slide_from_right' }} />
        </Stack>
      </View>

      <Notifications />
      <OfflineBanner />
      <ChatIA />
      <CookieBanner />

      {/* Capa negra que tapa el Home durante splash y welcome */}
      {fase !== 'app' && (
        <View style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: '#000000',
          zIndex: 9990,
        }} />
      )}

      {/* FASE 1: Splash — encima de la capa negra */}
      {fase === 'splash' && (
        <SplashScreen onFinish={() => setFase('welcome')} />
      )}

      {/* FASE 2: Bienvenida — encima de la capa negra */}
      {fase === 'welcome' && (
        <WelcomeOverlay onFinish={() => setFase('app')} />
      )}
    </>
  );
}
