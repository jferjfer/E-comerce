import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Image, StyleSheet, ActivityIndicator, RefreshControl
} from 'react-native';
import { router } from 'expo-router';
import { COLORS } from '@/constants';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/useAuthStore';
import { Producto } from '@/types';

export default function HomeScreen() {
  const { usuario, estaAutenticado } = useAuthStore();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cargarProductos = async () => {
    try {
      const data = await api.getProductos({ limite: 10 });
      setProductos(data.productos || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { cargarProductos(); }, []);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); cargarProductos(); }} tintColor={COLORS.dorado} />}
    >
      {/* Header EGOS */}
      <View style={styles.header}>
        <Text style={styles.logoE}>E</Text>
        <Text style={styles.logoEGOS}>EGOS</Text>
        <Text style={styles.logoSlogan}>WEAR YOUR TRUTH</Text>
      </View>

      {/* Saludo */}
      {estaAutenticado && (
        <View style={styles.saludo}>
          <Text style={styles.saludoTexto}>
            Hola, <Text style={styles.saludoNombre}>{usuario?.nombre}</Text> 👋
          </Text>
        </View>
      )}

      {/* Banner */}
      <TouchableOpacity style={styles.banner} onPress={() => router.push('/(tabs)/catalogo')}>
        <Text style={styles.bannerTitulo}>Nueva Colección</Text>
        <Text style={styles.bannerSub}>Descubre las últimas tendencias</Text>
        <View style={styles.bannerBtn}>
          <Text style={styles.bannerBtnTxt}>Ver catálogo →</Text>
        </View>
      </TouchableOpacity>

      {/* Productos destacados */}
      <Text style={styles.seccionTitulo}>Productos Destacados</Text>

      {loading ? (
        <ActivityIndicator color={COLORS.dorado} size="large" style={{ margin: 20 }} />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productosH}>
          {productos.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={styles.productoCard}
              onPress={() => router.push(`/producto/${p.id}`)}
            >
              <Image
                source={{ uri: p.imagen }}
                style={styles.productoImg}
                resizeMode="cover"
              />
              <Text style={styles.productoNombre} numberOfLines={2}>{p.nombre}</Text>
              <Text style={styles.productoPrecio}>
                ${p.precio.toLocaleString('es-CO')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Acceso rápido */}
      <Text style={styles.seccionTitulo}>Acceso Rápido</Text>
      <View style={styles.accesoGrid}>
        {[
          { icon: '👗', label: 'Catálogo', ruta: '/(tabs)/catalogo' },
          { icon: '🛒', label: 'Carrito', ruta: '/(tabs)/carrito' },
          { icon: '📦', label: 'Pedidos', ruta: '/(tabs)/pedidos' },
          { icon: '🤖', label: 'Asistente IA', ruta: '/chat' },
        ].map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.accesoBtn}
            onPress={() => router.push(item.ruta as any)}
          >
            <Text style={styles.accesoIcon}>{item.icon}</Text>
            <Text style={styles.accesoLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { backgroundColor: COLORS.negro, alignItems: 'center', paddingVertical: 24 },
  logoE: { fontSize: 40, fontWeight: '900', color: COLORS.dorado },
  logoEGOS: { fontSize: 22, fontWeight: '700', color: COLORS.blanco, letterSpacing: 10 },
  logoSlogan: { fontSize: 10, color: COLORS.dorado, letterSpacing: 4, marginTop: 2 },
  saludo: { backgroundColor: COLORS.blanco, padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  saludoTexto: { fontSize: 15, color: COLORS.grisTexto },
  saludoNombre: { fontWeight: 'bold', color: COLORS.negro },
  banner: {
    margin: 16, backgroundColor: COLORS.negro, borderRadius: 12,
    padding: 24, alignItems: 'center'
  },
  bannerTitulo: { fontSize: 22, fontWeight: '900', color: COLORS.dorado, marginBottom: 4 },
  bannerSub: { fontSize: 13, color: '#9ca3af', marginBottom: 16 },
  bannerBtn: { backgroundColor: COLORS.dorado, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  bannerBtnTxt: { color: COLORS.negro, fontWeight: '700' },
  seccionTitulo: { fontSize: 16, fontWeight: '700', color: COLORS.negro, marginHorizontal: 16, marginTop: 16, marginBottom: 8 },
  productosH: { paddingLeft: 16 },
  productoCard: {
    width: 150, marginRight: 12, backgroundColor: COLORS.blanco,
    borderRadius: 10, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2
  },
  productoImg: { width: 150, height: 180 },
  productoNombre: { fontSize: 12, color: COLORS.grisTexto, padding: 8, paddingBottom: 4 },
  productoPrecio: { fontSize: 13, fontWeight: '700', color: COLORS.negro, paddingHorizontal: 8, paddingBottom: 8 },
  accesoGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 12 },
  accesoBtn: {
    width: '45%', margin: '2.5%', backgroundColor: COLORS.blanco,
    borderRadius: 10, padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2
  },
  accesoIcon: { fontSize: 28, marginBottom: 6 },
  accesoLabel: { fontSize: 13, fontWeight: '600', color: COLORS.grisTexto },
});
