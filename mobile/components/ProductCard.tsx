import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, TouchableOpacity,
  StyleSheet, Dimensions, Modal, Animated,
  ScrollView, TouchableWithoutFeedback
} from 'react-native';
import { router } from 'expo-router';
import { COLORS, RADIUS, SHADOW, SPACING } from '@/constants';
import { Producto } from '@/types';
import { useCartStore } from '@/store/useCartStore';
import { useUserStore } from '@/store/useUserStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { haptic } from '@/hooks/useHaptics';
import { useScalePress, useSlideUp } from '@/hooks/useAnimations';
import { rf, SCREEN } from '@/constants';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - SPACING.lg * 2 - 10) / 2;

// Hook para obtener ratio real de una imagen
function useImageRatio(uri: string): number {
  const [ratio, setRatio] = useState(4 / 3); // portrait por defecto
  useEffect(() => {
    if (!uri) return;
    Image.getSize(
      uri,
      (w, h) => { if (w > 0 && h > 0) setRatio(h / w); },
      () => {}
    );
  }, [uri]);
  return ratio;
}

interface Props {
  producto: Producto;
  onVerDetalles?: (p: Producto) => void;
  index?: number;
  alturaForzada?: number;
}

const fmt = (n: number) => '$' + n.toLocaleString('es-CO');

