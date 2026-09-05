import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Image, Dimensions
} from 'react-native';
import { router } from 'expo-router';
import { COLORS, SPACING, RADIUS, SHADOW } from '@/constants';
import { API_URL } from '@/constants';

const { width } = Dimensions.get('window');

const IMAGENES_CATEGORIA: Record<string, string> = {
  'Jeans':      'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=500&fit=crop',
  'Vestidos':   'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=500&fit=crop',
  'Blusas':     'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=500&fit=crop',
  'Calzado':    'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&h=500&fit=crop',
  'Camisas':    'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&h=500&fit=crop',
  'Pantalones': 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&h=500&fit=crop',
  'Blazers':    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&h=500&fit=crop',
  'Accesorios': 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=400&h=500&fit=crop',
};

export default function CategoriasVisual() {
  const [categorias, setCategorias] = useState<string[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/api/categorias`)
      .then(r => r.json())
      .then(d => {
        const cats = (d.categorias || [])
          .map((c: any) => c.nombre)
          .filter((c: string) => c !== 'Lencería' && c !== 'Ropa Interior')
          .slice(0, 8);
        setCategorias(cats);
      })
      .catch(() => {});
  }, []);

  if (categorias.length === 0) return null;

  return (
    <View style={styles.wrap}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.eyebrow}>✦ EXPLORAR</Text>
        <Text style={styles.titulo}>Categorías</Text>
      </View>

      {/* Grid 2 columnas */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {categorias.map((cat) => {
          const imagen = IMAGENES_CATEGORIA[cat] ||
            'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=500&fit=crop';
          return (
            <TouchableOpacity
              key={cat}
              style={styles.card}
              onPress={() => router.push(`/(tabs)/catalogo?categoria=${encodeURIComponent(cat)}`)}
              activeOpacity={0.9}
            >
              <Image source={{ uri: imagen }} style={styles.imagen} resizeMode="cover" />
              <View style={styles.overlay} />
              <View style={styles.labelWrap}>
                <Text style={styles.label}>{cat}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const CARD_W = width * 0.36;
const CARD_H = CARD_W * 1.5;

const styles = StyleSheet.create({
  wrap: { marginBottom: SPACING.xl },
  header: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
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
  },
  scroll: {
    paddingHorizontal: SPACING.lg,
    gap: 10,
    paddingRight: SPACING.xxl,
  },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOW.sm,
  },
  imagen: { width: '100%', height: '100%' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  labelWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
  },
  label: {
    fontFamily: 'Prata-Regular',
    fontSize: 12,
    color: COLORS.blanco,
    textAlign: 'center',
  },
});
