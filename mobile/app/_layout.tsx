import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" backgroundColor="#111827" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#111827' },
          headerTintColor: '#c5a47e',
          headerTitleStyle: { fontWeight: 'bold', color: '#c5a47e' },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="registro" options={{ title: 'Crear cuenta' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="producto/[id]" options={{ title: 'Producto' }} />
        <Stack.Screen name="checkout" options={{ title: 'Checkout' }} />
      </Stack>
    </>
  );
}
