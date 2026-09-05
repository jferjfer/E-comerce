/**
 * TikTok Events API — EGOS
 * Pixel ID: D88U5GRC77UCUUKVIO80
 * Documentación: https://ads.tiktok.com/marketing_api/docs
 */

const axios = require('axios');
const crypto = require('crypto');

const PIXEL_ID    = 'D88U5GRC77UCUUKVIO80';
const ACCESS_TOKEN = process.env.TIKTOK_ACCESS_TOKEN || '1bdbacd45cd7477b12b99412006c070f418e96ef';
const API_URL     = 'https://business-api.tiktok.com/open_api/v1.3/event/track/';

// Hashear datos del cliente con SHA-256 (requerido por TikTok)
function hash(valor) {
  if (!valor) return undefined;
  return crypto.createHash('sha256').update(String(valor).trim().toLowerCase()).digest('hex');
}

function timestamp() {
  return Math.floor(Date.now() / 1000);
}

/**
 * Enviar evento a TikTok Events API
 */
async function enviarEvento(eventName, properties, clienteInfo = {}) {
  try {
    const payload = {
      pixel_code: PIXEL_ID,
      event: eventName,
      event_time: timestamp(),
      event_id: `${eventName}_${Date.now()}`,
      page: { url: 'https://www.egoscolombia.com.co' },
      properties,
      context: {
        user: {
          email:        hash(clienteInfo.email),
          phone_number: hash(clienteInfo.telefono),
          external_id:  hash(clienteInfo.id),
        },
        ip:         clienteInfo.ip,
        user_agent: clienteInfo.user_agent,
      }
    };

    await axios.post(API_URL, {
      pixel_code: PIXEL_ID,
      events: [payload]
    }, {
      headers: {
        'Access-Token': ACCESS_TOKEN,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });

    console.log(`📊 TikTok Event [${eventName}] enviado`);
  } catch (e) {
    // No bloquear el flujo si falla TikTok
    console.log(`⚠️ TikTok Events API error [${eventName}]:`, e.response?.data?.message || e.message);
  }
}

module.exports = {
  // Compra completada
  completePayment: (pedidoId, total, clienteInfo) =>
    enviarEvento('CompletePayment', {
      contents: [{ content_id: pedidoId, content_type: 'product', quantity: 1, price: total }],
      value: total,
      currency: 'COP',
      order_id: pedidoId
    }, clienteInfo),

  // Pedido creado
  placeAnOrder: (pedidoId, total, clienteInfo) =>
    enviarEvento('PlaceAnOrder', {
      contents: [{ content_id: pedidoId, content_type: 'product', quantity: 1, price: total }],
      value: total,
      currency: 'COP',
      order_id: pedidoId
    }, clienteInfo),

  // Registro de usuario
  completeRegistration: (usuarioId, email, clienteInfo) =>
    enviarEvento('CompleteRegistration', {
      contents: [{ content_id: String(usuarioId), content_type: 'product' }],
      currency: 'COP',
      value: 0
    }, { ...clienteInfo, email, id: usuarioId }),

  // Agregar al carrito
  addToCart: (productoId, nombre, precio, clienteInfo) =>
    enviarEvento('AddToCart', {
      contents: [{ content_id: productoId, content_type: 'product', content_name: nombre, quantity: 1, price: precio }],
      value: precio,
      currency: 'COP'
    }, clienteInfo),
};
