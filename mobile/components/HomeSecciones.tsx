import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, FlatList, TouchableOpacity, Image,
  StyleSheet, Animated, Dimensions
} from 'react-native';
import { router } from 'expo-router';
import { COLORS, SPACING, RADIUS, SHADOW } from '@/constants';
import { api } from '@/services/api';
import { API_URL } from '@/constants';
import { getBadgeOferta } from '@/utils/marketing';

const { width } = Dimensions.get('window');
const fmt = (n: number) => '$' + Number(n).toLocaleString('es-CO');
const EXCLUIDAS = ['Lencería', 'Ropa Interior'];

const IMAGENES_CAT: Record<string, string> = {
  'Jeans':      'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=500&fit=crop',
  'Vestidos':   'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=500&fit=crop',
  'Blusas':     'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=500&fit=crop',
  'Calzado':    'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&h=500&fit=crop',
  'Camisas':    'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&h=500&fit=crop',
  'Pantalones': 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&h=500&fit=crop',
  'Blazers':    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&h=500&fit=crop',
  'Accesorios': 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=400&h=500&fit=crop',
  'Shorts':     'https://images.unsplash.com/photo-1591195853828-11db59a44f43?w=400&h=500&fit=crop',
  'Tops':       'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=400&h=500&fit=crop',
};

const FRASES = [
  { frase: 'Wear Your Truth', sub: 'Cada prenda cuenta tu historia' },
  { frase: 'Define tu estilo', sub: 'Moda colombiana exclusiva' },
  { frase: 'Viste con propósito', sub: 'Colecciones que te representan' },
];

