import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/constants';
import { useCartStore } from '@/store/useCartStore';

function BadgeCarrito() {
  const total = useCartStore(s => s.totalItems());
  if (total === 0) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeTxt}>{total > 9 ? '9+' : total}</Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: COLORS.negroHeader,
          borderTopColor: 'rgba(197,164,126,0.2)',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarActiveTintColor: COLORS.dorado,
        tabBarInactiveTintColor: '#6b7280',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        headerStyle: { backgroundColor: COLORS.negroHeader },
        headerTintColor: COLORS.dorado,
        headerTitleStyle: { color: COLORS.dorado, fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          headerShown: false,
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="catalogo"
        options={{
          title: 'Catálogo',
          headerTitle: 'Catálogo',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>👗</Text>,
        }}
      />
      <Tabs.Screen
        name="carrito"
        options={{
          title: 'Carrito',
          headerTitle: 'Mi Carrito',
          tabBarIcon: ({ color }) => (
            <View>
              <Text style={{ fontSize: 18, color }}>🛒</Text>
              <BadgeCarrito />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="pedidos"
        options={{
          title: 'Pedidos',
          headerTitle: 'Mis Pedidos',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>📦</Text>,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          headerTitle: 'Mi Perfil',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>👤</Text>,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: COLORS.dorado,
    borderRadius: 999,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeTxt: {
    color: COLORS.negro,
    fontSize: 9,
    fontWeight: '700',
  },
});
