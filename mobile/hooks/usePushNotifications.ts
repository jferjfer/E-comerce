import { useEffect } from 'react';
import Constants from 'expo-constants';
import { useAuthStore } from '@/store/useAuthStore';
import { API_URL } from '@/constants';

// Detectar si estamos en Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

async function registrarToken(pushToken: string, authToken: string) {
  try {
    await fetch(`${API_URL}/api/usuarios/push-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ push_token: pushToken }),
    });
  } catch {}
}

export function usePushNotifications() {
  const { token, usuario } = useAuthStore();

  useEffect(() => {
    // No hacer nada en Expo Go — push notifications no están soportadas
    if (isExpoGo || !token || !usuario) return;

    const registrar = async () => {
      try {
        const { Platform } = await import('react-native');
        const Notifications = await import('expo-notifications');

        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') return;

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('pedidos', {
            name: 'Estado de pedidos',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            sound: 'default',
          });
        }

        const pushToken = await Notifications.getExpoPushTokenAsync({
          projectId: '16f267b9-bcd5-4485-b21e-a1dc7adbf953',
        });
        await registrarToken(pushToken.data, token);
      } catch {
        // Silenciar cualquier error
      }
    };

    registrar();
  }, [token, usuario]);
}