// ── SECCIÓN 1: Header animado ─────────────────────────────────────────────────
export function HeaderAnimado() {
  const [idx, setIdx] = useState(0);
  const opAnim = useRef(new Animated.Value(1)).current;
  const yAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = setInterval(() => {
      Animated.parallel([
        Animated.timing(opAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(yAnim, { toValue: -8, duration: 500, useNativeDriver: true }),
      ]).start(() => {
        setIdx(i => (i + 1) % FRASES.length);
        yAnim.setValue(8);
        Animated.parallel([
          Animated.timing(opAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(yAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]).start();
      });
    }, 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <View style={h.wrap}>
      {/* Línea + E + Línea */}
      <View style={h.lineaRow}>
        <View style={h.linea} />
        <Text style={h.logoE}>E</Text>
        <View style={h.linea} />
      </View>

      {/* Frase animada */}
      <Animated.View style={[h.fraseWrap, { opacity: opAnim, transform: [{ translateY: yAnim }] }]}>
        <Text style={h.frase}>{FRASES[idx].frase}</Text>
        <Text style={h.sub}>{FRASES[idx].sub}</Text>
      </Animated.View>

      {/* CTA */}
      <TouchableOpacity style={h.btn} onPress={() => router.push('/(tabs)/catalogo')} activeOpacity={0.85}>
        <Text style={h.btnTxt}>Explorar colección</Text>
        <Text style={h.btnArrow}>→</Text>
      </TouchableOpacity>

      {/* Dots */}
      <View style={h.dots}>
        {FRASES.map((_, i) => (
          <View key={i} style={[h.dot, i === idx && h.dotActivo]} />
        ))}
      </View>
    </View>
  );
}

const h = StyleSheet.create({
  wrap: {
    backgroundColor: COLORS.negro,
    alignItems: 'center',
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  },
  lineaRow: { flexDirection: 'row', alignItems: 'center', gap: 14, width: '100%', marginBottom: SPACING.lg },
  linea: { flex: 1, height: 1, backgroundColor: 'rgba(197,164,126,0.25)' },
  logoE: { fontFamily: 'BodoniModa-Regular', fontSize: 32, color: COLORS.dorado, lineHeight: 32 },
  fraseWrap: { alignItems: 'center', gap: 8, marginBottom: SPACING.xl, minHeight: 72, justifyContent: 'center' },
  frase: { fontFamily: 'BodoniModa-Italic', fontSize: 28, color: COLORS.blanco, textAlign: 'center', lineHeight: 34, fontStyle: 'italic' },
  sub: { fontSize: 11, color: 'rgba(197,164,126,0.55)', textAlign: 'center', letterSpacing: 1.5 },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(197,164,126,0.35)', borderRadius: 30, paddingHorizontal: 22, paddingVertical: 11, marginBottom: SPACING.lg },
  btnTxt: { color: COLORS.dorado, fontSize: 12, fontWeight: '600', letterSpacing: 1 },
  btnArrow: { color: COLORS.dorado, fontSize: 14, fontWeight: '700' },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(197,164,126,0.25)' },
  dotActivo: { width: 18, backgroundColor: COLORS.dorado },
});

// ── SECCIÓN 2: Carrusel destacados ────────────────────────────────────────────
const CARD_W = width * 0.56;
const CARD_H = CARD_W * 1.42;

export function HeroDestacados() {
  const [productos, setProductos] = useState<any[]>([]);

  useEffect(() => {
    api.getProductos({ limite: 20 })
      .then(d => setProductos((d.productos || []).filter((p: any) => p.en_stock && p.imagen && !EXCLUIDAS.includes(p.categoria)).slice(0, 10)))
      .catch(() => {});
  }, []);

  if (productos.length === 0) return null;

  return (
    <View style={c.wrap}>
      <View style={c.header}>
        <View>
          <Text style={c.eyebrow}>✦ NUEVA COLECCIÓN</Text>
          <Text style={c.titulo}>Destacados</Text>
        </View>
        <TouchableOpacity style={c.pill} onPress={() => router.push('/(tabs)/catalogo')}>
          <Text style={c.pillTxt}>Ver todo →</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={c.scroll} decelerationRate="fast" snapToInterval={CARD_W + 14}>
        {productos.map(p => {
          const badge = getBadgeOferta(p.id, p.precio);
          return (
            <TouchableOpacity key={p.id} style={c.card} onPress={() => router.push(`/producto/${p.id}`)} activeOpacity={0.92}>
              <Image source={{ uri: p.imagen }} style={c.imagen} resizeMode="cover" />
              {badge && (
                <View style={c.badge}>
                  <Text style={c.badgeTxt}>{badge.label}</Text>
                </View>
              )}
              <View style={c.infoOverlay}>
                <Text style={c.catTxt}>{p.categoria}</Text>
                <Text style={c.nombreTxt} numberOfLines={2}>{p.nombre}</Text>
                <View style={c.precioRow}>
                  {badge && <Text style={c.precioAntes}>{fmt(badge.precioReferencia)}</Text>}
                  <Text style={c.precio}>{fmt(p.precio)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const c = StyleSheet.create({
  wrap: { marginBottom: SPACING.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  eyebrow: { fontSize: 9, fontWeight: '700', color: COLORS.dorado, letterSpacing: 2, marginBottom: 2 },
  titulo: { fontFamily: 'Prata-Regular', fontSize: 22, color: COLORS.textoNegro },
  pill: { backgroundColor: COLORS.negro, borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 7 },
  pillTxt: { color: COLORS.dorado, fontSize: 11, fontWeight: '700' },
  scroll: { paddingHorizontal: SPACING.lg, gap: 14, paddingRight: SPACING.xxl },
  card: { width: CARD_W, height: CARD_H, borderRadius: RADIUS.xl, overflow: 'hidden', ...SHADOW.md },
  imagen: { width: '100%', height: '100%' },
  badge: { position: 'absolute', top: 12, left: 12, backgroundColor: COLORS.dorado, borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4 },
  badgeTxt: { color: COLORS.negro, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  infoOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14, backgroundColor: 'rgba(0,0,0,0.68)', gap: 3 },
  catTxt: { fontSize: 8, color: COLORS.dorado, textTransform: 'uppercase', letterSpacing: 2, fontWeight: '700' },
  nombreTxt: { fontSize: 13, fontWeight: '700', color: COLORS.blanco, lineHeight: 17 },
  precioRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  precioAntes: { fontSize: 10, color: 'rgba(255,255,255,0.4)', textDecorationLine: 'line-through' },
  precio: { fontSize: 14, fontWeight: '800', color: COLORS.dorado },
});

// ── SECCIÓN 3: Categorías grid ────────────────────────────────────────────────
const CAT_W = (width - SPACING.lg * 2 - 10) / 2;
const CAT_H = CAT_W * 1.2;

export function CategoriasVisual() {
  const [categorias, setCategorias] = useState<string[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/api/categorias`)
      .then(r => r.json())
      .then(d => setCategorias((d.categorias || []).map((c: any) => c.nombre).filter((c: string) => !EXCLUIDAS.includes(c)).slice(0, 6)))
      .catch(() => {});
  }, []);

  if (categorias.length === 0) return null;

  return (
    <View style={g.wrap}>
      <View style={g.header}>
        <Text style={g.eyebrow}>✦ EXPLORAR</Text>
        <Text style={g.titulo}>Categorías</Text>
      </View>
      <View style={g.grid}>
        {categorias.map((cat, i) => {
          const imagen = IMAGENES_CAT[cat] || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=500&fit=crop';
          const esGrande = i === 0;
          return (
            <TouchableOpacity
              key={cat}
              style={[g.card, esGrande && g.cardGrande]}
              onPress={() => router.push('/(tabs)/catalogo')}
              activeOpacity={0.9}
            >
              <Image source={{ uri: imagen }} style={g.imagen} resizeMode="cover" />
              <View style={g.overlay} />
              <View style={g.labelWrap}>
                <Text style={g.label}>{cat}</Text>
                <Text style={g.labelSub}>Ver colección →</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const g = StyleSheet.create({
  wrap: { marginBottom: SPACING.xl, paddingHorizontal: SPACING.lg },
  header: { marginBottom: SPACING.md, gap: 2 },
  eyebrow: { fontSize: 9, fontWeight: '700', color: COLORS.dorado, letterSpacing: 2 },
  titulo: { fontFamily: 'Prata-Regular', fontSize: 22, color: COLORS.textoNegro },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: { width: CAT_W, height: CAT_H, borderRadius: RADIUS.lg, overflow: 'hidden', ...SHADOW.sm },
  cardGrande: { width: '100%', height: CAT_H * 0.85 },
  imagen: { width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  labelWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14, backgroundColor: 'rgba(0,0,0,0.5)' },
  label: { fontFamily: 'Prata-Regular', fontSize: 14, color: COLORS.blanco },
  labelSub: { fontSize: 10, color: 'rgba(197,164,126,0.7)', marginTop: 2, letterSpacing: 0.5 },
});

// ── SECCIÓN 4: Tendencias ─────────────────────────────────────────────────────
const T_W = width * 0.44;
const T_H = T_W * 1.25;

export function Tendencias() {
  const [todos, setTodos] = useState<any[]>([]);
  const [idxGlobal, setIdxGlobal] = useState(0);
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    api.getProductos({ limite: 100 })
      .then(d => {
        const lista = (d.productos || []).filter((p: any) => p.en_stock && p.imagen && !EXCLUIDAS.includes(p.categoria));
        // Mezclar aleatoriamente
        const seed = Date.now();
        const mezclado = [...lista].sort((a, b) => Math.sin(seed * a.id.length) - Math.sin(seed * b.id.length));
        setTodos(mezclado);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (todos.length === 0) return;
    const timer = setInterval(() => {
      // Fade out suave
      Animated.timing(opacityAnim, { toValue: 0, duration: 600, useNativeDriver: true }).start(() => {
        setIdxGlobal(prev => (prev + 1) % todos.length);
        Animated.timing(opacityAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
      });
    }, 10000);
    return () => clearInterval(timer);
  }, [todos.length]);

  if (todos.length === 0) return null;

  // Mostrar 5 cards a partir del índice global
  const visibles = Array.from({ length: 5 }, (_, i) => todos[(idxGlobal + i) % todos.length]);

  return (
    <View style={t.wrap}>
      <View style={t.header}>
        <View>
          <Text style={t.eyebrow}>✦ SELECCIÓN ESPECIAL</Text>
          <Text style={t.titulo}>Lo que está de moda</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/catalogo')} style={t.btnVerTodo}>
          <Text style={t.btnVerTodoTxt}>Ver todo →</Text>
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={t.scroll}
        decelerationRate="fast"
        snapToInterval={T_W + 14}
        style={{ opacity: opacityAnim }}
      >
        {visibles.map((p, i) => {
          const badge = getBadgeOferta(p.id, p.precio);
          return (
            <TouchableOpacity key={`${p.id}-${i}`} style={t.card} onPress={() => router.push(`/producto/${p.id}`)} activeOpacity={0.92}>
              <Image source={{ uri: p.imagen }} style={t.imagen} resizeMode="cover" />
              <View style={t.overlay} />
              {badge && (
                <View style={t.badge}>
                  <Text style={t.badgeTxt}>{badge.label}</Text>
                </View>
              )}
              <View style={t.infoOverlay}>
                <Text style={t.catTxt}>{p.categoria}</Text>
                <Text style={t.nombreTxt} numberOfLines={1}>{p.nombre}</Text>
                <View style={t.precioRow}>
                  {badge && <Text style={t.precioAntes}>{fmt(badge.precioReferencia)}</Text>}
                  <Text style={t.precio}>{fmt(p.precio)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </Animated.ScrollView>
    </View>
  );
}

const t = StyleSheet.create({
  wrap: { marginBottom: SPACING.xl, backgroundColor: '#050505' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
  },
  eyebrow: { fontSize: 8, fontWeight: '700', color: COLORS.dorado, letterSpacing: 2.5, marginBottom: 3 },
  titulo: { fontFamily: 'Prata-Regular', fontSize: 18, color: COLORS.blanco },
  scroll: { paddingHorizontal: SPACING.lg, gap: 14, paddingRight: SPACING.xxl, paddingBottom: SPACING.md },
  card: {
    width: T_W, height: T_H, borderRadius: RADIUS.xl, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(197,164,126,0.15)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 6,
  },
  imagen: { width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  badge: {
    position: 'absolute', top: 10, left: 10,
    backgroundColor: COLORS.dorado, borderRadius: RADIUS.full,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  badgeTxt: { color: COLORS.negro, fontSize: 8, fontWeight: '800' },
  infoOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 10, paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.82)', gap: 2,
    borderTopWidth: 1, borderTopColor: 'rgba(197,164,126,0.15)',
  },
  catTxt: { fontSize: 7, color: COLORS.dorado, textTransform: 'uppercase', letterSpacing: 2, fontWeight: '700' },
  nombreTxt: { fontSize: 11, fontWeight: '600', color: COLORS.blanco, lineHeight: 14 },
  precioRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  precioAntes: { fontSize: 9, color: 'rgba(255,255,255,0.35)', textDecorationLine: 'line-through' },
  precio: { fontSize: 12, fontWeight: '800', color: COLORS.dorado },
  btnVerTodo: {
    borderWidth: 1, borderColor: 'rgba(197,164,126,0.35)',
    borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 5,
  },
  btnVerTodoTxt: { color: COLORS.dorado, fontSize: 10, fontWeight: '600' },
});
