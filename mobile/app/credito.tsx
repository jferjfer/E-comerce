import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Modal
} from 'react-native';
import { Stack, router } from 'expo-router';
import { COLORS, SPACING, RADIUS, SHADOW } from '@/constants';
import BtnVolver from '@/components/BtnVolver';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { API_URL } from '@/constants';

const fmt = (n: number) => '$' + Number(n).toLocaleString('es-CO');

const PLAZOS = [3, 6, 12, 24];

export default function CreditoScreen() {
  const { usuario, token } = useAuthStore();
  const addNotification = useNotificationStore(s => s.addNotification);

  const [evaluacion, setEvaluacion] = useState<any>(null);
  const [creditos, setCreditos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalSolicitud, setModalSolicitud] = useState(false);
  const [monto, setMonto] = useState(500000);
  const [plazo, setPlazo] = useState(6);
  const [solicitando, setSolicitando] = useState(false);

  useEffect(() => {
    if (!token || !usuario) return;
    cargar();
  }, [token]);

  const cargar = async () => {
    setCargando(true);
    try {
      // Evaluar crédito
      const resEval = await fetch(`${API_URL}/api/credito/evaluar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          usuario_id: parseInt(usuario!.id),
          fecha_registro: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
          total_compras_historico: (usuario as any).total_compras_historico || 0,
          numero_compras: (usuario as any).numero_compras || 0,
        }),
      });
      if (resEval.ok) setEvaluacion(await resEval.json());

      // Créditos activos
      const resCred = await fetch(`${API_URL}/api/credito/interno/usuario/${usuario!.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resCred.ok) {
        const d = await resCred.json();
        setCreditos(d.creditos || []);
      }
    } catch {}
    finally { setCargando(false); }
  };

  const solicitarCredito = async () => {
    if (!token || !usuario) return;
    setSolicitando(true);
    try {
      const res = await fetch(`${API_URL}/api/credito/interno/solicitar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          usuario_id: parseInt(usuario.id),
          monto_solicitado: monto,
          plazo_meses: plazo,
        }),
      });
      const data = await res.json();
      if (data.aprobado) {
        addNotification('¡Crédito aprobado exitosamente! 🎉', 'success');
        setModalSolicitud(false);
        cargar();
      } else {
        addNotification(data.razon || 'No se pudo aprobar el crédito', 'error');
      }
    } catch {
      addNotification('Error de conexión', 'error');
    } finally {
      setSolicitando(false); }
  };

  const cuotaMensual = Math.ceil(monto / plazo);

  if (cargando) return <ActivityIndicator color={COLORS.dorado} size="large" style={{ flex: 1 }} />;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <BtnVolver titulo="CRÉDITO EGOS" />

      {/* Header info */}
      <View style={styles.headerCard}>
        <Text style={styles.headerIcon}>💳</Text>
        <Text style={styles.headerTitulo}>Crédito EGOS</Text>
        <Text style={styles.headerSub}>Compra ahora y paga después en cómodas cuotas</Text>
      </View>

      {/* Estado de evaluación */}
      {evaluacion && (
        <View style={[styles.card, evaluacion.califica ? styles.cardVerde : styles.cardRojo]}>
          <Text style={styles.cardTitulo}>
            {evaluacion.califica ? '✅ Calificas para crédito' : '❌ No calificas actualmente'}
          </Text>
          {evaluacion.califica ? (
            <>
              <Text style={styles.cardDesc}>Límite aprobado:</Text>
              <Text style={styles.montoGrande}>{fmt(evaluacion.limite || 2000000)}</Text>
              <TouchableOpacity style={styles.btnSolicitar} onPress={() => setModalSolicitud(true)}>
                <Text style={styles.btnSolicitarTxt}>Solicitar crédito</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.cardDesc}>{evaluacion.razon || 'Realiza más compras para calificar.'}</Text>
          )}
        </View>
      )}

      {/* Cómo funciona */}
      <View style={styles.seccion}>
        <Text style={styles.seccionTitulo}>¿Cómo funciona?</Text>
        {[
          { n: '1', txt: 'Califica según tu historial de compras en EGOS' },
          { n: '2', txt: 'Solicita el monto que necesitas y elige tu plazo' },
          { n: '3', txt: 'Usa tu crédito al momento del pago en el checkout' },
          { n: '4', txt: 'Paga tu cuota mensual sin intereses' },
        ].map(item => (
          <View key={item.n} style={styles.pasoItem}>
            <View style={styles.pasoDot}>
              <Text style={styles.pasoNum}>{item.n}</Text>
            </View>
            <Text style={styles.pasoTxt}>{item.txt}</Text>
          </View>
        ))}
      </View>

      {/* Créditos activos */}
      {creditos.length > 0 && (
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Mis Créditos</Text>
          {creditos.map((c: any) => (
            <View key={c.id} style={[styles.creditoCard, SHADOW.sm]}>
              <View style={styles.creditoHeader}>
                <Text style={styles.creditoId}>Crédito #{String(c.id).slice(0, 8)}</Text>
                <View style={[styles.estadoBadge, { backgroundColor: c.estado === 'activo' ? '#ecfdf5' : '#f3f4f6' }]}>
                  <Text style={[styles.estadoTxt, { color: c.estado === 'activo' ? '#10b981' : COLORS.textoGrisMid }]}>
                    {c.estado}
                  </Text>
                </View>
              </View>
              <View style={styles.creditoDetalle}>
                <View style={styles.creditoItem}>
                  <Text style={styles.creditoLabel}>Monto total</Text>
                  <Text style={styles.creditoValor}>{fmt(c.monto_total || 0)}</Text>
                </View>
                <View style={styles.creditoItem}>
                  <Text style={styles.creditoLabel}>Saldo disponible</Text>
                  <Text style={[styles.creditoValor, { color: '#10b981' }]}>{fmt(c.saldo_disponible || 0)}</Text>
                </View>
                <View style={styles.creditoItem}>
                  <Text style={styles.creditoLabel}>Cuota mensual</Text>
                  <Text style={styles.creditoValor}>{fmt(c.cuota_mensual || 0)}</Text>
                </View>
                <View style={styles.creditoItem}>
                  <Text style={styles.creditoLabel}>Plazo</Text>
                  <Text style={styles.creditoValor}>{c.plazo_meses} meses</Text>
                </View>
              </View>
              {/* Barra de progreso */}
              <View style={styles.progresoBarra}>
                <View style={[styles.progresoRelleno, {
                  width: `${Math.max(5, ((c.saldo_disponible || 0) / (c.monto_total || 1)) * 100)}%` as any
                }]} />
              </View>
              <Text style={styles.progresoTxt}>
                {fmt(c.saldo_disponible || 0)} disponible de {fmt(c.monto_total || 0)}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 32 }} />

      {/* Modal solicitud */}
      <Modal visible={modalSolicitud} transparent animationType="slide" onRequestClose={() => setModalSolicitud(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitulo}>Solicitar Crédito</Text>

            {/* Monto */}
            <Text style={styles.modalLabel}>Monto a solicitar</Text>
            <View style={styles.montoSelector}>
              {[200000, 500000, 1000000, 2000000].map(m => (
                <TouchableOpacity
                  key={m}
                  style={[styles.montoBtn, monto === m && styles.montoBtnActivo]}
                  onPress={() => setMonto(m)}
                >
                  <Text style={[styles.montoBtnTxt, monto === m && styles.montoBtnTxtActivo]}>
                    {fmt(m)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Plazo */}
            <Text style={styles.modalLabel}>Plazo de pago</Text>
            <View style={styles.plazoSelector}>
              {PLAZOS.map(p => (
                <TouchableOpacity
                  key={p}
                  style={[styles.plazoBtn, plazo === p && styles.plazoBtnActivo]}
                  onPress={() => setPlazo(p)}
                >
                  <Text style={[styles.plazoBtnTxt, plazo === p && styles.plazoBtnTxtActivo]}>
                    {p} meses
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Resumen */}
            <View style={styles.resumenCredito}>
              <View style={styles.resumenRow}>
                <Text style={styles.resumenLabel}>Monto</Text>
                <Text style={styles.resumenValor}>{fmt(monto)}</Text>
              </View>
              <View style={styles.resumenRow}>
                <Text style={styles.resumenLabel}>Plazo</Text>
                <Text style={styles.resumenValor}>{plazo} meses</Text>
              </View>
              <View style={[styles.resumenRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.resumenLabel}>Cuota mensual aprox.</Text>
                <Text style={[styles.resumenValor, { color: COLORS.negro, fontWeight: '800' }]}>{fmt(cuotaMensual)}</Text>
              </View>
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, { borderWidth: 1, borderColor: COLORS.bordeMedio }]}
                onPress={() => setModalSolicitud(false)}
              >
                <Text style={{ color: COLORS.textoGrisMid }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: COLORS.dorado }, solicitando && { opacity: 0.7 }]}
                onPress={solicitarCredito}
                disabled={solicitando}
              >
                {solicitando
                  ? <ActivityIndicator color={COLORS.negro} size="small" />
                  : <Text style={{ color: COLORS.negro, fontWeight: '700' }}>Solicitar</Text>
                }
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
  headerCard: {
    backgroundColor: COLORS.negroHeader,
    padding: SPACING.xxl,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(197,164,126,0.2)',
  },
  headerIcon: { fontSize: 48, marginBottom: 12 },
  headerTitulo: { fontSize: 22, fontWeight: '800', color: COLORS.blanco, marginBottom: 6 },
  headerSub: { fontSize: 13, color: '#9ca3af', textAlign: 'center' },
  card: { margin: SPACING.lg, borderRadius: RADIUS.lg, padding: SPACING.lg, alignItems: 'center', borderWidth: 1 },
  cardVerde: { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' },
  cardRojo: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  cardTitulo: { fontSize: 16, fontWeight: '700', color: COLORS.textoNegro, marginBottom: 8 },
  cardDesc: { fontSize: 13, color: COLORS.textoGrisMid, textAlign: 'center', marginBottom: 12 },
  montoGrande: { fontSize: 32, fontWeight: '800', color: COLORS.negro, marginBottom: 16 },
  btnSolicitar: { backgroundColor: COLORS.negro, paddingHorizontal: 24, paddingVertical: 12, borderRadius: RADIUS.md },
  btnSolicitarTxt: { color: COLORS.dorado, fontWeight: '700', fontSize: 14 },
  seccion: { backgroundColor: COLORS.fondoCard, margin: SPACING.lg, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.bordeClaro },
  seccionTitulo: { fontSize: 15, fontWeight: '700', color: COLORS.textoNegro, marginBottom: 16 },
  pasoItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  pasoDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.negro, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  pasoNum: { color: COLORS.dorado, fontWeight: '700', fontSize: 13 },
  pasoTxt: { flex: 1, fontSize: 13, color: COLORS.textoGris, lineHeight: 20 },
  creditoCard: { backgroundColor: COLORS.fondoCard, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: 12, borderWidth: 1, borderColor: COLORS.bordeClaro },
  creditoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  creditoId: { fontSize: 13, fontWeight: '700', color: COLORS.textoNegro },
  estadoBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  estadoTxt: { fontSize: 11, fontWeight: '600' },
  creditoDetalle: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 14 },
  creditoItem: { flex: 1, minWidth: '40%' },
  creditoLabel: { fontSize: 11, color: COLORS.textoGrisSub, marginBottom: 2 },
  creditoValor: { fontSize: 14, fontWeight: '700', color: COLORS.textoNegro },
  progresoBarra: { height: 6, backgroundColor: COLORS.fondoGris, borderRadius: 3, marginBottom: 4, overflow: 'hidden' },
  progresoRelleno: { height: '100%', backgroundColor: '#10b981', borderRadius: 3 },
  progresoTxt: { fontSize: 11, color: COLORS.textoGrisSub, textAlign: 'right' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.fondoCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.xxl },
  modalTitulo: { fontSize: 18, fontWeight: '800', color: COLORS.textoNegro, marginBottom: 20 },
  modalLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textoGrisMid, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  montoSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  montoBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.bordeMedio, backgroundColor: COLORS.fondoGris },
  montoBtnActivo: { backgroundColor: COLORS.negro, borderColor: COLORS.negro },
  montoBtnTxt: { fontSize: 13, color: COLORS.textoGrisMid, fontWeight: '600' },
  montoBtnTxtActivo: { color: COLORS.dorado },
  plazoSelector: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  plazoBtn: { flex: 1, paddingVertical: 10, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.bordeMedio, alignItems: 'center', backgroundColor: COLORS.fondoGris },
  plazoBtnActivo: { backgroundColor: COLORS.negro, borderColor: COLORS.negro },
  plazoBtnTxt: { fontSize: 12, color: COLORS.textoGrisMid, fontWeight: '600' },
  plazoBtnTxtActivo: { color: COLORS.dorado },
  resumenCredito: { backgroundColor: COLORS.fondoGris, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: 20 },
  resumenRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: COLORS.bordeClaro },
  resumenLabel: { fontSize: 13, color: COLORS.textoGrisMid },
  resumenValor: { fontSize: 13, fontWeight: '600', color: COLORS.textoNegro },
  modalBtns: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: RADIUS.md, alignItems: 'center' },
});
