import { Tabs } from 'expo-router';
import { COLORS } from '@/constants';
import { useCartStore } from '@/store/useCartStore';
import { Text, View } from 'react-native';

function BadgeCarrito() {
  const total = useCartStore((s) => s.totalItems());
  if (total === 0) return null;
  return (
    <View style={{
      position: 'absolute', top: -4, right: -8,
      backgroundColor: COLORS.dorado, borderRadius: 10,
      minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center'
    }}>
      <Text style={{ color: COLORS.negro, fontSize: 10, fontWeight: 'bold' }}>
        {total}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: COLORS.negro, borderTopColor: '#1f2937' },
        tabBarActiveTintColor: COLORS.dorado,
        tabBarInactiveTintColor: '#6b7280',
        headerStyle: { backgroundColor: COLORS.negro },
        headerTintColor: COLORS.dorado,
        headerTitleStyle: { color: COLORS.dorado, fontWeight: 'bold' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="catalogo"
        options={{
          title: 'Catálogo',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👗</Text>,
        }}
      />
      <Tabs.Screen
        name="carrito"
        options={{
          title: 'Carrito',
          tabBarIcon: ({ color, focused }) => (
            <View>
              <Text style={{ fontSize: 20, color }}>🛒</Text>
              <BadgeCarrito />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="pedidos"
        options={{
          title: 'Pedidos',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📦</Text>,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👤</Text>,
        }}
      />
    </Tabs>
  );
}
