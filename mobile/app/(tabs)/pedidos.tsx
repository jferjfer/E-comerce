import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl
} from 'react-native';
import { router } from 'expo-router';
import { COLORS, SPACING, RADIUS, SHADOW } from '@/constants';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/useAuthStore';

const ESTADO_COLORES: Record<string, string> = {
  Creado:    '#6b7280',
  Confirmado:'#3b82f6',
  Alistado:  '#f59e0b',
  'En Camino':'#8b5cf6',
  Entregado: '#10b981',
  Cancelado: '#ef4444',
};

const ESTADO_ICONOS: Record<string, string> = {
  Creado:    '📋',
  Confirmado:'✅',
  Alistado:  '📦',
  'En Camino':'🚚',
  Entregado: '🎉',
  Cancelado: '❌',
};

export default function PedidosScreen() {
  const { token, estaAutenticado } = useAuthStore();
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cargar = async () => {
    if (!token) return;
    try {
      const data = await api.getPedidos(token);
      setPedidos(data.pedidos || []);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { cargar(); }, [token]);

  if (!estaAutenticado) {
    return (
      <View style={styles.noAuth}>
        <Text style={styles.noAuthIcon}>🔐</Text>
        <Text style={styles.noAuthTitulo}>Inicia sesión</Text>
        <Text style={styles.noAuthSub}>para ver tus pedidos</Text>
        <TouchableOpacity style={styles.btnLogin} onPress={() => router.push('/login')}>
          <Text style={styles.btnLoginTxt}>Iniciar Sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (cargando) {
    return <ActivityIndicator color={COLORS.dorado} size="large" style={{ flex: 1 }} />;
  }

  if (pedidos.length === 0) {
    return (
      <View style={styles.noAuth}>
        <Text style={styles.noAuthIcon}>📦</Text>
        <Text style={styles.noAuthTitulo}>Sin pedidos aún</Text>
        <Text style={styles.noAuthSub}>Realiza tu primera compra</Text>
        <TouchableOpacity style={styles.btnLogin} onPress={() => router.push('/(tabs)/')}>
          <Text style={styles.btnLoginTxt}>Ir al catálogo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); cargar(); }}
          tintColor={COLORS.dorado}
        />
      }
    >
      <View style={styles.lista}>
        {pedidos.map((pedido) => (
          <View key={pedido.id} style={styles.card}>
            {/* Header pedido */}
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.pedidoId}>#{pedido.id}</Text>
                <Text style={styles.pedidoFecha}>
                  {new Date(pedido.fecha_creacion).toLocaleDateString('es-CO', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </Text>
              </View>
              <View style={[styles.estadoBadge, { backgroundColor: (ESTADO_COLORES[pedido.estado] || '#6b7280') + '20' }]}>
                <Text style={styles.estadoIcon}>{ESTADO_ICONOS[pedido.estado] || '📋'}</Text>
                <Text style={[styles.estadoTxt, { color: ESTADO_COLORES[pedido.estado] || '#6b7280' }]}>
                  {pedido.estado}
                </Text>
              </View>
            </View>

            {/* Productos */}
            {pedido.productos?.slice(0, 2).map((p: any, i: number) => (
              <Text key={i} style={styles.productoLinea} numberOfLines={1}>
                · {p.nombre} × {p.cantidad}
              </Text>
            ))}
            {pedido.productos?.length > 2 && (
              <Text style={styles.masProductos}>+{pedido.productos.length - 2} más</Text>
            )}

            {/* Footer */}
            <View style={styles.cardFooter}>
              <Text style={styles.total}>${Number(pedido.total).toLocaleString('es-CO')}</Text>
            </View>
          </View>
        ))}
      </View>
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.fondoPagina },
  lista: { padding: SPACING.lg, gap: 12 },

  noAuth: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: COLORS.fondoPagina,
  },
  noAuthIcon: { fontSize: 64, marginBottom: 16 },
  noAuthTitulo: { fontSize: 18, fontWeight: '700', color: COLORS.textoNegro, marginBottom: 8 },
  noAuthSub: { fontSize: 14, color: COLORS.textoGrisMid, marginBottom: 24 },
  btnLogin: {
    backgroundColor: COLORS.negro,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
  },
  btnLoginTxt: { color: COLORS.dorado, fontWeight: '700', fontSize: 15 },

  card: {
    backgroundColor: COLORS.fondoCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.bordeClaro,
    ...SHADOW.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  pedidoId: { fontSize: 14, fontWeight: '700', color: COLORS.textoNegro },
  pedidoFecha: { fontSize: 12, color: COLORS.textoGrisMid, marginTop: 2 },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  estadoIcon: { fontSize: 12 },
  estadoTxt: { fontSize: 12, fontWeight: '600' },
  productoLinea: { fontSize: 13, color: COLORS.textoGrisMid, marginBottom: 2 },
  masProductos: { fontSize: 12, color: COLORS.textoGrisSub, marginTop: 2 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.bordeClaro,
  },
  total: { fontSize: 16, fontWeight: '800', color: COLORS.negro },
});
