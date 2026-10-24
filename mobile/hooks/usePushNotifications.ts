import { useEffect, useRef } from 'react';
import { InteractionManager } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useAuthStore } from '@/store/useAuthStore';
import { API_URL } from '@/constants';

const isExpoGo = Constants.appOwnership === 'expo';

async function registrarToken(fcmToken: string, authToken: string) {
  try {
    await fetch(`${API_URL}/api/usuarios/push-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ push_token: fcmToken }),
    });
  } catch {}
}

export function usePushNotifications() {
  const { token, usuario } = useAuthStore();
  const registradoRef = useRef(false);

  useEffect(() => {
    if (isExpoGo || !token || !usuario) return;
    if (registradoRef.current) return;
    if (!Device.isDevice) return;

    const task = InteractionManager.runAfterInteractions(() => {
      registradoRef.current = true;

      const registrar = async () => {
        try {
          const messagingModule = await import('@react-native-firebase/messaging');
          const messaging = messagingModule.default;
          const authStatus = await messaging().requestPermission();
          const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;
          if (!enabled) return;
          const fcmToken = await messaging().getToken();
          if (fcmToken) await registrarToken(fcmToken, token);
          messaging().onTokenRefresh(async (newToken: string) => {
            await registrarToken(newToken, token);
          });
        } catch {
          // Silenciar — no crashear por notificaciones
        }
      };

      registrar();
    });

    return () => task.cancel();
  }, [token, usuario]);
}
