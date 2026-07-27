const axios = require('axios');
const crypto = require('crypto');

const PIXEL_ID = process.env.META_PIXEL_ID || '2940071826327661';
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || '';

function hash(value) {
  if (!value) return undefined;
  return crypto.createHash('sha256').update(String(value).toLowerCase().trim()).digest('hex');
}

async function enviarEvento(eventName, pedidoId, total, userData = {}) {
  if (!ACCESS_TOKEN) return;
  try {
    await axios.post(
      `https://graph.facebook.com/v19.0/${PIXEL_ID}/events`,
      {
        data: [{
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: pedidoId,
          action_source: 'website',
          event_source_url: 'https://egoscolombia.com.co',
          user_data: {
            em: userData.email ? [hash(userData.email)] : undefined,
            ph: userData.phone ? [hash(userData.phone)] : undefined,
            client_ip_address: userData.ip || undefined,
            client_user_agent: userData.user_agent || undefined,
          },
          custom_data: {
            currency: 'COP',
            value: total,
            order_id: pedidoId,
          },
        }],
        access_token: ACCESS_TOKEN,
      },
      { timeout: 5000 }
    );
    console.log(`📘 Meta Pixel [${eventName}] enviado — pedido ${pedidoId}`);
  } catch (e) {
    console.log(`⚠️ Meta Pixel error: ${e.message}`);
  }
}

module.exports = {
  purchase: (pedidoId, total, userData) => enviarEvento('Purchase', pedidoId, total, userData),
};
