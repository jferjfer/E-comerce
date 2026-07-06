import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, TextInput,
  Image, Modal
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Stack, router } from 'expo-router';
import BtnVolver from '@/components/BtnVolver';
import { COLORS, SPACING, RADIUS, SHADOW } from '@/constants';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { api } from '@/services/api';
import { API_URL } from '@/constants';
import { haptic } from '@/hooks/useHaptics';
import { safeLog, safeError } from '@/utils/security';

const fmt = (n: number) => '$' + n.toLocaleString('es-CO');

// ── Indicador de pasos igual al web ─────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <View style={step.wrap}>
      {Array.from({ length: total }, (_, i) => i + 1).map((s, i, arr) => (
        <React.Fragment key={s}>
          <View style={[step.circle, s <= current && step.circleActivo]}>
            {s < current
              ? <Text style={step.txt}>✓</Text>
              : <Text style={[step.txt, s === current && { color: COLORS.negro }]}>{s}</Text>
            }
          </View>
          {i < arr.length - 1 && (
            <View style={[step.linea, s < current && step.lineaActivo]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}
const step = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  circle: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 2, borderColor: COLORS.bordeMedio,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.fondoCard,
  },
  circleActivo: { backgroundColor: COLORS.dorado, borderColor: COLORS.dorado },
  txt: { fontSize: 13, fontWeight: '700', color: COLORS.textoGrisMid },
  linea: { flex: 1, height: 2, backgroundColor: COLORS.bordeMedio, maxWidth: 60 },
  lineaActivo: { backgroundColor: COLORS.dorado },
});

// BUG-16 FIX: escapar strings para interpolación segura en HTML/JS
function escJS(s: any): string {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")  // comillas simples
    .replace(/"/g, '\\"')  // comillas dobles
    .replace(/\n/g, '\\n') // saltos de línea
    .replace(/\r/g, '\\r')
    .replace(/`/g, '\\`')  // backticks
    .replace(/<\/script>/gi, '<\/script>'); // cierre de script
}

// ── Widget ePayco en WebView ─────────────────────────────────
function EpaycoWebView({
  datosWidget,
  metodoPago,
  orderId,
  token,
  onExito,
  onError,
  onCancelado,
  onCerrar,
}: {
  datosWidget: any;
  metodoPago: string;
  orderId: string | null;
  token: string | null;
  onExito: () => void;
  onError: (msg: string) => void;
  onCancelado: () => void;
  onCerrar: () => void;
}) {
  const [cargando, setCargando] = useState(true);
  const [errorWebView, setErrorWebView] = useState<string | null>(null);

  // URL directa al checkout de ePayco con los datos como query params
  // ePayco tiene un endpoint que acepta los datos y abre el widget
  const checkoutUrl = `https://checkout.epayco.co/checkout.js`;

  // HTML con baseUrl para que los scripts externos carguen correctamente
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <base href="https://checkout.epayco.co/">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #111827; min-height: 100vh; font-family: sans-serif; }
    #loading { color: #c5a47e; text-align: center; padding: 60px 40px; }
    #err { color: #ef4444; text-align: center; padding: 40px; font-size: 14px; display:none; }
  </style>
</head>
<body>
  <div id="loading">
    <svg width="40" height="40" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="16" stroke="#c5a47e" stroke-width="3" stroke-dasharray="80" stroke-dashoffset="60">
        <animateTransform attributeName="transform" type="rotate" from="0 20 20" to="360 20 20" dur="1s" repeatCount="indefinite"/>
      </circle>
    </svg>
    <p style="color:#c5a47e;margin-top:16px;font-size:14px">Cargando pasarela de pago...</p>
  </div>
  <div id="err"></div>

  <script src="https://checkout.epayco.co/checkout.js"></script>
  <script>
    function log(m) { window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({type:'log',msg:m})); }
    function err(m) {
      document.getElementById('loading').style.display='none';
      document.getElementById('err').style.display='block';
      document.getElementById('err').textContent=m;
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({type:'error',msg:m}));
    }

    function abrir() {
      if (!window.ePayco || !window.ePayco.checkout) { err('ePayco no carg\u00f3. Verifica tu conexi\u00f3n.'); return; }
      try {
        // BUG-16 FIX: todos los valores ya vienen escapados con escJS()
        var h = window.ePayco.checkout.configure({ key:'${escJS(datosWidget.public_key)}', test:${datosWidget.test} });
        document.getElementById('loading').style.display='none';
        log('Abriendo widget...');
        var params = {
          name:'${escJS(datosWidget.name)}',description:'${escJS(datosWidget.description)}',
          invoice:'${escJS(datosWidget.invoice)}',currency:'${escJS(datosWidget.currency)}',
          amount:'${escJS(datosWidget.amount)}',tax_base:'${escJS(datosWidget.tax_base)}',tax:'${escJS(datosWidget.tax)}',
          country:'${escJS(datosWidget.country)}',lang:'${escJS(datosWidget.lang)}',
          response:'${escJS(datosWidget.response)}',confirmation:'${escJS(datosWidget.confirmation)}',
          name_billing:'${escJS(datosWidget.name_billing)}',address_billing:'${escJS(datosWidget.address_billing)}',
          type_doc_billing:'${escJS(datosWidget.type_doc_billing)}',mobilephone_billing:'${escJS(datosWidget.mobilephone_billing)}',
          number_doc_billing:'${escJS(datosWidget.number_doc_billing)}',email_billing:'${escJS(datosWidget.email_billing)}',
          extra1:'${escJS(datosWidget.extra1)}',extra2:'${escJS(datosWidget.extra2)}',extra3:'${escJS(datosWidget.extra3)}'
        };
        var metodo = '${escJS(metodoPago)}';
        if(metodo==='pse')       { params.p_type_doc_billing='PSE';       params.p_type_doc='PSE'; }
        if(metodo==='efectivo')  { params.p_type_doc_billing='CASH';      params.p_type_doc='CASH'; }
        if(metodo==='nequi')     { params.p_type_doc_billing='NEQUI';     params.p_type_doc='NEQUI'; }
        if(metodo==='daviplata') { params.p_type_doc_billing='DAVIPLATA'; params.p_type_doc='DAVIPLATA'; }
        h.open(params);
        log('handler.open() OK');
      } catch(e){ err('Error: '+e.message); }
    }

    // Esperar a que checkout.js cargue
    var intentos = 0;
    var poll = setInterval(function() {
      intentos++;
      log('Poll '+intentos+': ePayco='+(typeof window.ePayco));
      if (window.ePayco && window.ePayco.checkout) {
        clearInterval(poll);
        abrir();
      } else if (intentos > 15) {
        clearInterval(poll);
        err('Tiempo de espera agotado. Verifica tu conexi\u00f3n a internet.');
      }
    }, 500);

    // Escuchar respuesta
    window.addEventListener('message', function(e) {
      try {
        // El web verifica el origen: solo aceptar de checkout.epayco.co
        if (e.origin && e.origin !== 'https://checkout.epayco.co' && e.origin !== '') return;
        var d = typeof e.data==='string' ? JSON.parse(e.data) : e.data;
        if (!d || (!d.x_response && !d.x_response_code_transaction)) return;
        log('Respuesta ePayco: x_response=' + d.x_response + ' codigo=' + d.x_response_code_transaction);
        var c = String(d.x_response_code_transaction || '');
        var r = d.x_response || '';
        var m = d.x_response_reason_text || '';
        if (r==='Aceptada' || c==='1') {
          window.ReactNativeWebView.postMessage(JSON.stringify({type:'exito'}));
        } else if (r==='Cancelada') {
          window.ReactNativeWebView.postMessage(JSON.stringify({type:'cancelado'}));
        } else if (r==='Pendiente' || c==='3' || c==='7') {
          var msg3 = 'Tu pago est\u00e1 pendiente de confirmaci\u00f3n. ' + (m ? m + '.' : 'Recibir\u00e1s un correo cuando sea aprobado.');
          window.ReactNativeWebView.postMessage(JSON.stringify({type:'pendiente', msg: msg3}));
        } else if (r==='Rechazada' || c==='2') {
          var msg2 = 'Pago rechazado: ' + (m || 'Pago rechazado') + '. Verifica los datos de tu tarjeta o intenta con otro m\u00e9todo.';
          window.ReactNativeWebView.postMessage(JSON.stringify({type:'error', msg: msg2}));
        } else if (r==='Fallida' || c==='4') {
          var msg4 = 'Pago fallido: ' + (m || 'Error en la transacci\u00f3n') + '. Intenta de nuevo o usa otro m\u00e9todo de pago.';
          window.ReactNativeWebView.postMessage(JSON.stringify({type:'error', msg: msg4}));
        } else if (c==='6') {
          var msg6 = 'Pago reversado: ' + (m || 'La transacci\u00f3n fue reversada') + '. Contacta a tu banco si tienes dudas.';
          window.ReactNativeWebView.postMessage(JSON.stringify({type:'error', msg: msg6}));
        }
      } catch(ex){ log('msg error: '+ex.message); }
    });
  </script>
</body>
</html>`;


  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      safeLog('💳 ePayco mensaje:', data.type, data.msg || '');
      if (data.type === 'log') {
        safeLog('📋 ePayco log:', data.msg);
      } else if (data.type === 'exito') {
        haptic.checkoutExito();
        onExito();
      } else if (data.type === 'cancelado') {
        onCancelado();
      } else if (data.type === 'pendiente') {
        safeLog('⚠️ ePayco pendiente:', data.msg);
        onError(data.msg);
      } else if (data.type === 'error') {
        safeError('❌ ePayco error:', data.msg);
        onError(data.msg);
      }
    } catch (e: any) {
      safeError('❌ Error parseando mensaje WebView:', e.message);
    }
  };

  // Interceptar navegación — ePayco SIEMPRE redirige a response_url
  const handleNavigationChange = async (navState: any) => {
    const url: string = navState.url || '';
    safeLog('🔗 WebView navega a:', url);

    if (!url.includes('pago/respuesta')) return;

    safeLog('💳 ePayco redirect a response_url:', url);
    try {
      const urlObj = new URL(url);
      const xResponse    = urlObj.searchParams.get('x_response') || '';
      const xCodResponse = urlObj.searchParams.get('x_cod_response') ||
                           urlObj.searchParams.get('x_response_code_transaction') || '';
      const xReason      = urlObj.searchParams.get('x_response_reason_text') || '';
      const refPayco     = urlObj.searchParams.get('ref_payco') || '';

      safeLog('💳 x_response:', xResponse, '| x_cod:', xCodResponse, '| ref_payco:', refPayco);

      // CASO 1: ePayco mandó x_response directamente en la URL
      if (xResponse || xCodResponse) {
        procesarRespuestaEpayco(xResponse, xCodResponse, xReason);
        return;
      }

      // CASO 2: Solo mandó ref_payco (PSE/Nequi) — consultar estado real al backend
      if (refPayco) {
        safeLog('💳 Consultando estado real con ref_payco:', refPayco);
        await consultarEstadoPorRefPayco(refPayco);
        return;
      }

      // CASO 3: Sin parámetros — consultar último pedido
      if (orderId) {
        await consultarEstadoPedido(orderId);
      }

    } catch (e: any) {
      safeError('❌ Error parseando response_url:', e.message);
    }
  };

  const procesarRespuestaEpayco = (xResponse: string, xCodResponse: string, xReason: string) => {
    if (xResponse === 'Aceptada' || xCodResponse === '1') {
      haptic.checkoutExito(); onExito();
    } else if (xResponse === 'Cancelada' || xResponse === 'Abandonada') {
      onCancelado();
    } else if (xResponse === 'Pendiente' || xCodResponse === '3' || xCodResponse === '7') {
      onError(`Pago pendiente: ${xReason || 'Recibirás un correo cuando sea aprobado.'}`);
    } else if (xResponse === 'Rechazada' || xCodResponse === '2') {
      onError(`Pago rechazado: ${xReason || 'El pago fue rechazado'}. Verifica tu tarjeta o intenta con otro método.`);
    } else if (xResponse === 'Fallida' || xCodResponse === '4') {
      onError(`Pago fallido: ${xReason || 'Error en la transacción'}. Intenta de nuevo.`);
    } else if (xResponse === 'Expirada' || xCodResponse === '9' || xCodResponse === '10') {
      onError(`Pago expirado: ${xReason || 'El tiempo de pago expiró'}. Intenta nuevamente.`);
    } else if (xResponse === 'Reversada' || xCodResponse === '6') {
      onError(`Pago reversado: ${xReason || 'La transacción fue reversada'}. Contacta a tu banco.`);
    } else if (xResponse) {
      onError(xReason || `Pago no completado (${xResponse}). Intenta nuevamente.`);
    }
  };

  // Consultar estado real por ref_payco directamente a ePayco via backend
  const consultarEstadoPorRefPayco = async (refPayco: string, intentos = 0) => {
    if (!token) { onError('Sesión expirada. Inicia sesión nuevamente.'); return; }
    try {
      safeLog('🔍 Consultando ref_payco', `${refPayco} intento ${intentos + 1}/5`);
      const res = await fetch(`${API_URL}/api/pagos/epayco/consultar/${refPayco}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      safeLog('💳 Estado ePayco:', JSON.stringify(data).slice(0, 200));

      // La API de ePayco retorna data.x_cod_transaction_state o data.x_transaction_state
      const cod = String(data.data?.x_cod_transaction_state || data.x_cod_transaction_state || data.x_response_code_transaction || '');
      const resp = data.data?.x_transaction_state || data.x_transaction_state || data.x_response || '';
      const reason = data.data?.x_response_reason_text || data.x_response_reason_text || '';

      safeLog('💳 Estado real:', `cod=${cod} resp=${resp}`);

      if (cod === '1' || resp === 'Aceptada') {
        haptic.checkoutExito(); onExito();
      } else if (cod === '2' || resp === 'Rechazada' || resp === 'Fallida') {
        onError(`Pago rechazado: ${reason || 'El pago fue rechazado por el banco'}. Verifica tu método de pago.`);
      } else if (cod === '3' || cod === '7' || resp === 'Pendiente') {
        onError(`Pago pendiente: ${reason || 'Recibirás confirmación por correo.'}`);
      } else if (cod === '6' || resp === 'Reversada') {
        onError(`Pago reversado: ${reason || 'La transacción fue reversada'}. Contacta a tu banco.`);
      } else if (intentos < 4) {
        // Estado desconocido o aún procesando — reintentar
        safeLog('⏳ Reintentando...', `intento ${intentos + 1}/5`);
        setTimeout(() => consultarEstadoPorRefPayco(refPayco, intentos + 1), 3000);
      } else {
        // Después de 5 intentos sin estado claro — pendiente
        onError('No se pudo confirmar el estado del pago. Verifica en "Mis Pedidos".');
      }
    } catch (e: any) {
      safeError('❌ Error consultando ref_payco:', e.message);
      if (intentos < 3) {
        setTimeout(() => consultarEstadoPorRefPayco(refPayco, intentos + 1), 3000);
      } else {
        onError('Error al verificar el pago. Revisa en "Mis Pedidos".');
      }
    }
  };

  // Consultar estado del pedido al backend (fallback)
  const consultarEstadoPedido = async (pedidoId: string, intentos = 0) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/pedidos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const pedido = (data.pedidos || []).find((p: any) => p.id === pedidoId);
      if (!pedido) { onError('No se encontró el pedido. Verifica en "Mis Pedidos".'); return; }
      if (pedido.estado === 'Confirmado') { haptic.checkoutExito(); onExito(); }
      else if (pedido.estado === 'Cancelado') { onError('El pago fue rechazado o cancelado.'); }
      else if (intentos < 4) { setTimeout(() => consultarEstadoPedido(pedidoId, intentos + 1), 3000); }
      else { onError('Tu pago está siendo procesado. Revisa en "Mis Pedidos".'); }
    } catch { onError('Error al verificar el pedido.'); }
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onCerrar}>
      <View style={epaycoStyles.container}>
        <View style={epaycoStyles.header}>
          <Text style={epaycoStyles.headerTxt}>🔒 Pago Seguro — ePayco</Text>
          <TouchableOpacity onPress={onCerrar} style={epaycoStyles.cerrarBtn}>
            <Text style={epaycoStyles.cerrarTxt}>✕</Text>
          </TouchableOpacity>
        </View>
        {cargando && (
          <View style={epaycoStyles.loader}>
            <ActivityIndicator color={COLORS.dorado} size="large" />
            <Text style={epaycoStyles.loaderTxt}>Conectando con ePayco...</Text>
          </View>
        )}
        {errorWebView && (
          <View style={epaycoStyles.loader}>
            <Text style={{ color: '#ef4444', fontSize: 14, textAlign: 'center', padding: 20 }}>
              ❌ {errorWebView}
            </Text>
            <TouchableOpacity
              style={{ marginTop: 16, backgroundColor: COLORS.dorado, padding: 12, borderRadius: 8 }}
              onPress={onCerrar}
            >
              <Text style={{ color: COLORS.negro, fontWeight: '700' }}>Volver</Text>
            </TouchableOpacity>
          </View>
        )}
        <WebView
          source={{ html, baseUrl: 'https://checkout.epayco.co' }}
          originWhitelist={['*']}
          onLoadStart={() => safeLog('💳 WebView: cargando...')}
          onLoadEnd={() => { safeLog('💳 WebView: cargó'); setCargando(false); }}
          onNavigationStateChange={handleNavigationChange}
          onError={(e) => {
            const err = e.nativeEvent;
            safeError('❌ WebView error:', err.code, err.description);
            setErrorWebView(`Error ${err.code}: ${err.description}`);
            setCargando(false);
          }}
          onHttpError={(e) => {
            safeError('❌ WebView HTTP error:', e.nativeEvent.statusCode);
          }}
          onMessage={handleMessage}
          javaScriptEnabled
          domStorageEnabled
          mixedContentMode="always"
          allowsInlineMediaPlayback
          style={[epaycoStyles.webview, cargando && { opacity: 0 }]}
        />
      </View>
    </Modal>
  );
}

const epaycoStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.negroHeader },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 52, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md,
    backgroundColor: COLORS.negroHeader,
    borderBottomWidth: 1, borderBottomColor: 'rgba(197,164,126,0.2)',
  },
  headerTxt: { color: COLORS.dorado, fontSize: 14, fontWeight: '700' },
  cerrarBtn: { padding: 8 },
  cerrarTxt: { color: COLORS.blanco, fontSize: 18 },
  loader: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  loaderTxt: { color: COLORS.dorado, marginTop: 12, fontSize: 14 },
  webview: { flex: 1 },
});

// ── Pantalla principal checkout ──────────────────────────────
export default function CheckoutScreen() {
  const { items, totalPrecio, vaciarCarrito } = useCartStore();
  const { usuario, token } = useAuthStore();
  const addNotification = useNotificationStore(s => s.addNotification);

  const [step, setStep] = useState(1);
  const [metodo, setMetodo] = useState('pago_en_linea');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [datosEpayco, setDatosEpayco] = useState<any>(null);
  const [epaycoActivo, setEpaycoActivo] = useState<boolean | null>(null);
  const [sistecreditoUrl, setSistecreditoUrl] = useState<string | null>(null);
  const [sistecreditoTxId, setSistecreditoTxId] = useState<string | null>(null);

  // Bono
  const [codigoBono, setCodigoBono] = useState('');
  const [bonoValidado, setBonoValidado] = useState<any>(null);
  const [validandoBono, setValidandoBono] = useState(false);
  const [errorBono, setErrorBono] = useState('');

  const total = totalPrecio();
  const descuento = bonoValidado?.valido ? bonoValidado.monto : 0;
  const totalFinal = Math.max(0, total - descuento);

  // Verificar si ePayco está activo al montar
  React.useEffect(() => {
    fetch(`${API_URL}/api/pagos/epayco/estado`)
      .then(r => r.json())
      .then(d => setEpaycoActivo(d.configurado))
      .catch(() => setEpaycoActivo(false));
  }, []);

  const validarBono = async () => {
    if (!codigoBono.trim() || !usuario) return;
    setValidandoBono(true);
    setErrorBono('');
    const r = await api.validarBono(codigoBono.trim().toUpperCase(), usuario.id);
    if (r.valido) {
      if (r.tipo === 'porcentaje' && r.porcentaje > 0)
        r.monto = Math.round(total * r.porcentaje / 100);
      setBonoValidado(r);
    } else {
      setErrorBono(r.razon || 'Bono no válido');
      setBonoValidado(null);
    }
    setValidandoBono(false);
  };

  const crearPedidoYPagar = async () => {
    if (!token || !usuario) return;
    if (usuario.rol !== 'cliente') {
      setError('Solo clientes pueden realizar compras');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // 1. Crear pedido en backend
      const resultado = await api.checkout(token, {
        metodo_pago: metodo,
        direccion_envio: usuario.direccion || 'Dirección predeterminada',
        descuento_bono: descuento,
        codigo_bono: bonoValidado?.valido ? codigoBono.trim().toUpperCase() : null,
        items: items.map(i => ({
          id: i.id, nombre: i.nombre, precio: i.precio,
          cantidad: i.cantidad,
          talla: (i as any).talla || null,
          color: (i as any).color || null,
        })),
      });

      if (!resultado.exito && !resultado.orden) {
        setError(resultado.error || 'Error al procesar el pedido');
        setLoading(false);
        return;
      }

      const pedidoId = resultado.orden?.id || resultado.id;
      setOrderId(pedidoId);

      // 2. Intentar abrir ePayco
      if (epaycoActivo) {
        const resWidget = await fetch(`${API_URL}/api/pagos/epayco/widget`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ pedido_id: pedidoId }),
        });
        const widgetData = await resWidget.json();
        if (resWidget.ok && widgetData.datos_widget) {
          setDatosEpayco(widgetData.datos_widget);
          setLoading(false);
          return; // EpaycoWebView se abre y maneja el resto
        }
      }

      // 3. Sistecredito
      if (metodo === 'sistecredito') {
        try {
          const resSiste = await fetch(`${API_URL}/api/pagos/sistecredito/iniciar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ pedido_id: pedidoId }),
          });
          const dataSiste = await resSiste.json();
          if (!resSiste.ok || !dataSiste.transaction_id) {
            setError(dataSiste.error || 'No se pudo iniciar el pago con Sistecredito');
            setLoading(false);
            return;
          }
          // Polling hasta obtener paymentRedirectUrl (máx 12 x 5s = 60s)
          const txId = dataSiste.transaction_id;
          setSistecreditoTxId(txId);
          let redirectUrl = null;
          for (let i = 0; i < 12; i++) {
            await new Promise(r => setTimeout(r, 5000));
            try {
              const resC = await fetch(`${API_URL}/api/pagos/sistecredito/consultar/${txId}`);
              const dataC = await resC.json();
              const tx = dataC?.data;
              const status = tx?.transactionStatus;
              redirectUrl = tx?.paymentMethodResponse?.paymentRedirectUrl;
              if (['Rejected','Cancelled','Expired','Abandoned','Failed'].includes(status)) {
                setError(`Pago rechazado: ${tx?.paymentMethodResponse?.description || status}`);
                setLoading(false);
                return;
              }
              if (redirectUrl) break;
            } catch {}
          }
          if (!redirectUrl) {
            setError('Sistecredito no respondió a tiempo. Intenta de nuevo.');
            setLoading(false);
            return;
          }
          setSistecreditoUrl(redirectUrl);
          setLoading(false);
          return;
        } catch {
          setError('Error de conexión con Sistecredito. Intenta de nuevo.');
          setLoading(false);
          return;
        }
      }

      // 4. ePayco no disponible — mostrar error (no completar sin pago)
      setError('La pasarela de pagos no está disponible en este momento. Intenta más tarde.');
      setLoading(false);

    } catch {
      setError('Error de conexión. Intenta nuevamente.');
      haptic.error();
      setLoading(false);
    }
  };

  const onPagoExitoso = async () => {
    setDatosEpayco(null);
    // BUG-17 FIX: aplicar bono y vaciar carrito después de que ePayco confirma
    // El webhook del backend confirmará el pedido de forma independiente
    if (bonoValidado?.valido && usuario && orderId) {
      await api.aplicarBono(codigoBono.trim().toUpperCase(), usuario.id, orderId).catch(() => {});
    }
    vaciarCarrito();
    haptic.checkoutExito();
    addNotification('¡Pedido recibido! Recibirás confirmación por correo 📧', 'success');
    setStep(3);
  };

  const onPagoCancelado = () => {
    setDatosEpayco(null);
    setError('Pago cancelado. Puedes intentarlo de nuevo.');
  };

  const onPagoError = (msg: string) => {
    setDatosEpayco(null);
    setError(msg);
    haptic.error();
  };

  // ── PASO 1: Método de pago ───────────────────────────────
  if (step === 1) {
    const metodos = [
      {
        id: 'pago_en_linea',
        nombre: 'Pagar en línea',
        desc: 'Tarjeta, PSE, Nequi, Daviplata, Efecty — procesado por ePayco',
        emoji: '💳',
      },
      {
        id: 'sistecredito',
        nombre: 'Sistecredito — Paga a cuotas',
        desc: 'Financia tu compra en cuotas sin tarjeta de crédito',
        emoji: '🏦',
      },
    ];

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <BtnVolver titulo="FINALIZAR COMPRA" />
        <StepIndicator current={1} total={2} />
        <Text style={styles.titulo}>¿Cómo quieres pagar?</Text>
        <Text style={styles.subtitulo}>Selecciona un método de pago</Text>

        {metodos.map(m => (
          <TouchableOpacity
            key={m.id}
            style={[styles.metodoCard, metodo === m.id && styles.metodoCardActivo]}
            onPress={() => { setMetodo(m.id); haptic.tap(); }}
          >
            <View style={[styles.metodoRadio, metodo === m.id && styles.metodoRadioActivo]}>
              {metodo === m.id && <View style={styles.metodoRadioPunto} />}
            </View>
            <View style={styles.metodoIconWrap}>
              <Text style={{ fontSize: 20 }}>{m.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.metodoNombre}>{m.nombre}</Text>
              <Text style={styles.metodoDesc}>{m.desc}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.avisoSeguridad}>
          <Text style={{ fontSize: 14 }}>🛡️</Text>
          <Text style={styles.avisoTxt}>
            Pago seguro. ePayco acepta tarjetas, PSE, Nequi, Daviplata y más. Sistecredito permite pagar a cuotas sin tarjeta.
          </Text>
        </View>

        <TouchableOpacity style={styles.btnSiguiente} onPress={() => { haptic.tap(); setStep(2); }}>
          <Text style={styles.btnSiguienteTxt}>Continuar →</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ── PASO 2: Confirmación con productos + bono ────────────
  if (step === 2) {
    return (
      <>
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          <StepIndicator current={2} total={2} />
          <Text style={styles.titulo}>Confirma tu pedido</Text>
          <Text style={styles.subtitulo}>Revisa antes de finalizar</Text>

          {/* Lista de productos con imagen — igual al web */}
          <View style={styles.productosList}>
            <View style={styles.productosHeader}>
              <Text style={styles.productosHeaderTxt}>{items.length} PRODUCTO(S)</Text>
            </View>
            {items.map(item => (
              <View key={`${item.id}-${(item as any).talla}-${(item as any).color}`} style={styles.productoRow}>
                <Image source={{ uri: item.imagen }} style={styles.productoImg} resizeMode="cover" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.productoNombre} numberOfLines={1}>{item.nombre}</Text>
                  {(item as any).talla && <Text style={styles.productoVariante}>Talla: {(item as any).talla}</Text>}
                  {(item as any).color && <Text style={styles.productoVariante}>Color: {(item as any).color}</Text>}
                  <Text style={styles.productoCant}>Cant: {item.cantidad}</Text>
                </View>
                <Text style={styles.productoPrecio}>{fmt(item.precio * item.cantidad)}</Text>
              </View>
            ))}
            {/* Totales */}
            <View style={styles.totalSection}>
              {bonoValidado?.valido && (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Descuento bono</Text>
                  <Text style={[styles.totalValor, { color: '#10b981' }]}>−{fmt(descuento)}</Text>
                </View>
              )}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Envío</Text>
                <Text style={[styles.totalValor, { color: '#10b981' }]}>Gratis</Text>
              </View>
              <View style={[styles.totalRow, { borderBottomWidth: 0, paddingTop: 8 }]}>
                <Text style={[styles.totalLabel, { fontWeight: '700', fontSize: 15, color: COLORS.textoNegro }]}>Total</Text>
                <View style={{ alignItems: 'flex-end' }}>
                  {bonoValidado?.valido && (
                    <Text style={{ fontSize: 11, color: COLORS.textoGrisSub, textDecorationLine: 'line-through' }}>
                      {fmt(total)}
                    </Text>
                  )}
                  <Text style={[styles.totalValor, { fontSize: 18, fontWeight: '800', color: COLORS.negro }]}>
                    {fmt(totalFinal)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Método seleccionado */}
          <View style={styles.metodoResumen}>
            <View style={styles.metodoResumenIcon}>
              <Text style={{ fontSize: 16 }}>{metodo === 'sistecredito' ? '🏦' : '💳'}</Text>
            </View>
            <View>
              <Text style={styles.metodoResumenNombre}>
                {metodo === 'sistecredito' ? 'Sistecredito' : 'Pagar en línea'}
              </Text>
              <Text style={styles.metodoResumenDesc}>
                {metodo === 'sistecredito' ? 'Pago a cuotas sin tarjeta de crédito' : 'Tarjeta, PSE, Nequi, Daviplata, Efecty'}
              </Text>
            </View>
          </View>

          {/* Campo de bono — igual al web */}
          <View style={styles.bonoSection}>
            <Text style={styles.bonoTitulo}>🎁 ¿Tienes un código de bono?</Text>
            <View style={styles.bonoRow}>
              <TextInput
                style={styles.bonoInput}
                value={codigoBono}
                onChangeText={v => { setCodigoBono(v.toUpperCase()); setBonoValidado(null); setErrorBono(''); }}
                placeholder="EGOSXXXXXXX"
                placeholderTextColor={COLORS.textoGrisSub}
                autoCapitalize="characters"
                editable={!bonoValidado?.valido}
              />
              <TouchableOpacity
                style={[styles.bonoBtn, (validandoBono || !codigoBono.trim() || bonoValidado?.valido) && { opacity: 0.4 }]}
                onPress={validarBono}
                disabled={validandoBono || !codigoBono.trim() || bonoValidado?.valido}
              >
                {validandoBono
                  ? <ActivityIndicator color={COLORS.blanco} size="small" />
                  : <Text style={styles.bonoBtnTxt}>Aplicar</Text>
                }
              </TouchableOpacity>
            </View>
            {bonoValidado?.valido && (
              <View style={styles.bonoExito}>
                <Text style={{ color: '#10b981', fontSize: 13, fontWeight: '600' }}>
                  ✓ Bono aplicado: −{fmt(descuento)}
                </Text>
                <TouchableOpacity onPress={() => { setBonoValidado(null); setCodigoBono(''); }}>
                  <Text style={{ color: COLORS.textoGrisSub, fontSize: 12 }}>✕ Quitar</Text>
                </TouchableOpacity>
              </View>
            )}
            {errorBono ? <Text style={styles.bonoError}>⚠️ {errorBono}</Text> : null}
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#ef4444', marginBottom: 2 }}>
                No se pudo completar el pago
              </Text>
              <Text style={styles.errorTxt}>{error}</Text>
            </View>
          )}

          {/* Botones */}
          <View style={styles.botonesRow}>
            <TouchableOpacity
              style={styles.btnVolver}
              onPress={() => { setStep(1); setError(null); haptic.tap(); }}
              disabled={loading}
            >
              <Text style={styles.btnVolverTxt}>← Volver</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnConfirmar, loading && { opacity: 0.7 }]}
              onPress={crearPedidoYPagar}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color={COLORS.negro} />
                : (
                  <>
                    <Text style={styles.btnConfirmarTxt}>🔒 Confirmar pedido</Text>
                  </>
                )
              }
            </TouchableOpacity>
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>

        {/* Widget ePayco en WebView */}
        {datosEpayco && (
          <EpaycoWebView
            datosWidget={datosEpayco}
            metodoPago={metodo}
            orderId={orderId}
            token={token}
            onExito={onPagoExitoso}
            onError={onPagoError}
            onCancelado={onPagoCancelado}
            onCerrar={() => { setDatosEpayco(null); setError('Pago cancelado.'); }}
          />
        )}

        {/* Sistecredito en WebView */}
        {sistecreditoUrl && (
          <Modal visible animationType="slide" onRequestClose={() => { setSistecreditoUrl(null); setError('Pago cancelado.'); }}>
            <View style={epaycoStyles.container}>
              <View style={epaycoStyles.header}>
                <Text style={epaycoStyles.headerTxt}>🏦 Sistecredito — Pago a cuotas</Text>
                <TouchableOpacity
                  onPress={() => { setSistecreditoUrl(null); setError('Pago cancelado. Puedes intentarlo de nuevo.'); }}
                  style={epaycoStyles.cerrarBtn}
                >
                  <Text style={epaycoStyles.cerrarTxt}>✕</Text>
                </TouchableOpacity>
              </View>
              <WebView
                source={{ uri: sistecreditoUrl }}
                onNavigationStateChange={async (navState) => {
                  const url = navState.url || '';
                  // Detectar retorno exitoso — Sistecredito redirige a la redirectionUrl
                  if (url.includes('egoscolombia.com.co') || url.includes('pago/respuesta')) {
                    // Consultar estado del pedido
                    if (orderId && token) {
                      for (let i = 0; i < 5; i++) {
                        await new Promise(r => setTimeout(r, 3000));
                        try {
                          const res = await fetch(`${API_URL}/api/pedidos`, {
                            headers: { Authorization: `Bearer ${token}` },
                          });
                          const data = await res.json();
                          const pedido = (data.pedidos || []).find((p: any) => p.id === orderId);
                          if (pedido?.estado === 'Confirmado') {
                            setSistecreditoUrl(null);
                            onPagoExitoso();
                            return;
                          }
                        } catch {}
                      }
                    }
                    setSistecreditoUrl(null);
                    setError('Tu pago está siendo procesado. Revisa en "Mis Pedidos".');
                  }
                }}
                javaScriptEnabled
                domStorageEnabled
                style={epaycoStyles.webview}
              />
            </View>
          </Modal>
        )}
      </>
    );
  }

  // ── PASO 3: Éxito — igual al web ────────────────────────
  return (
    <View style={[styles.container, { alignItems: 'center', justifyContent: 'center', padding: SPACING.xxl }]}>
      <View style={styles.exitoIconWrap}>
        <Text style={{ fontSize: 36, color: COLORS.blanco }}>✓</Text>
      </View>
      <Text style={styles.exitoTitulo}>¡Pedido recibido!</Text>
      <Text style={styles.exitoSub}>Tu pedido fue recibido. Recibirás un correo cuando el pago sea confirmado.</Text>

      {orderId && (
        <View style={styles.exitoOrden}>
          <Text style={styles.exitoOrdenLabel}>Número de orden</Text>
          <Text style={styles.exitoOrdenId}>#{String(orderId).slice(0, 16)}</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.btnPedidos}
        onPress={() => router.replace('/(tabs)/pedidos')}
      >
        <Text style={styles.btnPedidosTxt}>🛍️ Ver mis pedidos</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.replace('/(tabs)/')}>
        <Text style={{ color: COLORS.textoGrisMid, fontSize: 14, marginTop: 16 }}>Seguir comprando</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.fondoPagina },
  content: { padding: SPACING.lg },
  titulo: { fontSize: 20, fontWeight: '800', color: COLORS.textoNegro, marginBottom: 4 },
  subtitulo: { fontSize: 13, color: COLORS.textoGrisMid, marginBottom: 20 },

  // Método de pago
  metodoCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.fondoCard,
    borderRadius: RADIUS.lg, padding: SPACING.lg,
    borderWidth: 1.5, borderColor: COLORS.bordeClaro,
    marginBottom: 12, gap: 12, ...SHADOW.sm,
  },
  metodoCardActivo: { borderColor: COLORS.negro, backgroundColor: '#f9f9f9' },
  metodoRadio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: COLORS.bordeMedio,
    alignItems: 'center', justifyContent: 'center',
  },
  metodoRadioActivo: { borderColor: COLORS.negro },
  metodoRadioPunto: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.negro },
  metodoIconWrap: {
    width: 40, height: 40, borderRadius: RADIUS.md,
    backgroundColor: COLORS.fondoGris,
    alignItems: 'center', justifyContent: 'center',
  },
  metodoNombre: { fontSize: 14, fontWeight: '700', color: COLORS.textoNegro, marginBottom: 2 },
  metodoDesc: { fontSize: 11, color: COLORS.textoGrisMid },

  avisoSeguridad: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#eff6ff', borderRadius: RADIUS.md,
    padding: 12, marginBottom: 20,
    borderWidth: 1, borderColor: '#bfdbfe',
  },
  avisoTxt: { flex: 1, fontSize: 12, color: '#1d4ed8', lineHeight: 18 },

  btnSiguiente: {
    backgroundColor: COLORS.negro, borderRadius: RADIUS.md,
    padding: 16, alignItems: 'center', ...SHADOW.sm,
  },
  btnSiguienteTxt: { color: COLORS.dorado, fontWeight: '700', fontSize: 16 },

  // Lista productos
  productosList: {
    backgroundColor: COLORS.fondoCard, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.bordeClaro,
    overflow: 'hidden', marginBottom: 12,
  },
  productosHeader: {
    backgroundColor: COLORS.fondoGris, paddingHorizontal: SPACING.lg,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.bordeClaro,
  },
  productosHeaderTxt: { fontSize: 11, fontWeight: '700', color: COLORS.textoGrisMid, letterSpacing: 0.5 },
  productoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: SPACING.lg, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.bordeClaro,
  },
  productoImg: { width: 44, height: 44, borderRadius: RADIUS.sm, backgroundColor: COLORS.fondoGris },
  productoNombre: { fontSize: 13, fontWeight: '600', color: COLORS.textoNegro },
  productoVariante: { fontSize: 11, color: COLORS.textoGrisMid },
  productoCant: { fontSize: 11, color: COLORS.textoGrisSub },
  productoPrecio: { fontSize: 13, fontWeight: '700', color: COLORS.textoNegro },
  totalSection: { paddingHorizontal: SPACING.lg, paddingTop: 8, paddingBottom: 12 },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.bordeClaro,
  },
  totalLabel: { fontSize: 13, color: COLORS.textoGrisMid },
  totalValor: { fontSize: 13, fontWeight: '600', color: COLORS.textoNegro },

  // Método resumen — texto dinámico según método
  metodoResumen: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, backgroundColor: COLORS.fondoGris,
    borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.bordeClaro,
    marginBottom: 12,
  },
  metodoResumenIcon: {
    width: 36, height: 36, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.negro, alignItems: 'center', justifyContent: 'center',
  },
  metodoResumenNombre: { fontSize: 13, fontWeight: '700', color: COLORS.textoNegro },
  metodoResumenDesc: { fontSize: 11, color: COLORS.textoGrisMid },

  // Bono
  bonoSection: {
    backgroundColor: COLORS.fondoCard, borderRadius: RADIUS.lg,
    padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.bordeClaro, marginBottom: 12,
  },
  bonoTitulo: { fontSize: 13, fontWeight: '600', color: COLORS.textoGris, marginBottom: 10 },
  bonoRow: { flexDirection: 'row', gap: 8 },
  bonoInput: {
    flex: 1, borderWidth: 1, borderColor: COLORS.bordeClaro,
    borderRadius: RADIUS.sm, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: COLORS.textoNegro, backgroundColor: COLORS.fondoGris,
    fontVariant: ['tabular-nums'],
  },
  bonoBtn: {
    backgroundColor: '#d97706', borderRadius: RADIUS.sm,
    paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center',
  },
  bonoBtnTxt: { color: COLORS.blanco, fontWeight: '700', fontSize: 13 },
  bonoExito: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 8, backgroundColor: '#ecfdf5', borderRadius: RADIUS.sm, padding: 8,
  },
  bonoError: { color: '#ef4444', fontSize: 12, marginTop: 6 },

  // Error
  errorBox: {
    backgroundColor: '#fef2f2', borderRadius: RADIUS.md, padding: 12,
    marginBottom: 12, borderWidth: 1, borderColor: '#fecaca',
  },
  errorTxt: { color: '#ef4444', fontSize: 13 },

  // Botones confirmación
  botonesRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  btnVolver: {
    borderWidth: 1, borderColor: COLORS.bordeMedio,
    borderRadius: RADIUS.md, paddingHorizontal: 16, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  btnVolverTxt: { fontSize: 14, color: COLORS.textoGrisMid, fontWeight: '600' },
  btnConfirmar: {
    flex: 1, backgroundColor: COLORS.dorado,
    borderRadius: RADIUS.md, paddingVertical: 14, alignItems: 'center', ...SHADOW.sm,
  },
  btnConfirmarTxt: { color: COLORS.negro, fontWeight: '700', fontSize: 14 },

  // Éxito
  exitoIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#10b981', alignItems: 'center',
    justifyContent: 'center', marginBottom: 20, ...SHADOW.md,
  },
  exitoTitulo: { fontSize: 26, fontWeight: '800', color: COLORS.textoNegro, marginBottom: 8, textAlign: 'center' },
  exitoSub: { fontSize: 14, color: COLORS.textoGrisMid, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  exitoOrden: {
    backgroundColor: COLORS.fondoGris, borderRadius: RADIUS.lg,
    padding: SPACING.lg, alignItems: 'center', marginBottom: 24, width: '100%',
    borderWidth: 1, borderColor: COLORS.bordeClaro,
  },
  exitoOrdenLabel: { fontSize: 11, color: COLORS.textoGrisSub, marginBottom: 4 },
  exitoOrdenId: { fontSize: 16, fontWeight: '700', color: COLORS.textoNegro, fontVariant: ['tabular-nums'] },
  btnPedidos: {
    backgroundColor: COLORS.negro, paddingHorizontal: 32,
    paddingVertical: 14, borderRadius: RADIUS.md, ...SHADOW.sm,
  },
  btnPedidosTxt: { color: COLORS.dorado, fontWeight: '700', fontSize: 15 },
});
