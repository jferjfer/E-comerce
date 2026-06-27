import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity,
  StyleSheet, ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { COLORS, SPACING, RADIUS, SHADOW } from '@/constants';
import { useUserStore } from '@/store/useUserStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { api } from '@/services/api';
import { Producto } from '@/types';

const fmt = (n: number) => '$' + n.toLocaleString('es-CO');

export default function FavoritosScreen() {
  const { favorites, removeFromFavorites } = useUserStore();
  const { token } = useAuthStore();
  const agregarItem = useCartStore(s => s.agregarItem);
  const addNotification = useNotificationStore(s => s.addNotification);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      try {
        const { productos: todos } = await api.getProductos({ limite: 200 });
        setProductos((todos || []).filter((p: Producto) => favorites.includes(p.id)));
      } catch {}
      finally { setCargando(false); }
    };
    cargar();
  }, [favorites]);

  const eliminar = async (id: string) => {
    removeFromFavorites(id);
    addNotification('Eliminado de favoritos', 'info');
    if (token) { try { await api.removeFavorito(token, id); } catch {} }
  };

  if (cargando) return <ActivityIndicator color={COLORS.dorado} size="large" style={{ flex: 1 }} />;

  if (productos.length === 0) {
    return (
      <View style={styles.vacio}>
        <Text style={{ fontSize: 64, marginBottom: 16 }}>💔</Text>
        <Text style={styles.vacioTitulo}>No tienes favoritos aún</Text>
        <Text style={styles.vacioSub}>Agrega productos que te gusten</Text>
        <TouchableOpacity style={styles.btnCatalogo} onPress={() => router.push('/(tabs)/catalogo')}>
          <Text style={styles.btnCatalogoTxt}>Explorar Catálogo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={productos}
      keyExtractor={p => p.id}
      numColumns={2}
      contentContainerStyle={styles.grid}
      columnWrapperStyle={{ gap: 12, paddingHorizontal: SPACING.lg }}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.imgWrap}>
            <Image source={{ uri: item.imagen }} style={styles.img} resizeMode="cover" />
            <TouchableOpacity style={styles.delBtn} onPress={() => eliminar(item.id)}>
              <Text style={{ fontSize: 12, color: '#ef4444' }}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.info}>
            <Text style={styles.nombre} numberOfLines={2}>{item.nombre}</Text>
            <Text style={styles.precio}>{fmt(item.precio)}</Text>
            <TouchableOpacity
              style={styles.btnAgregar}
              onPress={() => { agregarItem(item); addNotification(`${item.nombre} agregado al carrito`, 'success'); }}
            >
              <Text style={styles.btnAgregarTxt}>🛒 Agregar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  grid: { paddingTop: SPACING.lg, paddingBottom: 24 },
  vacio: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  vacioTitulo: { fontSize: 18, fontWeight: '700', color: COLORS.textoNegro, marginBottom: 8 },
  vacioSub: { fontSize: 14, color: COLORS.textoGrisMid, marginBottom: 24 },
  btnCatalogo: { backgroundColor: COLORS.negro, paddingHorizontal: 24, paddingVertical: 14, borderRadius: RADIUS.md },
  btnCatalogoTxt: { color: COLORS.dorado, fontWeight: '700' },
  card: { flex: 1, backgroundColor: COLORS.fondoCard, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.bordeClaro, marginBottom: 12, ...SHADOW.sm },
  imgWrap: { position: 'relative' },
  img: { width: '100%', height: 160 },
  delBtn: { position: 'absolute', top: 8, right: 8, width: 24, height: 24, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  info: { padding: 10, gap: 4 },
  nombre: { fontSize: 12, fontWeight: '600', color: COLORS.textoNegro, lineHeight: 16 },
  precio: { fontSize: 14, fontWeight: '700', color: COLORS.negro },
  btnAgregar: { backgroundColor: COLORS.negro, borderRadius: RADIUS.sm, paddingVertical: 8, alignItems: 'center' },
  btnAgregarTxt: { color: COLORS.blanco, fontSize: 11, fontWeight: '600' },
});
