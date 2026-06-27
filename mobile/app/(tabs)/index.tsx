import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  Image, StyleSheet, ActivityIndicator, RefreshControl,
  StatusBar, Dimensions, FlatList, Animated, Modal
} from 'react-native';
import * as ExpoClipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { COLORS, SPACING, RADIUS, SHADOW } from '@/constants';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useAppPrefs } from '@/store/useAppPrefs';
import { useNotificationStore } from '@/store/useNotificationStore';
import { Producto } from '@/types';
import ProductCard, { CARD_WIDTH } from '@/components/ProductCard';
import EgosLogo from '@/components/EgosLogo';
import { networkCache } from '@/hooks/useNetwork';
import { useFadeIn } from '@/hooks/useAnimations';

const { width } = Dimensions.get('window');

// ── Mini HeroCarousel inline ──────────────────────────────────────────────────
function HeroCarousel() {
  const [campanas, setCampanas] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    api.getCampanas()
      .then(d => setCampanas((d.campanas || []).filter((c: any) => c.estado === 'Activa')))
      .catch(() => {});
    const t = setInterval(() => {
      api.getCampanas()
        .then(d => setCampanas((d.campanas || []).filter((c: any) => c.estado === 'Activa')))
        .catch(() => {});
    }, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (campanas.length <= 1) return;
    const t = setInterval(() => setIdx(i => (i + 1) % campanas.length), 5000);
    return () => clearInterval(t);
  }, [campanas.length]);

  if (campanas.length === 0) {
    return (
      <View style={heroStyles.logoWrap}>
        <EgosLogo size="lg" showSlogan />
      </View>
    );
  }

  const c = campanas[idx];
  return (
    <View style={heroStyles.campanaWrap}>
      <View style={heroStyles.campanaInner}>
        <Text style={heroStyles.badge}>🎉 CAMPAÑA ESPECIAL</Text>
        <Text style={heroStyles.campNombre} numberOfLines={2}>{c.nombre}</Text>
        <Text style={heroStyles.campDesc} numberOfLines={2}>{c.descripcion}</Text>
        {c.descuento ? (
          <View style={heroStyles.descuentoBadge}>
            <Text style={heroStyles.descuentoTxt}>HASTA {c.descuento}% OFF</Text>
          </View>
        ) : null}
      </View>
      {campanas.length > 1 && (
        <View style={heroStyles.dots}>
          {campanas.map((_, i) => (
            <View key={i} style={[heroStyles.dot, i === idx && heroStyles.dotActivo]} />
          ))}
        </View>
      )}
    </View>
  );
}

const heroStyles = StyleSheet.create({
  logoWrap: { alignItems: 'center', justifyContent: 'center', height: '100%' },
  campanaWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: SPACING.lg },
  campanaInner: { alignItems: 'center', gap: 8 },
  badge: { backgroundColor: 'rgba(255,255,255,0.2)', color: COLORS.blanco, fontSize: 11, fontWeight: '700', paddingHorizontal: 12, paddingVertical: 4, borderRadius: RADIUS.full, overflow: 'hidden' },
  campNombre: { fontSize: 24, fontWeight: '900', color: COLORS.blanco, textAlign: 'center' },
  campDesc: { fontSize: 13, color: 'rgba(255,255,255,0.85)', textAlign: 'center' },
  descuentoBadge: { backgroundColor: COLORS.blanco, paddingHorizontal: 20, paddingVertical: 8, borderRadius: RADIUS.md },
  descuentoTxt: { color: '#ef4444', fontWeight: '800', fontSize: 18 },
  dots: { flexDirection: 'row', gap: 6, marginTop: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActivo: { width: 20, backgroundColor: COLORS.blanco },
});

