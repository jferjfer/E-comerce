import { Tabs, router } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import { useCartStore } from '@/store/useCartStore';

const { width, height } = Dimensions.get('window');

const ICON_SIZE = width < 360 ? 20 : 22;
const LABEL_SIZE = width < 360 ? 9 : 10;
// Altura fija que garantiza icono + label visibles en todos los dispositivos
const TAB_HEIGHT = Platform.OS === 'ios' ? (height > 800 ? 80 : 65) : 62;
const TAB_PB = Platform.OS === 'ios' ? (height > 800 ? 24 : 8) : 8;

function TabIcon({ name, color, focused, badge }: {
  name: string; color: string; focused: boolean; badge?: number
}) {
  return (
    <View style={tabStyles.wrap}>
      <Ionicons name={name as any} size={ICON_SIZE} color={color} />
      {badge && badge > 0 ? (
        <View style={tabStyles.badge}>
          <Text style={tabStyles.badgeTxt}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      ) : null}
    </View>
  );
}

function CarritoIcon({ color, focused }: { color: string; focused: boolean }) {
  const total = useCartStore(s => s.totalItems());
  return (
    <TabIcon
      name={focused ? 'cart' : 'cart-outline'}
      color={color}
      focused={focused}
      badge={total}
    />
  );
}

const tabStyles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute', top: -3, right: -8,
    backgroundColor: COLORS.dorado,
    borderRadius: 999, minWidth: 15, height: 15,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5, borderColor: COLORS.negroHeader,
  },
  badgeTxt: { color: COLORS.negro, fontSize: 8, fontWeight: '800' },
});

const TABS = [
  { name: 'index',    title: 'Inicio',    icon: 'home',          iconO: 'home-outline',          header: false },
  { name: 'catalogo', title: 'Catálogo',  icon: 'shirt',         iconO: 'shirt-outline',         header: true, headerTitle: 'CATÁLOGO' },
  { name: 'carrito',  title: 'Carrito',   icon: 'cart',          iconO: 'cart-outline',          header: true, headerTitle: 'MI CARRITO', carrito: true },
  { name: 'pedidos',  title: 'Pedidos',   icon: 'archive',       iconO: 'archive-outline',       header: true, headerTitle: 'MIS PEDIDOS' },
  { name: 'perfil',   title: 'Perfil',    icon: 'person-circle', iconO: 'person-circle-outline', header: true, headerTitle: 'MI PERFIL' },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: COLORS.negroHeader,
          borderTopColor: 'rgba(197,164,126,0.15)',
          borderTopWidth: 1,
          height: TAB_HEIGHT,
          paddingBottom: TAB_PB,
          paddingTop: 6,
        },
        tabBarActiveTintColor: COLORS.dorado,
        tabBarInactiveTintColor: '#6b7280',
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: LABEL_SIZE,
          fontWeight: '600',
          letterSpacing: 0.2,
          includeFontPadding: false,
          marginTop: -2,
        },
        headerStyle: { backgroundColor: COLORS.negroHeader },
        headerTintColor: COLORS.dorado,
        headerTitleStyle: {
          color: COLORS.dorado,
          fontWeight: '700',
          fontSize: 14,
          letterSpacing: 2,
          fontFamily: 'Prata-Regular',
        },
        headerShadowVisible: false,
        headerTitleAlign: 'center',
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ paddingHorizontal: 16, paddingVertical: 8 }}
          >
            <Text style={{ color: COLORS.dorado, fontSize: 22, fontWeight: '300' }}>‹</Text>
          </TouchableOpacity>
        ),
      }}
    >
      {TABS.map(tab => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            headerShown: tab.header,
            headerTitle: tab.headerTitle,
            tabBarIcon: ({ color, focused }) =>
              tab.carrito
                ? <CarritoIcon color={color} focused={focused} />
                : <TabIcon name={focused ? tab.icon : tab.iconO} color={color} focused={focused} />,
          }}
        />
      ))}
    </Tabs>
  );
}
