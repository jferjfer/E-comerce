import React from 'react';
import {
  View, Text, Image, TouchableOpacity,
  StyleSheet, Dimensions
} from 'react-native';
import { router } from 'expo-router';
import { COLORS, RADIUS, SHADOW, SPACING } from '@/constants';
import { Producto } from '@/types';
import { useCartStore } from '@/store/useCartStore';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - SPACING.lg * 2 - SPACING.sm) / 2;

interface Props {
  producto: Producto;
  onVerDetalles?: (p: Producto) => void;
}

export default function ProductCard({ producto, onVerDetalles }: Props) {
  const agregarItem = useCartStore(s => s.agregarItem);
  const [agregando, setAgregando] = React.useState(false);

  const handleAgregar = () => {
    if (!producto.en_stock) return;
    setAgregando(true);
    agregarItem(producto);
    setTimeout(() => setAgregando(false), 800);
  };

  const renderEstrellas = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <Text key={i} style={{ fontSize: 9, color: i < Math.round(rating) ? '#f59e0b' : COLORS.bordeClaro }}>
        ★
      </Text>
    ));

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onVerDetalles ? onVerDetalles(producto) : router.push(`/producto/${producto.id}`)}
      activeOpacity={0.95}
    >
      {/* Imagen */}
      <View style={styles.imagenContainer}>
        <Image
          source={{ uri: producto.imagen }}
          style={styles.imagen}
          resizeMode="cover"
        />
        {!producto.en_stock && (
          <View style={styles.agotadoOverlay}>
            <Text style={styles.agotadoTxt}>Agotado</Text>
          </View>
        )}
        {producto.es_eco && (
          <View style={styles.ecoBadge}>
            <Text style={styles.ecoBadgeTxt}>🌿 Eco</Text>
          </View>
        )}
      </View>

      {/* Contenido */}
      <View style={styles.contenido}>
        {/* Categoría + estrellas */}
        <View style={styles.categoriaRow}>
          <Text style={styles.categoria} numberOfLines={1}>
            {producto.categoria}
          </Text>
          <View style={styles.estrellas}>
            {renderEstrellas(producto.calificacion)}
          </View>
        </View>

        {/* Nombre */}
        <Text style={styles.nombre} numberOfLines={2}>
          {producto.nombre}
        </Text>

        {/* Precio */}
        <Text style={styles.precio}>
          ${producto.precio.toLocaleString('es-CO')}
        </Text>

        {/* Botón */}
        <TouchableOpacity
          style={[
            styles.btnAgregar,
            !producto.en_stock && styles.btnAgotado,
            agregando && styles.btnAgregado,
          ]}
          onPress={handleAgregar}
          disabled={!producto.en_stock || agregando}
        >
          <Text style={styles.btnTxt}>
            {agregando ? '✓ Agregado' : !producto.en_stock ? 'No disponible' : 'Agregar'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.fondoCard,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.bordeClaro,
    marginBottom: SPACING.sm,
    ...SHADOW.sm,
  },
  imagenContainer: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: COLORS.fondoGris,
    position: 'relative',
  },
  imagen: {
    width: '100%',
    height: '100%',
  },
  agotadoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  agotadoTxt: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    color: COLORS.textoNegro,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  ecoBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#10b981',
    borderRadius: RADIUS.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ecoBadgeTxt: {
    color: COLORS.blanco,
    fontSize: 9,
    fontWeight: '700',
  },
  contenido: {
    padding: SPACING.sm + 2,
    gap: 4,
  },
  categoriaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoria: {
    fontSize: 9,
    color: COLORS.textoGrisSub,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '500',
    flex: 1,
  },
  estrellas: {
    flexDirection: 'row',
    gap: 1,
  },
  nombre: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textoNegro,
    lineHeight: 16,
  },
  precio: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.negro,
  },
  btnAgregar: {
    backgroundColor: COLORS.negro,
    borderRadius: RADIUS.md,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 2,
  },
  btnAgotado: {
    backgroundColor: COLORS.fondoGris,
  },
  btnAgregado: {
    backgroundColor: '#10b981',
  },
  btnTxt: {
    color: COLORS.blanco,
    fontSize: 11,
    fontWeight: '600',
  },
});

export { CARD_WIDTH };