// ── Bottom Sheet para agregar al carrito ──────────────────────
function BottomSheetAgregar({
  producto,
  visible,
  onClose,
}: {
  producto: Producto;
  visible: boolean;
  onClose: () => void;
}) {
  const agregarItem = useCartStore(s => s.agregarItem);
  const addNotification = useNotificationStore(s => s.addNotification);
  const { translateY, opacity: overlayOp } = useSlideUp(visible);

  const [talla, setTalla] = useState(producto.tallas?.[0] || '');
  const [color, setColor] = useState(producto.colores?.[0] || '');
  const [cantidad, setCantidad] = useState(1);

  const handleAgregar = () => {
    haptic.agregarCarrito();
    agregarItem(producto, talla || undefined, color || undefined);
    addNotification(`${producto.nombre} agregado al carrito ✓`, 'success');
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {/* Overlay */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.overlay, { opacity: overlayOp }]} />
      </TouchableWithoutFeedback>

      {/* Sheet */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Producto info */}
        <View style={styles.sheetProducto}>
          <Image source={{ uri: producto.imagen }} style={styles.sheetImg} resizeMode="cover" />
          <View style={{ flex: 1 }}>
            <Text style={styles.sheetNombre} numberOfLines={2}>{producto.nombre}</Text>
            <Text style={styles.sheetPrecio}>{fmt(producto.precio)}</Text>
            {!producto.en_stock && (
              <Text style={{ color: '#ef4444', fontSize: 11, marginTop: 2 }}>Agotado</Text>
            )}
          </View>
        </View>

        {/* Tallas */}
        {producto.tallas && producto.tallas.length > 0 && (
          <View style={styles.sheetSection}>
            <Text style={styles.sheetLabel}>
              Talla <Text style={styles.sheetLabelVal}>{talla}</Text>
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {producto.tallas.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.opcion, talla === t && styles.opcionActivo]}
                  onPress={() => { haptic.tap(); setTalla(t); }}
                >
                  <Text style={[styles.opcionTxt, talla === t && styles.opcionTxtActivo]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Colores */}
        {producto.colores && producto.colores.length > 0 && (
          <View style={styles.sheetSection}>
            <Text style={styles.sheetLabel}>
              Color <Text style={styles.sheetLabelVal}>{color}</Text>
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {producto.colores.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.opcion, color === c && styles.opcionActivo]}
                  onPress={() => { haptic.tap(); setColor(c); }}
                >
                  <Text style={[styles.opcionTxt, color === c && styles.opcionTxtActivo]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Cantidad */}
        <View style={styles.sheetSection}>
          <Text style={styles.sheetLabel}>Cantidad</Text>
          <View style={styles.cantRow}>
            <TouchableOpacity
              style={styles.cantBtn}
              onPress={() => { if (cantidad > 1) { haptic.tap(); setCantidad(c => c - 1); } }}
            >
              <Text style={styles.cantBtnTxt}>−</Text>
            </TouchableOpacity>
            <Text style={styles.cantNum}>{cantidad}</Text>
            <TouchableOpacity
              style={styles.cantBtn}
              onPress={() => { haptic.tap(); setCantidad(c => c + 1); }}
            >
              <Text style={styles.cantBtnTxt}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Botón agregar */}
        <TouchableOpacity
          style={[styles.btnAgregar, !producto.en_stock && styles.btnAgotado]}
          onPress={producto.en_stock ? handleAgregar : undefined}
          disabled={!producto.en_stock}
        >
          <Text style={styles.btnAgregarTxt}>
            {producto.en_stock ? `Agregar al carrito — ${fmt(producto.precio * cantidad)}` : 'Agotado'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </Animated.View>
    </Modal>
  );
}

// ── ProductCard luxury ────────────────────────────────────────
export default function ProductCard({ producto, onVerDetalles, index = 0, alturaForzada }: Props) {
  const { isFavorite, addToFavorites, removeFromFavorites } = useUserStore();
  const { scale, onPressIn, onPressOut } = useScalePress();
  const [showSheet, setShowSheet] = useState(false);
  const esFav = isFavorite(producto.id);
  const imgRatio = useImageRatio(producto.imagen);
  // Si viene altura forzada desde afuera la usamos, sino calculamos con ratio real
  const imgHeight = alturaForzada ?? Math.round(CARD_WIDTH * imgRatio);

  const handleFav = (e: any) => {
    e.stopPropagation?.();
    haptic.favoritoAdd();
    esFav ? removeFromFavorites(producto.id) : addToFavorites(producto.id);
  };

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <Text key={i} style={{ fontSize: 8, color: i < Math.round(rating) ? '#f59e0b' : '#e5e7eb' }}>★</Text>
    ));

  return (
    <>
      <Animated.View style={[{ transform: [{ scale }] }]}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => onVerDetalles ? onVerDetalles(producto) : router.push(`/producto/${producto.id}`)}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          activeOpacity={1}
        >
          {/* Imagen — ratio real, sin recorte */}
          <View style={[styles.imgWrap, { height: imgHeight }]}>
            <Image
              source={{ uri: producto.imagen }}
              style={{ width: '100%', height: imgHeight }}
              resizeMode="cover"
            />

            {/* Gradiente inferior sutil */}
            <View style={styles.imgGradient} />

            {/* Agotado */}
            {!producto.en_stock && (
              <View style={styles.agotadoOverlay}>
                <Text style={styles.agotadoTxt}>AGOTADO</Text>
              </View>
            )}

            {/* Eco */}
            {producto.es_eco && (
              <View style={styles.ecoBadge}>
                <Text style={styles.ecoBadgeTxt}>ECO</Text>
              </View>
            )}

            {/* Favorito */}
            <TouchableOpacity style={[styles.favBtn, esFav && styles.favBtnActivo]} onPress={handleFav}>
              <Text style={{ fontSize: 13, color: esFav ? COLORS.blanco : COLORS.textoGrisMid }}>
                {esFav ? '♥' : '♡'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Info */}
          <View style={styles.info}>
            <Text style={styles.categoria} numberOfLines={1}>{producto.categoria}</Text>
            <Text style={styles.nombre} numberOfLines={2}>{producto.nombre}</Text>

            <View style={styles.bottomRow}>
              <View>
                <Text style={styles.precio}>{fmt(producto.precio)}</Text>
                <View style={{ flexDirection: 'row', gap: 1, marginTop: 2 }}>
                  {renderStars(producto.calificacion)}
                </View>
              </View>

              {/* Botón + circular */}
              <TouchableOpacity
                style={[styles.addBtn, !producto.en_stock && styles.addBtnDis]}
                onPress={(e) => {
                  e.stopPropagation?.();
                  if (!producto.en_stock) return;
                  haptic.tap();
                  // Si tiene tallas o colores, abrir bottom sheet
                  if ((producto.tallas?.length || 0) > 0 || (producto.colores?.length || 0) > 0) {
                    setShowSheet(true);
                  } else {
                    const agregarItem = require('@/store/useCartStore').useCartStore.getState().agregarItem;
                    const addNotification = require('@/store/useNotificationStore').useNotificationStore.getState().addNotification;
                    haptic.agregarCarrito();
                    agregarItem(producto);
                    addNotification(`${producto.nombre} agregado ✓`, 'success');
                  }
                }}
                disabled={!producto.en_stock}
              >
                <Text style={styles.addBtnTxt}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>

      <BottomSheetAgregar
        producto={producto}
        visible={showSheet}
        onClose={() => setShowSheet(false)}
      />
    </>
  );
}

