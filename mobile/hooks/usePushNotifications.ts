import { useEffect } from 'react';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useAuthStore } from '@/store/useAuthStore';
import { API_URL } from '@/constants';

const isExpoGo = Constants.appOwnership === 'expo';

async function registrarToken(fcmToken: string, authToken: string) {
  try {
    const res = await fetch(`${API_URL}/api/usuarios/push-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ push_token: fcmToken }),
    });
    console.log('[Push] Token registrado en backend:', res.status);
  } catch (e: any) {
    console.error('[Push] Error registrando token:', e?.message);
  }
}

export function usePushNotifications() {
  const { token, usuario } = useAuthStore();

  useEffect(() => {
    if (isExpoGo || !token || !usuario) return;
    if (!Device.isDevice) return;

    const timer = setTimeout(async () => {
      try {
        console.log('[Push] Iniciando registro FCM...');
        const {
          getMessaging,
          getToken,
          requestPermission,
          AuthorizationStatus,
          onTokenRefresh,
          registerDeviceForRemoteMessages,
          getAPNSToken,
        } = await import('@react-native-firebase/messaging');

        const m = getMessaging();

        // Paso 1: pedir permisos
        const status = await requestPermission(m);
        console.log('[Push] Permisos:', status);

        if (
          status !== AuthorizationStatus.AUTHORIZED &&
          status !== AuthorizationStatus.PROVISIONAL
        ) {
          console.log('[Push] Permisos no concedidos');
          return;
        }

        // Paso 2: registrar para remote messages (genera el token APNs en iOS)
        await registerDeviceForRemoteMessages(m);
        console.log('[Push] Dispositivo registrado para remote messages');

        // Paso 3: esperar token APNs antes de pedir FCM token (fix iOS 26 issue #8711)
        let apnsToken: string | null = null;
        for (let i = 0; i < 5; i++) {
          apnsToken = await getAPNSToken(m);
          if (apnsToken) break;
          console.log(`[Push] Esperando token APNs... intento ${i + 1}`);
          await new Promise(r => setTimeout(r, 1000));
        }

        if (!apnsToken) {
          console.error('[Push] No se obtuvo token APNs — aps-environment o perfil incorrecto');
          return;
        }
        console.log('[Push] Token APNs obtenido ✅');

        // Paso 4: obtener token FCM
        const fcmToken = await getToken(m);
        console.log('[Push] FCM Token:', fcmToken ? fcmToken.slice(0, 20) + '...' : 'null');

        if (fcmToken) {
          await registrarToken(fcmToken, token);
        }

        onTokenRefresh(m, async (newToken: string) => {
          await registrarToken(newToken, token);
        });
      } catch (e: any) {
        console.error('[Push] Error:', e?.message || String(e));
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [token]);
}
