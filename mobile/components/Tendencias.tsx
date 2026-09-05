import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, Image, Dimensions
} from 'react-native';
import { router } from 'expo-router';
import { COLORS, SPACING, RADIUS, SHADOW } from '@/constants';
import { api } from '@/services/api';
import { getBadgeOferta } from '@/utils/marketing';

const { width } = Dimensions.get('window');
const CATEGORIAS_EXCLUIDAS = ['Lencería', 'Ropa Interior'];
const fmt = (n: number) => '$' + Number(n).toLocaleString('es-CO');

const BADGE_COLORS: Record<string, string> = {
  'bg-red-500': '#ef4444',
  'bg-orange-500': '#f97316',
  'bg-pink-500': '#ec4899',
  'bg-purple-600': '#9333ea',
  'bg-rose-500': '#f43f5e',
};

export default function Tendencias() {
  const [productos, setProductos] = useState<any[]>([]);

  useEffect(() => {
    api.getProductos({ limite: 20 })
      .then(d => {
        const lista = (d.productos || [])
          .filter((p: any) => p.en_stock && p.imagen && !CATEGORIAS_EXCLUIDAS.includes(p.categoria));
        // Solo los que tienen badge de oferta
        const conBadge = lista.filter((p: any) => getBadgeOferta(p.id, p.precio) !== null);
        setProductos(conBadge.slice(0, 6));
      })
      .catch(() => {});
  }, []);

  if (productos.length === 0) return null;

  const COL_W = (width - SPACING.lg * 2 - 10) / 2;

  return (
    <View style={styles.wrap}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.eyebrow}>✦ LO MÁS BUSCADO</Text>
        <Text style={styles.titulo}>Tendencias</Text>
      </View>

      {/* Grid 2 columnas */}
      <View style={styles.grid}>
        {productos.map((p, i) => {
          const badge = getBadgeOferta(p.id, p.precio);
          const badgeColor = badge ? (BADGE_COLORS[badge.color] || '#ef4444') : '#ef4444';
          const esGrande = i === 0;

          return (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.card,
                { width: esGrande ? width - SPACING.lg * 2 : COL_W },
                esGrande && styles.cardGrande,
              ]}
              onPress={() => router.push(`/producto/${p.id}`)}
              activeOpacity={0.92}
            >
              <Image
                source={{ uri: p.imagen }}
                style={[styles.imagen, { height: esGrande ? 220 : 180 }]}
                resizeMode="cover"
              />
              {badge && (
                <View style={[styles.badge, { backgroundColor: badgeColor }]}>
                  <Text style={styles.badgeTxt}>{badge.label}</Text>
                </View>
              )}
              <View style={styles.info}>
                <Text style={styles.nombre} numberOfLines={1}>{p.nombre}</Text>
                <View style={styles.precioRow}>
                  {badge && <Text style={styles.precioAnterior}>{fmt(badge.precioReferencia)}</Text>}
                  <Text style={styles.precio}>{fmt(p.precio)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: SPACING.xl, paddingHorizontal: SPACING.lg },
  header: { marginBottom: SPACING.md, gap: 2 },
  eyebrow: { fontSize: 9, fontWeight: '700', color: COLORS.dorado, letterSpacing: 2 },
  titulo: { fontFamily: 'Prata-Regular', fontSize: 24, color: COLORS.textoNegro },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    backgroundColor: COLORS.fondoCard,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.bordeClaro,
    ...SHADOW.sm,
  },
  cardGrande: {
    borderColor: 'rgba(197,164,126,0.3)',
  },
  imagen: { width: '100%' },
  badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeTxt: { color: '#fff', fontSize: 9, fontWeight: '800' },
  info: { padding: 10, gap: 3 },
  nombre: { fontSize: 12, fontWeight: '600', color: COLORS.textoNegro },
  precioRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  precioAnterior: { fontSize: 10, color: COLORS.textoGrisSub, textDecorationLine: 'line-through' },
  precio: { fontSize: 13, fontWeight: '800', color: COLORS.negro },
});
