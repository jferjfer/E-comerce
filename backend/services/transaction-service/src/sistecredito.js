/**
 * Sistecredito Integration — EGOS
 * API: https://api.credinet.co/pay
 * Docs: G-ALI-08, G-ALI-10, G-ALI-12, G-SCL-21
 *
 * Variables de entorno requeridas:
 *   SISTECREDITO_SUBSCRIPTION_KEY  → Ocp-Apim-Subscription-Key
 *   SISTECREDITO_APPLICATION_KEY   → ApplicationKey (storeId)
 *   SISTECREDITO_APPLICATION_TOKEN → ApplicationToken (vendorId)
 *   SISTECREDITO_AMBIENTE          → "Staging" | "Production"
 */

const axios = require('axios');

const BASE_URL = 'https://api.credinet.co';
const PAYMENT_METHOD_ID = 2; // Sistecredito: siempre 2 en Staging y Production

const getConfig = () => ({
  subscriptionKey: process.env.SISTECREDITO_SUBSCRIPTION_KEY,
  applicationKey:  process.env.SISTECREDITO_APPLICATION_KEY,
  applicationToken: process.env.SISTECREDITO_APPLICATION_TOKEN,
  ambiente: process.env.SISTECREDITO_AMBIENTE || 'Staging',
});

const estaConfigurado = () => {
  const c = getConfig();
  return !!(c.subscriptionKey && c.applicationKey && c.applicationToken);
};

// Headers comunes para todas las peticiones
const getHeaders = () => {
  const c = getConfig();
  return {
    'Content-Type': 'application/json',
    'SCLocation': '0,0',
    'SCOrigen': c.ambiente,
    'country': 'co',
    'Ocp-Apim-Subscription-Key': c.subscriptionKey,
    'ApplicationKey': c.applicationKey,
    'ApplicationToken': c.applicationToken,
  };
};

// ============================================
// CREAR TRANSACCIÓN
// POST /pay/create
// ============================================
const crearTransaccion = async (pedido, cliente) => {
  const frontendUrl = process.env.FRONTEND_URL || 'https://egoscolombia.com.co';
  const backendUrl  = process.env.BACKEND_URL  || 'https://api.egoscolombia.com.co';

  const body = {
    invoice:     pedido.id,
    description: `Compra EGOS #${pedido.id}`,
    paymentMethod: {
      paymentMethodId: PAYMENT_METHOD_ID,
      bankCode: 1,
      userType: 0,
    },
    currency: 'COP',
    value:    Math.round(parseFloat(pedido.total)),
    urlResponse:        `${frontendUrl}/pago/sistecredito/respuesta`,
    urlConfirmation:    `${backendUrl}/api/pagos/sistecredito/confirmar`,
    methodConfirmation: 'POST',
    client: {
      docType:    cliente.documento_tipo || 'CC',
      document:   cliente.documento_numero || '999999999',
      name:       (cliente.nombre || 'Cliente').split(' ')[0],
      lastName:   (cliente.nombre || 'Cliente').split(' ').slice(1).join(' ') || 'EGOS',
      email:      cliente.email || '',
      indCountry: '57',
      phone:      cliente.telefono || '3000000000',
      country:    'co',
      city:       cliente.ciudad || 'Bogota',
      address:    cliente.direccion || 'Bogota D.C.',
      ipAddress:  cliente.ip || '127.0.0.1',
    },
  };

  console.log(`💳 Sistecredito — Creando transacción para pedido ${pedido.id}`);

  const response = await axios.post(`${BASE_URL}/pay/create`, body, {
    headers: getHeaders(),
    timeout: 30000,
  });

  return response.data;
};

// ============================================
// CONSULTAR TRANSACCIÓN (polling)
// GET /pay/GetTransaction  ← endpoint correcto según docs
// ============================================
const consultarTransaccion = async (transactionId) => {
  const response = await axios.get(`${BASE_URL}/pay/GetTransaction`, {
    headers: getHeaders(),
    params: { transactionId },
    timeout: 15000,
  });
  return response.data;
};

// ============================================
// POLLING — esperar hasta tener paymentRedirectUrl
// Máximo 12 intentos cada 5 segundos = 60 segundos
// ============================================
const esperarRedirectUrl = async (transactionId, maxIntentos = 12) => {
  for (let i = 0; i < maxIntentos; i++) {
    await new Promise(r => setTimeout(r, 5000)); // 5s entre intentos según docs
    try {
      const data = await consultarTransaccion(transactionId);
      const tx = data?.data;

      if (!tx) continue;

      const status = tx.transactionStatus;
      const redirectUrl = tx.paymentMethodResponse?.paymentRedirectUrl;

      console.log(`🔄 Sistecredito polling ${i + 1}/${maxIntentos} — status: ${status} | url: ${redirectUrl ? 'SI' : 'NO'}`);

      // Estados terminales negativos — no seguir esperando
      if (['Rejected', 'Cancelled', 'Expired', 'Abandoned', 'Failed'].includes(status)) {
        return { exito: false, status, descripcion: tx.paymentMethodResponse?.description || status };
      }

      // Tenemos URL de redirect — éxito (puede llegar en Pending o PendingForPaymentMethod)
      if (redirectUrl) {
        return { exito: true, redirectUrl, transactionId, status };
      }
    } catch (e) {
      console.log(`⚠️ Sistecredito polling error intento ${i + 1}: ${e.message}`);
    }
  }

  return { exito: false, status: 'Timeout', descripcion: 'Tiempo de espera agotado. Intenta de nuevo.' };
};

// ============================================
// INTERPRETAR ESTADO
// ============================================
const interpretarEstado = (transactionStatus) => {
  const mapa = {
    'Approved':   { estado: 'Confirmado', exitoso: true },
    'Pending':    { estado: 'Creado',     exitoso: false },
    'Rejected':   { estado: 'Cancelado',  exitoso: false },
    'Cancelled':  { estado: 'Cancelado',  exitoso: false },
    'Expired':    { estado: 'Cancelado',  exitoso: false },
    'Abandoned':  { estado: 'Cancelado',  exitoso: false },
    'Failed':     { estado: 'Cancelado',  exitoso: false },
  };
  return mapa[transactionStatus] || { estado: 'Creado', exitoso: false };
};

// ============================================
// VERIFICAR NOTIFICACIÓN (seguridad)
// Comparar webhook con GET para evitar fraude
// ============================================
const verificarNotificacion = async (datosWebhook) => {
  try {
    const transactionId = datosWebhook?._id || datosWebhook?.data?._id;
    if (!transactionId) return false;

    const respuestaGet = await consultarTransaccion(transactionId);
    const txGet = respuestaGet?.data;
    const txWebhook = datosWebhook?.data || datosWebhook;

    // Comparar _id y transactionStatus entre webhook y GET
    const idCoincide = txGet?._id === (txWebhook?._id || transactionId);
    const statusCoincide = txGet?.transactionStatus === txWebhook?.transactionStatus;

    console.log(`🔐 Sistecredito verificación: id=${idCoincide} status=${statusCoincide}`);
    return idCoincide && statusCoincide;
  } catch (e) {
    console.error('⚠️ Error verificando notificación Sistecredito:', e.message);
    return false;
  }
};

module.exports = {
  estaConfigurado,
  crearTransaccion,
  consultarTransaccion,
  esperarRedirectUrl,
  interpretarEstado,
  verificarNotificacion,
  getConfig,
};
