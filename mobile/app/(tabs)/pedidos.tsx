import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
  Modal, Alert
} from 'react-native';
import { router } from 'expo-router';
import { COLORS, SPACING, RADIUS, SHADOW } from '@/constants';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/useAuthStore';
import { API_URL } from '@/constants';

const ESTADO_COLORES: Record<string, string> = {
  Creado: '#6b7280', Confirmado: '#3b82f6', Alistado: '#f59e0b',
  'En Camino': '#8b5cf6', Entregado: '#10b981', Cancelado: '#ef4444',
  Devuelto: '#f97316', 'Devolucion Procesada': '#14b8a6',
};
const ESTADO_ICONOS: Record<string, string> = {
  Creado: '📋', Confirmado: '✅', Alistado: '📦',
  'En Camino': '🚚', Entregado: '🎉', Cancelado: '❌',
  Devuelto: '↩️', 'Devolucion Procesada': '💚',
};
const MOTIVOS = [
  'Producto defectuoso o dañado', 'Talla o color incorrecto',
  'No coincide con la descripción', 'Llegó tarde',
  'Ya no lo necesito', 'Otro motivo',
];
const fmt = (n: number) => '$' + Number(n).toLocaleString('es-CO');

export default function PedidosScreen() {
  const { token } = useAuthStore();
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [historial, setHistorial] = useState<any[]>([]);
  const [modalDev, setModalDev] = useState(false);
  const [pedidoDev, setPedidoDev] = useState<string | null>(null);
  const [motivo, setMotivo] = useState('');
  const [devoluciones, setDevoluciones] = useState<Record<string, any>>({});

  const cargar = useCallback(async () => {
    if (!token) {
      console.warn('⚠️ [Pedidos] No hay token, cancelando carga');
      setCargando(false);
      return;
    }
    console.log('📦 [Pedidos] Iniciando carga...');
    try {
      console.log('📦 [Pedidos] Llamando api.getPedidos...');
      const data = await api.getPedidos(token);
      console.log('📦 [Pedidos] Respuesta API:', JSON.stringify(data).slice(0, 200));
      const lista = data.pedidos || [];
      console.log('📦 [Pedidos] Total pedidos:', lista.length);
      setPedidos(lista);
      setCargando(false);
      console.log('📦 [Pedidos] setCargando(false) ejecutado');
      // Cargar devoluciones en paralelo
      console.log('📦 [Pedidos] Cargando devoluciones en paralelo...');
      const resultados = await Promise.allSettled(
        lista.map((p: any) =>
          fetch(`${API_URL}/api/pedidos/${p.id}/devolucion`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then(res => res.ok ? res.json() : null).catch(() => null)
        )
      );
      console.log('📦 [Pedidos] Devoluciones cargadas');
      const devs: Record<string, any> = {};
      lista.forEach((p: any, i: number) => {
        const r = resultados[i];
        if (r.status === 'fulfilled' && r.value?.devolucion) {
          devs[p.id] = r.value.devolucion;
        }
      });
      setDevoluciones(devs);
    } catch (e: any) {
      console.error('❌ [Pedidos] ERROR:', e?.message || e);
      setCargando(false);
    } finally {
      setRefreshing(false);
      console.log('📦 [Pedidos] Carga finalizada');
    }
  }, [token]);

  useEffect(() => { cargar(); }, [cargar]);

  const verHistorial = async (pedidoId: string) => {
    if (expandido === pedidoId) { setExpandido(null); return; }
    setExpandido(pedidoId);
    try {
      const res = await fetch(`${API_URL}/api/pedidos/${pedidoId}/historial`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      setHistorial(d.historial || []);
    } catch {}
  };

  const confirmarDevolucion = async () => {
    if (!token || !pedidoDev || !motivo) return;
    const res = await api.solicitarDevolucion(token, pedidoDev, motivo);
    if (res.error) { Alert.alert('Error', res.error); return; }
    Alert.alert('✅', 'Solicitud enviada exitosamente');
    setModalDev(false); setMotivo('');
    cargar();
  };

  if (!token) {
    return (
      <View style={styles.centro}>
        <Text style={{ fontSize: 64, marginBottom: 16 }}>🔐</Text>
        <Text style={styles.centroTitulo}>Inicia sesión</Text>
        <Text style={styles.centroSub}>para ver tus pedidos</Text>
        <TouchableOpacity style={styles.btnPrimario} onPress={() => router.push('/login')}>
          <Text style={styles.btnPrimarioTxt}>Iniciar Sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (cargando) return <ActivityIndicator color={COLORS.dorado} size="large" style={{ flex: 1 }} />;

  if (pedidos.length === 0) {
    return (
      <View style={styles.centro}>
        <Text style={{ fontSize: 64, marginBottom: 16 }}>📦</Text>
        <Text style={styles.centroTitulo}>Sin pedidos aún</Text>
        <Text style={styles.centroSub}>¡Realiza tu primera compra!</Text>
        <TouchableOpacity style={styles.btnPrimario} onPress={() => router.push('/(tabs)/catalogo')}>
          <Text style={styles.btnPrimarioTxt}>Ver Catálogo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); cargar(); }} tintColor={COLORS.dorado} />}
    >
      <View style={styles.lista}>
        {pedidos.map(pedido => {
          const color = ESTADO_COLORES[pedido.estado] || '#6b7280';
          const icono = ESTADO_ICONOS[pedido.estado] || '📋';
          const abierto = expandido === pedido.id;

          return (
            <View key={pedido.id} style={styles.card}>
              {/* Header */}
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.pedidoId}>#{String(pedido.id).slice(0, 12)}</Text>
                  <Text style={styles.pedidoFecha}>
                    {new Date(pedido.fecha_creacion).toLocaleDateString('es-CO', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </Text>
                </View>
                <View style={[styles.estadoBadge, { backgroundColor: color + '20' }]}>
                  <Text style={{ fontSize: 12 }}>{icono}</Text>
                  <Text style={[styles.estadoTxt, { color }]}>{pedido.estado}</Text>
                </View>
              </View>

              {/* Productos preview */}
              {(pedido.productos || []).slice(0, 2).map((p: any, i: number) => (
                <Text key={i} style={styles.prodLinea} numberOfLines={1}>
                  · {p.nombre} × {p.cantidad}
                </Text>
              ))}
              {(pedido.productos?.length || 0) > 2 && (
                <Text style={styles.masProd}>+{pedido.productos.length - 2} más</Text>
              )}

              {/* Footer total */}
              <View style={styles.cardFooter}>
                <Text style={styles.total}>{fmt(pedido.total)}</Text>
              </View>

              {/* Acciones */}
              <View style={styles.acciones}>
                <TouchableOpacity style={styles.accionBtn} onPress={() => verHistorial(pedido.id)}>
                  <Text style={styles.accionTxt}>{abierto ? '▲ Ocultar' : '▼ Ver seguimiento'}</Text>
                </TouchableOpacity>
                {!devoluciones[pedido.id] && pedido.estado !== 'Cancelado' && (
                  <TouchableOpacity
                    style={styles.accionBtn}
                    onPress={() => { setPedidoDev(pedido.id); setModalDev(true); }}
                  >
                    <Text style={[styles.accionTxt, { color: '#f97316' }]}>↩ Devolución</Text>
                  </TouchableOpacity>
                )}
                {devoluciones[pedido.id] && (
                  <Text style={[styles.accionTxt, { color: '#6b7280' }]}>
                    Devolución: <Text style={{ color: '#f97316' }}>{devoluciones[pedido.id].estado}</Text>
                  </Text>
                )}
              </View>

              {/* Historial expandido */}
              {abierto && historial.length > 0 && (
                <View style={styles.historial}>
                  <Text style={styles.historialTitulo}>Seguimiento</Text>
                  {historial.map((h, i) => (
                    <View key={i} style={styles.historialItem}>
                      <View style={[styles.historialDot, { backgroundColor: ESTADO_COLORES[h.estado_nuevo] || COLORS.negro }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.historialEstado}>{h.estado_anterior} → {h.estado_nuevo}</Text>
                        {h.comentario ? <Text style={styles.historialComentario}>{h.comentario}</Text> : null}
                        <Text style={styles.historialFecha}>
                          {new Date(h.fecha_cambio).toLocaleString('es-CO')}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </View>
      <View style={{ height: 24 }} />

      {/* Modal devolución */}
      <Modal visible={modalDev} transparent animationType="slide" onRequestClose={() => setModalDev(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitulo}>↩ Solicitar Devolución</Text>
            <Text style={styles.modalSub}>Selecciona el motivo:</Text>
            {MOTIVOS.map(m => (
              <TouchableOpacity key={m} style={styles.motivoRow} onPress={() => setMotivo(m)}>
                <View style={[styles.radio, motivo === m && styles.radioActivo]}>
                  {motivo === m && <View style={styles.radioPunto} />}
                </View>
                <Text style={styles.motivoTxt}>{m}</Text>
              </TouchableOpacity>
            ))}
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, { borderWidth: 1, borderColor: COLORS.bordeMedio }]}
                onPress={() => { setModalDev(false); setMotivo(''); }}
              >
                <Text style={{ color: COLORS.textoGrisMid }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#f97316' }, !motivo && { opacity: 0.4 }]}
                onPress={confirmarDevolucion}
                disabled={!motivo}
              >
                <Text style={{ color: COLORS.blanco, fontWeight: '700' }}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.fondoPagina },
  lista: { padding: SPACING.lg, gap: 12 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: COLORS.fondoPagina },
  centroTitulo: { fontSize: 18, fontWeight: '700', color: COLORS.textoNegro, marginBottom: 8 },
  centroSub: { fontSize: 14, color: COLORS.textoGrisMid, marginBottom: 24 },
  btnPrimario: { backgroundColor: COLORS.negro, paddingHorizontal: 24, paddingVertical: 14, borderRadius: RADIUS.md },
  btnPrimarioTxt: { color: COLORS.dorado, fontWeight: '700', fontSize: 15 },
  card: {
    backgroundColor: COLORS.fondoCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.bordeClaro,
    ...SHADOW.sm,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  pedidoId: { fontSize: 13, fontWeight: '700', color: COLORS.textoNegro, fontVariant: ['tabular-nums'] },
  pedidoFecha: { fontSize: 11, color: COLORS.textoGrisMid, marginTop: 2 },
  estadoBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full, gap: 4 },
  estadoTxt: { fontSize: 12, fontWeight: '600' },
  prodLinea: { fontSize: 12, color: COLORS.textoGrisMid, marginBottom: 2 },
  masProd: { fontSize: 11, color: COLORS.textoGrisSub, marginTop: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.bordeClaro },
  total: { fontSize: 16, fontWeight: '800', color: COLORS.negro },
  acciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 },
  accionBtn: {},
  accionTxt: { fontSize: 12, fontWeight: '600', color: COLORS.negro },
  historial: { marginTop: 12, backgroundColor: COLORS.fondoGris, borderRadius: RADIUS.md, padding: 12 },
  historialTitulo: { fontSize: 13, fontWeight: '700', color: COLORS.textoNegro, marginBottom: 10 },
  historialItem: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  historialDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4, flexShrink: 0 },
  historialEstado: { fontSize: 12, fontWeight: '600', color: COLORS.textoNegro },
  historialComentario: { fontSize: 11, color: COLORS.textoGrisMid, marginTop: 2 },
  historialFecha: { fontSize: 10, color: COLORS.textoGrisSub, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.fondoCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.xxl },
  modalTitulo: { fontSize: 18, fontWeight: '700', color: COLORS.textoNegro, marginBottom: 6 },
  modalSub: { fontSize: 13, color: COLORS.textoGrisMid, marginBottom: 16 },
  motivoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.bordeClaro },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: COLORS.bordeMedio, alignItems: 'center', justifyContent: 'center' },
  radioActivo: { borderColor: COLORS.negro },
  radioPunto: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.negro },
  motivoTxt: { fontSize: 13, color: COLORS.textoGris, flex: 1 },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 20 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: RADIUS.md, alignItems: 'center' },
});