export { CARD_WIDTH };

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.fondoCard,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
    ...SHADOW.md,
  },
  imgWrap: {
    width: '100%',
    backgroundColor: '#f5f0eb',
    overflow: 'hidden',
  },
  imgGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 60,
    backgroundColor: 'transparent',
    // Simular gradiente con opacidad
  },
  agotadoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  agotadoTxt: {
    color: COLORS.blanco, fontSize: 10, fontWeight: '800',
    letterSpacing: 3,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  ecoBadge: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: '#10b981',
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  ecoBadgeTxt: { color: COLORS.blanco, fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  favBtn: {
    position: 'absolute', top: 8, right: 8,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center', justifyContent: 'center',
    ...SHADOW.sm,
  },
  favBtnActivo: { backgroundColor: '#f43f5e' },

  // Info
  info: { padding: SPACING.sm + 2, paddingBottom: SPACING.md },
  categoria: {
    fontSize: rf(9), color: COLORS.textoGrisSub,
    textTransform: 'uppercase', letterSpacing: 1.5,
    fontWeight: '600', marginBottom: 3,
  },
  nombre: {
    fontSize: rf(12), fontWeight: '600',
    color: COLORS.textoNegro, lineHeight: rf(16),
    marginBottom: 8,
  },
  bottomRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  precio: { fontSize: rf(14), fontWeight: '800', color: COLORS.negro },
  addBtn: {
    width: rf(32), height: rf(32), borderRadius: rf(16),
    backgroundColor: COLORS.negro,
    alignItems: 'center', justifyContent: 'center',
    ...SHADOW.sm,
  },
  addBtnDis: { backgroundColor: COLORS.bordeMedio },
  addBtnTxt: { color: COLORS.dorado, fontSize: rf(20), fontWeight: '300', lineHeight: rf(24) },

  // Bottom Sheet
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.fondoCard,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: SPACING.xl,
    paddingTop: 12,
    ...SHADOW.lg,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: COLORS.bordeMedio,
    alignSelf: 'center', marginBottom: 20,
  },
  sheetProducto: {
    flexDirection: 'row', gap: 14, marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1, borderBottomColor: COLORS.bordeClaro,
  },
  sheetImg: {
    width: 70,
    height: 90,
    borderRadius: RADIUS.md,
    backgroundColor: '#f5f0eb',
    overflow: 'hidden',
  },
  sheetNombre: { fontSize: 14, fontWeight: '700', color: COLORS.textoNegro, lineHeight: 20, marginBottom: 6 },
  sheetPrecio: { fontSize: 18, fontWeight: '800', color: COLORS.negro },
  sheetSection: { marginBottom: 20 },
  sheetLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textoGrisMid, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  sheetLabelVal: { color: COLORS.negro, fontWeight: '800' },
  opcion: {
    paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: RADIUS.md, borderWidth: 1.5,
    borderColor: COLORS.bordeClaro, backgroundColor: COLORS.fondoCard,
  },
  opcionActivo: { backgroundColor: COLORS.negro, borderColor: COLORS.negro },
  opcionTxt: { fontSize: 13, color: COLORS.textoGrisMid, fontWeight: '600' },
  opcionTxtActivo: { color: COLORS.dorado, fontWeight: '700' },
  cantRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  cantBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1.5, borderColor: COLORS.bordeMedio,
    alignItems: 'center', justifyContent: 'center',
  },
  cantBtnTxt: { fontSize: 20, color: COLORS.textoNegro, fontWeight: '300', lineHeight: 24 },
  cantNum: { fontSize: 18, fontWeight: '800', color: COLORS.textoNegro, minWidth: 32, textAlign: 'center' },
  btnAgregar: {
    backgroundColor: COLORS.negro,
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
    ...SHADOW.sm,
  },
  btnAgotado: { backgroundColor: COLORS.fondoGris },
  btnAgregarTxt: { color: COLORS.dorado, fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
});
