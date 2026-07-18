import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { useAuthStore } from '@/store/useAuthStore';
import { API_URL } from '@/constants';

// Configurar cómo se muestran las notificaciones cuando la app está abierta
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function registrarToken(token: string, authToken: string) {
  try {
    await fetch(`${API_URL}/api/usuarios/push-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ push_token: token }),
    });
  } catch {}
}

export function usePushNotifications() {
  const { token, usuario } = useAuthStore();
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    if (!token || !usuario) return;

    const registrar = async () => {
      if (!Device.isDevice) return; // No funciona en emulador

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') return;

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
    };

    registrar();

    // Listener cuando llega notificación con app abierta
    notificationListener.current = Notifications.addNotificationReceivedListener(() => {});

    // Listener cuando el usuario toca la notificación
    responseListener.current = Notifications.addNotificationResponseReceivedListener(() => {});

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [token, usuario]);
}
