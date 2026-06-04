import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Image, StyleSheet, Alert
} from 'react-native';
import { router } from 'expo-router';
import { COLORS, SPACING, RADIUS, SHADOW } from '@/constants';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';

export default function CarritoScreen() {
  const { items, eliminarItem, actualizarCantidad, totalPrecio, vaciarCarrito } = useCartStore();
  const { estaAutenticado } = useAuthStore();

  if (items.length === 0) {
    return (
      <View style={styles.vacio}>
        <Text style={styles.vacioIcon}>🛒</Text>
        <Text style={styles.vacioTitulo}>Tu carrito está vacío</Text>
        <Text style={styles.vacioSub}>Agrega productos para comenzar</Text>
        <TouchableOpacity style={styles.btnVerCatalogo} onPress={() => router.push('/(tabs)/catalogo')}>
          <Text style={styles.btnVerCatalogoTxt}>Ver Catálogo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleCheckout = () => {
    if (!estaAutenticado) {
      router.push('/login');
      return;
    }
    router.push('/checkout');
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Items */}
        <View style={styles.items}>
          {items.map((item) => (
            <View key={`${item.id}-${item.talla}-${item.color}`} style={styles.item}>
              <Image source={{ uri: item.imagen }} style={styles.itemImg} resizeMode="cover" />
              <View style={styles.itemInfo}>
                <Text style={styles.itemNombre} numberOfLines={2}>{item.nombre}</Text>
                {item.talla && <Text style={styles.itemVariante}>Talla: {item.talla}</Text>}
                {item.color && <Text style={styles.itemVariante}>Color: {item.color}</Text>}
                <Text style={styles.itemPrecio}>${item.precio.toLocaleString('es-CO')}</Text>
                {/* Cantidad */}
                <View style={styles.cantidadRow}>
                  <TouchableOpacity
                    style={styles.cantBtn}
                    onPress={() => actualizarCantidad(item.id, item.cantidad - 1)}
                  >
                    <Text style={styles.cantBtnTxt}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.cantidad}>{item.cantidad}</Text>
                  <TouchableOpacity
                    style={styles.cantBtn}
                    onPress={() => actualizarCantidad(item.id, item.cantidad + 1)}
                  >
                    <Text style={styles.cantBtnTxt}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity
                style={styles.eliminarBtn}
                onPress={() => eliminarItem(item.id)}
              >
                <Text style={styles.eliminarTxt}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Resumen */}
        <View style={styles.resumen}>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Subtotal</Text>
            <Text style={styles.resumenValor}>${totalPrecio().toLocaleString('es-CO')}</Text>
          </View>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Envío</Text>
            <Text style={[styles.resumenValor, { color: '#10b981' }]}>Gratis</Text>
          </View>
          <View style={[styles.resumenRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValor}>${totalPrecio().toLocaleString('es-CO')}</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Botón Checkout fijo */}
      <View style={styles.checkoutBar}>
        <TouchableOpacity style={styles.btnVaciar} onPress={() => {
          Alert.alert('Vaciar carrito', '¿Estás seguro?', [
            { text: 'Cancelar' },
            { text: 'Vaciar', onPress: vaciarCarrito, style: 'destructive' }
          ]);
        }}>
          <Text style={styles.btnVaciarTxt}>Vaciar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnCheckout} onPress={handleCheckout}>
          <Text style={styles.btnCheckoutTxt}>
            Finalizar compra · ${totalPrecio().toLocaleString('es-CO')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.fondoPagina },

  vacio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: COLORS.fondoPagina,
  },
  vacioIcon: { fontSize: 64, marginBottom: 16 },
  vacioTitulo: { fontSize: 18, fontWeight: '700', color: COLORS.textoNegro, marginBottom: 8 },
  vacioSub: { fontSize: 14, color: COLORS.textoGrisMid, marginBottom: 24 },
  btnVerCatalogo: {
    backgroundColor: COLORS.negro,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
  },
  btnVerCatalogoTxt: { color: COLORS.dorado, fontWeight: '700', fontSize: 15 },

  items: { padding: SPACING.lg, gap: 12 },
  item: {
    backgroundColor: COLORS.fondoCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: COLORS.bordeClaro,
    ...SHADOW.sm,
  },
  itemImg: {
    width: 80,
    height: 100,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.fondoGris,
  },
  itemInfo: { flex: 1, paddingHorizontal: 12, justifyContent: 'space-between' },
  itemNombre: { fontSize: 13, fontWeight: '600', color: COLORS.textoNegro, lineHeight: 18 },
  itemVariante: { fontSize: 11, color: COLORS.textoGrisMid },
  itemPrecio: { fontSize: 15, fontWeight: '700', color: COLORS.negro },
  cantidadRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  cantBtn: {
    width: 28, height: 28,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.bordeMedio,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.fondoGris,
  },
  cantBtnTxt: { fontSize: 16, color: COLORS.textoNegro, fontWeight: '600' },
  cantidad: { fontSize: 14, fontWeight: '700', color: COLORS.textoNegro, minWidth: 20, textAlign: 'center' },
  eliminarBtn: {
    padding: 4,
    alignSelf: 'flex-start',
  },
  eliminarTxt: { fontSize: 16, color: COLORS.textoGrisSub },

  resumen: {
    margin: SPACING.lg,
    backgroundColor: COLORS.fondoCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.bordeClaro,
  },
  resumenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bordeClaro,
  },
  resumenLabel: { fontSize: 14, color: COLORS.textoGrisMid },
  resumenValor: { fontSize: 14, fontWeight: '600', color: COLORS.textoNegro },
  totalRow: { borderBottomWidth: 0, paddingTop: 12 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: COLORS.textoNegro },
  totalValor: { fontSize: 18, fontWeight: '800', color: COLORS.negro },

  checkoutBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: SPACING.lg,
    backgroundColor: COLORS.fondoCard,
    borderTopWidth: 1,
    borderTopColor: COLORS.bordeClaro,
    gap: 12,
    ...SHADOW.lg,
  },
  btnVaciar: {
    borderWidth: 1,
    borderColor: COLORS.bordeMedio,
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnVaciarTxt: { fontSize: 13, color: COLORS.textoGrisMid },
  btnCheckout: {
    flex: 1,
    backgroundColor: COLORS.negro,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnCheckoutTxt: { color: COLORS.dorado, fontWeight: '700', fontSize: 14 },
});