// ── PromoBanner inline ────────────────────────────────────────────────────────
function PromoBanner() {
  const [cupones, setCupones] = useState<any[]>([]);
  const addNotification = useNotificationStore(s => s.addNotification);
  useEffect(() => {
    api.getCupones()
      .then(d => setCupones((d.cupones || []).filter((c: any) => c.activo).slice(0, 3)))
      .catch(() => {});
  }, []);
  if (!cupones.length) return null;

  const copiar = async (codigo: string) => {
    await ExpoClipboard.setStringAsync(codigo);
    addNotification(`Código ${codigo} copiado 📋`, 'success');
  };

  return (
    <View style={promoStyles.wrap}>
      <Text style={promoStyles.titulo}>🎉 Promociones Activas</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: SPACING.lg }}>
        {cupones.map(c => (
          <View key={c.id} style={promoStyles.card}>
            <Text style={promoStyles.desc} numberOfLines={2}>{c.descripcion}</Text>
            <TouchableOpacity style={promoStyles.codigoBox} onPress={() => copiar(c.codigo)}>
              <Text style={promoStyles.codigo}>{c.codigo}</Text>
              <View style={promoStyles.copyBtn}>
                <Text style={promoStyles.copyTxt}>📋</Text>
              </View>
            </TouchableOpacity>
            <View style={promoStyles.footer}>
              <View style={promoStyles.descBadge}>
                <Text style={promoStyles.descBadgeTxt}>{c.tipo === 'porcentaje' ? `${c.valor}% OFF` : `$${c.valor}`}</Text>
              </View>
              <Text style={promoStyles.minimo}>Mín: ${c.minimo_compra?.toLocaleString('es-CO')}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const promoStyles = StyleSheet.create({
  wrap: { backgroundColor: COLORS.fondoCard, paddingVertical: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.bordeClaro },
  titulo: { fontSize: 15, fontWeight: '700', color: COLORS.textoNegro, paddingHorizontal: SPACING.lg, marginBottom: 10 },
  card: { width: 200, backgroundColor: COLORS.fondoGris, borderRadius: RADIUS.lg, padding: 12, borderWidth: 1, borderColor: COLORS.bordeClaro },
  desc: { fontSize: 12, color: COLORS.textoGrisMid, marginBottom: 8 },
  codigoBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fdf2f8', borderRadius: RADIUS.sm, padding: 8, borderWidth: 1, borderStyle: 'dashed', borderColor: '#f9a8d4', marginBottom: 8 },
  codigo: { fontSize: 16, fontWeight: '800', color: '#db2777', fontVariant: ['tabular-nums'] },
  copyBtn: { backgroundColor: '#db2777', borderRadius: 6, padding: 4 },
  copyTxt: { fontSize: 12 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  descBadge: { backgroundColor: '#f59e0b', borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 2 },
  descBadgeTxt: { color: COLORS.blanco, fontSize: 11, fontWeight: '700' },
  minimo: { fontSize: 11, color: COLORS.textoGrisSub },
});

// ── Pantalla principal ────────────────────────────────────────────────────────
const CATEGORIAS_RESTRINGIDAS = ['Lencería'];

export default function HomeScreen() {
  const { usuario, estaAutenticado } = useAuthStore();
  const { lenceriaConfirmada, confirmarLenceria } = useAppPrefs();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('');
  const [orden, setOrden] = useState('relevancia');
  const [pagina, setPagina] = useState(1);
  const [modalAdultos, setModalAdultos] = useState(false);
  const POR_PAGINA = 20;

  const cargar = async () => {
    try {
      const [dp, dc] = await Promise.all([api.getProductos({ limite: 200 }), api.getCategorias()]);
      const prods = dp.productos || [];
      setProductos(prods);
      setCategorias((dc.categorias || []).map((c: any) => c.nombre || c));
      // Guardar en cache para modo offline
      networkCache.guardarProductos(prods);
    } catch {
      // Sin conexión — cargar desde cache
      const cached = await networkCache.obtenerProductos();
      if (cached.length > 0) setProductos(cached);
    }
    finally { setCargando(false); setRefreshing(false); }
  };

  useEffect(() => { cargar(); }, []);

  const filtrados = useMemo(() => {
    let f = [...productos];
    if (categoria !== 'Lencería') {
      f = f.filter(p => !CATEGORIAS_RESTRINGIDAS.includes(p.categoria || ''));
    }
    if (categoria) f = f.filter(p => p.categoria === categoria);
    if (busqueda) f = f.filter(p => p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || p.descripcion.toLowerCase().includes(busqueda.toLowerCase()));
    if (orden === 'precio_asc') f.sort((a, b) => a.precio - b.precio);
    else if (orden === 'precio_desc') f.sort((a, b) => b.precio - a.precio);
    else if (orden === 'nombre') f.sort((a, b) => a.nombre.localeCompare(b.nombre));
    else if (orden === 'calificacion') f.sort((a, b) => b.calificacion - a.calificacion);
    return f;
  }, [productos, categoria, busqueda, orden]);

  const visibles = filtrados.slice(0, pagina * POR_PAGINA);
  const hayMas = visibles.length < filtrados.length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.negroHeader} />

      {/* HEADER FIJO — no scrollea */}
      <View style={styles.header}>
        <EgosLogo size="sm" showSlogan />
        {estaAutenticado && usuario?.nombre ? (
          <Text style={styles.saludo}>
            Hola, <Text style={styles.saludoNombre}>{usuario.nombre.split(' ')[0]}</Text> 👋
          </Text>
        ) : (
          <Text style={styles.saludo}>Bienvenido</Text>
        )}
      </View>

      {/* BANNER CAMPAÑAS FIJO — no scrollea */}
      <View style={styles.hero}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop' }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
        <View style={styles.heroOverlay}>
          <HeroCarousel />
        </View>
      </View>

      {/* Bienvenida — manejada desde _layout.tsx */}

      <FlatList
        data={visibles}
        keyExtractor={(item, i) => item.id || String(i)}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); cargar(); }} tintColor={COLORS.dorado} />
        }
        ListHeaderComponent={
          <>
            <View style={styles.filtros}>
              {/* Búsqueda */}
              <View style={styles.searchBox}>
                <Text style={{ fontSize: 14 }}>🔍</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar productos..."
                  placeholderTextColor={COLORS.textoGrisSub}
                  value={busqueda}
                  onChangeText={v => { setBusqueda(v); setPagina(1); }}
                />
                {busqueda ? (
                  <TouchableOpacity onPress={() => setBusqueda('')}>
                    <Text style={{ fontSize: 14, color: COLORS.textoGrisSub }}>✕</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Categorías */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 6 }} contentContainerStyle={{ paddingHorizontal: SPACING.lg, gap: 8 }}>
                {['', ...categorias].map(cat => (
                  <TouchableOpacity
                    key={cat || '__todas'}
                    style={[styles.catChip, categoria === cat && styles.catChipActivo]}
                    onPress={() => {
                      if (CATEGORIAS_RESTRINGIDAS.includes(cat) && !lenceriaConfirmada) {
                        setModalAdultos(true);
                        return;
                      }
                      setCategoria(cat);
                      setPagina(1);
                    }}
                  >
                    <Text style={[styles.catChipTxt, categoria === cat && styles.catChipTxtActivo]}>
                      {cat || 'Todas'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Orden */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACING.lg, gap: 6, paddingBottom: 8 }}>
                {[
                  { key: 'relevancia', label: 'Relevancia' },
                  { key: 'precio_asc', label: 'Precio ↑' },
                  { key: 'precio_desc', label: 'Precio ↓' },
                  { key: 'nombre', label: 'A-Z' },
                  { key: 'calificacion', label: '⭐ Mejor' },
                ].map(o => (
                  <TouchableOpacity
                    key={o.key}
                    style={[styles.ordenBtn, orden === o.key && styles.ordenBtnActivo]}
                    onPress={() => setOrden(o.key)}
                  >
                    <Text style={[styles.ordenTxt, orden === o.key && styles.ordenTxtActivo]}>{o.label}</Text>
                  </TouchableOpacity>
                ))}
                <Text style={styles.contador}>{cargando ? '...' : `${filtrados.length} productos`}</Text>
              </ScrollView>
            </View>

            {cargando ? <ActivityIndicator color={COLORS.dorado} size="large" style={{ margin: 40 }} /> : null}
          </>
        }
        ListFooterComponent={
          <>
            {hayMas && !cargando ? (
              <View style={{ paddingHorizontal: SPACING.lg, paddingBottom: 16 }}>
                <TouchableOpacity style={styles.btnMas} onPress={() => setPagina(p => p + 1)}>
                  <Text style={styles.btnMasTxt}>Ver más productos ({filtrados.length - visibles.length} restantes)</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            {!cargando && filtrados.length === 0 ? (
              <View style={styles.vacio}>
                <Text style={{ fontSize: 40, marginBottom: 12 }}>🔍</Text>
                <Text style={{ color: COLORS.textoGrisMid, fontSize: 15, marginBottom: 8 }}>No se encontraron productos</Text>
                <TouchableOpacity onPress={() => { setBusqueda(''); setCategoria(''); }}>
                  <Text style={{ color: COLORS.negro, fontWeight: '600' }}>Limpiar filtros</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            <View style={{ height: 24 }} />
          </>
        }
        renderItem={({ item }) => (
          <ProductCard
            producto={item}
            onVerDetalles={p => router.push(`/producto/${p.id}`)}
          />
        )}
      />

      {/* Modal adultos — igual que el web */}
      <Modal visible={modalAdultos} transparent animationType="fade" onRequestClose={() => setModalAdultos(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalEmoji}>🔞</Text>
            <Text style={styles.modalTitulo}>Contenido para adultos</Text>
            <Text style={styles.modalDesc}>
              Esta categoría contiene lencería y ropa interior.{"\n"}¿Confirmas que eres mayor de <Text style={{ fontWeight: '800' }}>18 años</Text>?
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.modalBtnCancelar}
                onPress={() => { setModalAdultos(false); setCategoria(''); }}
              >
                <Text style={styles.modalBtnCancelarTxt}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnConfirmar}
                onPress={() => {
                  confirmarLenceria();
                  setModalAdultos(false);
                  setCategoria('Lencería'); setPagina(1);
                }}
              >
                <Text style={styles.modalBtnConfirmarTxt}>Sí, tengo 18+</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalNota}>Al confirmar aceptas ver contenido de lencería.</Text>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf8f5' }, // crema luxury
  header: {
    backgroundColor: COLORS.negroHeader,
    paddingTop: 52,
    paddingBottom: 12,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(197,164,126,0.15)',
    // FIJO — no scrollea
    zIndex: 10,
  },
  saludo: { fontSize: 14, color: '#9ca3af', letterSpacing: 0.3 },
  saludoNombre: { color: COLORS.dorado, fontWeight: '700', fontSize: 16 },
  hero: { height: 220, position: 'relative', overflow: 'hidden' },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.52)',
    justifyContent: 'center',
  },
  filtros: {
    backgroundColor: COLORS.fondoCard,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bordeClaro,
    paddingTop: SPACING.sm,
    ...SHADOW.sm,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.lg,
    backgroundColor: '#f5f3ef',   // crema ligeramente más oscuro
    borderRadius: RADIUS.full,    // pill search
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    marginBottom: SPACING.sm,
    gap: 6,
    borderWidth: 1,
    borderColor: '#e8e2d9',
  },
  searchInput: { flex: 1, fontSize: 13, color: COLORS.textoNegro, padding: 0 },
  catChip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: RADIUS.full, borderWidth: 1.5,
    borderColor: '#e8e2d9', backgroundColor: COLORS.fondoCard,
  },
  catChipActivo: { backgroundColor: COLORS.negro, borderColor: COLORS.negro },
  catChipTxt: { fontSize: 11, color: COLORS.textoGris, fontWeight: '600', letterSpacing: 0.3 },
  catChipTxtActivo: { color: COLORS.dorado, fontWeight: '700' },
  ordenBtn: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: RADIUS.sm, backgroundColor: '#f5f3ef',
  },
  ordenBtnActivo: { backgroundColor: COLORS.negro },
  ordenTxt: { fontSize: 11, color: COLORS.textoGrisMid },
  ordenTxtActivo: { color: COLORS.dorado, fontWeight: '600' },
  contador: { marginLeft: 4, fontSize: 11, color: COLORS.textoGrisSub, alignSelf: 'center' },
  row: { paddingHorizontal: SPACING.lg, justifyContent: 'space-between' },
  grid: { paddingTop: SPACING.lg },
  btnMas: {
    borderWidth: 1.5, borderColor: COLORS.negro,
    borderRadius: RADIUS.full, paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center', backgroundColor: 'transparent',
    alignSelf: 'center',
    marginHorizontal: SPACING.lg,
  },
  btnMasTxt: { fontSize: 12, color: COLORS.negro, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  vacio: { alignItems: 'center', padding: 40 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  modalCard: {
    backgroundColor: COLORS.fondoCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.xxl,
    width: '100%',
    alignItems: 'center',
    ...SHADOW.lg,
  },
  modalEmoji: { fontSize: 48, marginBottom: 12 },
  modalTitulo: { fontSize: 18, fontWeight: '800', color: COLORS.textoNegro, marginBottom: 10, textAlign: 'center' },
  modalDesc: { fontSize: 14, color: COLORS.textoGrisMid, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  modalBtns: { flexDirection: 'row', gap: 12, width: '100%' },
  modalBtnCancelar: {
    flex: 1, borderWidth: 1, borderColor: COLORS.bordeMedio,
    borderRadius: RADIUS.md, paddingVertical: 12, alignItems: 'center',
  },
  modalBtnCancelarTxt: { fontSize: 14, color: COLORS.textoGrisMid, fontWeight: '600' },
  modalBtnConfirmar: {
    flex: 1, backgroundColor: COLORS.negro,
    borderRadius: RADIUS.md, paddingVertical: 12, alignItems: 'center',
  },
  modalBtnConfirmarTxt: { fontSize: 14, color: COLORS.dorado, fontWeight: '700' },
  modalNota: { fontSize: 11, color: COLORS.textoGrisSub, marginTop: 14, textAlign: 'center' },
});
