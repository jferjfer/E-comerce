const axios = require('axios');
const crypto = require('crypto');

const PIXEL_ID = process.env.META_PIXEL_ID || '2940071826327661';
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || '';
const API_VERSION = 'v19.0';

function hash(value) {
  if (!value) return undefined;
  return crypto.createHash('sha256').update(String(value).toLowerCase().trim()).digest('hex');
}

function buildUserData(userData = {}) {
  return {
    em: userData.email ? [hash(userData.email)] : undefined,
    ph: userData.phone ? [hash(userData.phone)] : undefined,
    fn: userData.firstName ? [hash(userData.firstName)] : undefined,
    ln: userData.lastName ? [hash(userData.lastName)] : undefined,
    client_ip_address: userData.ip || undefined,
    client_user_agent: userData.user_agent || undefined,
  };
}

async function enviarEvento(eventName, eventId, customData = {}, userData = {}, sourceUrl = 'https://egoscolombia.com.co') {
  if (!ACCESS_TOKEN) return;
  try {
    await axios.post(
      `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events`,
      {
        data: [{
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId,
          action_source: 'website',
          event_source_url: sourceUrl,
          user_data: buildUserData(userData),
          custom_data: customData,
        }],
        access_token: ACCESS_TOKEN,
      },
      { timeout: 5000 }
    );
    console.log(`📘 Meta [${eventName}] enviado — id: ${eventId}`);
  } catch (e) {
    console.log(`⚠️ Meta Pixel error [${eventName}]: ${e.message}`);
  }
}

module.exports = {
  // Compra completada
  purchase: (pedidoId, total, userData) =>
    enviarEvento('Purchase', pedidoId, { currency: 'COP', value: total, order_id: pedidoId }, userData),

  // Iniciar checkout
  initiateCheckout: (pedidoId, total, userData) =>
    enviarEvento('InitiateCheckout', pedidoId, { currency: 'COP', value: total }, userData),

  // Agregar al carrito
  addToCart: (productoId, precio, userData) =>
    enviarEvento('AddToCart', `cart_${productoId}_${Date.now()}`, {
      currency: 'COP', value: precio,
      content_ids: [productoId], content_type: 'product'
    }, userData),

  // Ver producto
  viewContent: (productoId, precio, nombre, userData) =>
    enviarEvento('ViewContent', `view_${productoId}_${Date.now()}`, {
      currency: 'COP', value: precio,
      content_ids: [productoId], content_name: nombre, content_type: 'product'
    }, userData),

  // Agregar a favoritos
  addToWishlist: (productoId, precio, userData) =>
    enviarEvento('AddToWishlist', `wish_${productoId}_${Date.now()}`, {
      currency: 'COP', value: precio,
      content_ids: [productoId], content_type: 'product'
    }, userData),

  // Registro completado
  completeRegistration: (usuarioId, userData) =>
    enviarEvento('CompleteRegistration', `reg_${usuarioId}`, {}, userData),

  // Búsqueda
  search: (query, userData) =>
    enviarEvento('Search', `search_${Date.now()}`, { search_string: query }, userData),

  // Agregar info de pago
  addPaymentInfo: (pedidoId, userData) =>
    enviarEvento('AddPaymentInfo', `pay_${pedidoId}`, {}, userData),
};
