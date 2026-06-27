import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOW } from '@/constants';

const METODOS = [
  {
    id: 'tarjeta',
    nombre: 'Tarjeta de Crédito/Débito',
    icono: 'card' as const,
    descripcion: 'Visa, Mastercard, American Express',
    activo: true,
  },
  {
    id: 'pse',
    nombre: 'PSE',
    icono: 'business' as const,
    descripcion: 'Pago Seguro en Línea',
    activo: true,
  },
  {
    id: 'interno',
    nombre: 'Crédito Interno',
    icono: 'wallet' as const,
    descripcion: 'Financiación propia de la tienda',
    activo: true,
  },
];

export default function PagosScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Métodos disponibles */}
      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>Métodos Disponibles</Text>
        {METODOS.map(m => (
          <View key={m.id} style={styles.metodoCard}>
            <View style={styles.metodoIconWrap}>
              <Ionicons name={m.icono} size={22} color={COLORS.negro} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.metodoNombre}>{m.nombre}</Text>
              <Text style={styles.metodoDesc}>{m.descripcion}</Text>
            </View>
            <View style={[styles.badge, m.activo ? styles.badgeActivo : styles.badgeInactivo]}>
              <Text style={[styles.badgeTxt, { color: m.activo ? '#166534' : '#6b7280' }]}>
                {m.activo ? 'Activo' : 'Inactivo'}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Info */}
      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={18} color="#1d4ed8" style={{ marginTop: 2 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.infoTitulo}>Información Importante</Text>
          {[
            'Todas las transacciones son seguras y encriptadas',
            'No almacenamos información de tarjetas de crédito',
            'Puedes cambiar tu método de pago en cualquier momento',
            'Los pagos se procesan al momento del checkout',
          ].map((item, i) => (
            <Text key={i} style={styles.infoItem}>· {item}</Text>
          ))}
        </View>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  seccion: {
    backgroundColor: COLORS.fondoCard,
    margin: SPACING.lg,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.bordeClaro,
    ...SHADOW.sm,
  },
  seccionTitulo: { fontSize: 15, fontWeight: '700', color: COLORS.textoNegro, marginBottom: 14 },
  metodoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bordeClaro,
    gap: 12,
  },
  metodoIconWrap: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: '#f3f4f6',
    alignItems: 'center', justifyContent: 'center',
  },
  metodoNombre: { fontSize: 14, fontWeight: '600', color: COLORS.textoNegro },
  metodoDesc: { fontSize: 12, color: COLORS.textoGrisMid, marginTop: 2 },
  badge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  badgeActivo: { backgroundColor: '#dcfce7' },
  badgeInactivo: { backgroundColor: '#f3f4f6' },
  badgeTxt: { fontSize: 11, fontWeight: '700' },
  infoBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#eff6ff',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  infoTitulo: { fontSize: 13, fontWeight: '700', color: '#1e3a8a', marginBottom: 6 },
  infoItem: { fontSize: 12, color: '#1d4ed8', lineHeight: 20 },
});
