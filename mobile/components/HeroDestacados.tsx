import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Image, Dimensions
} from 'react-native';
import { router } from 'expo-router';
import { COLORS, SPACING, RADIUS, SHADOW } from '@/constants';
import { api } from '@/services/api';
import { getBadgeOferta } from '@/utils/marketing';

const { width } = Dimensions.get('window');
const CARD_W = width * 0.58;
const CARD_H = CARD_W * 1.45;

const CATEGORIAS_EXCLUIDAS = ['Lencería', 'Ropa Interior'];
const fmt = (n: number) => '$' + Number(n).toLocaleString('es-CO');

export default function HeroDestacados() {
  const [productos, setProductos] = useState<any[]>([]);

  useEffect(() => {
    api.getProductos({ limite: 20 })
      .then(d => {
        const lista = (d.productos || [])
          .filter((p: any) => p.en_stock && p.imagen && !CATEGORIAS_EXCLUIDAS.includes(p.categoria));
        setProductos(lista.slice(0, 10));
      })
      .catch(() => {});
  }, []);

  if (productos.length === 0) return null;

  return (
    <View style={styles.wrap}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTexto}>
          <Text style={styles.eyebrow}>✦ NUEVA COLECCIÓN</Text>
          <Text style={styles.titulo}>Destacados</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/catalogo')} style={styles.btnVerTodo}>
          <Text style={styles.verTodoTxt}>Ver todo</Text>
          <Text style={styles.verTodoArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Carrusel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        decelerationRate="fast"
        snapToInterval={CARD_W + 16}
        snapToAlignment="start"
      >
        {productos.map((p, i) => {
          const badge = getBadgeOferta(p.id, p.precio);
          return (
            <TouchableOpacity
              key={p.id}
              style={styles.card}
              onPress={() => router.push(`/producto/${p.id}`)}
              activeOpacity={0.92}
            >
              {/* Imagen con gradiente */}
              <View style={styles.imagenWrap}>
                <Image source={{ uri: p.imagen }} style={styles.imagen} resizeMode="cover" />

                {/* Gradiente negro abajo */}
                <View style={styles.gradiente} />

                {/* Badge oferta */}
                {badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeTxt}>{badge.label}</Text>
                  </View>
                )}

                {/* Info sobre imagen */}
                <View style={styles.infoSobreImagen}>
                  <Text style={styles.categoriaTxt} numberOfLines={1}>{p.categoria}</Text>
                  <Text style={styles.nombreTxt} numberOfLines={2}>{p.nombre}</Text>
                  <View style={styles.precioRow}>
                    {badge && (
                      <Text style={styles.precioAnterior}>{fmt(badge.precioReferencia)}</Text>
                    )}
                    <Text style={styles.precio}>{fmt(p.precio)}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  headerTexto: {
    gap: 2,
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.dorado,
    letterSpacing: 2,
  },
  titulo: {
    fontFamily: 'Prata-Regular',
    fontSize: 24,
    color: COLORS.textoNegro,
    lineHeight: 28,
  },
  btnVerTodo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.negro,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  verTodoTxt: {
    fontSize: 11,
    color: COLORS.dorado,
    fontWeight: '600',
  },
  verTodoArrow: {
    fontSize: 11,
    color: COLORS.dorado,
    fontWeight: '700',
  },
  scroll: {
    paddingHorizontal: SPACING.lg,
    gap: 16,
    paddingRight: SPACING.xxl,
  },
  card: {
    width: CARD_W,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOW.md,
  },
  imagenWrap: {
    width: '100%',
    height: CARD_H,
    position: 'relative',
  },
  imagen: {
    width: '100%',
    height: '100%',
  },
  gradiente: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '55%',
    backgroundColor: 'rgba(0,0,0,0)',
  },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: COLORS.dorado,
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeTxt: {
    color: COLORS.negro,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  infoSobreImagen: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    backgroundColor: 'rgba(0,0,0,0.72)',
    gap: 3,
  },
  categoriaTxt: {
    fontSize: 8,
    color: COLORS.dorado,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: '700',
  },
  nombreTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.blanco,
    lineHeight: 17,
  },
  precioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  precioAnterior: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.45)',
    textDecorationLine: 'line-through',
  },
  precio: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.dorado,
  },
});
