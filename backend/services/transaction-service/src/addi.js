const axios = require('axios');

const ADDI_CONFIG = {
  client_id: process.env.ADDI_CLIENT_ID || 'MSAdat5InIxHSTej3036IQOgkr6Ky3UY',
  client_secret: process.env.ADDI_CLIENT_SECRET || 'iEeeF-9qA40PsAqs7pQMUd2inhLkK6WG1MW299ymoYCu96pc04hO0hCd7KH7G3QB',
  ally_slug: process.env.ADDI_ALLY_SLUG || 'vertelycatillo-ecommerce',
  webhook_user: process.env.ADDI_WEBHOOK_USER || 'qvmQ8tYnEYI9uvJw',
  webhook_pass: process.env.ADDI_WEBHOOK_PASS || 'wC$B4QxRhdvDOcs*-iNxeGqRm^fAC3vp',
  base_url: 'https://api.addi.com',
  token_url: 'https://auth.addi.com/oauth/token',
};

let _token = null;
let _tokenExpiry = 0;

async function getToken() {
  if (_token && Date.now() < _tokenExpiry) return _token;
  const res = await axios.post(ADDI_CONFIG.token_url, {
    grant_type: 'client_credentials',
    client_id: ADDI_CONFIG.client_id,
    client_secret: ADDI_CONFIG.client_secret,
    audience: ADDI_CONFIG.base_url,
  });
  _token = res.data.access_token;
  _tokenExpiry = Date.now() + (res.data.expires_in - 60) * 1000;
  return _token;
}

async function crearOrden(pedido, cliente, urlBase) {
  const token = await getToken();
  const payload = {
    orderId: pedido.id,
    totalAmount: Math.round(pedido.total),
    currency: 'COP',
    items: (pedido.productos || []).map(p => ({
      sku: String(p.id),
      name: p.nombre || `Producto ${p.id}`,
      quantity: p.cantidad,
      unitPrice: Math.round(p.precio),
      pictureUrl: p.imagen || '',
      category: p.categoria || 'Ropa',
    })),
    client: {
      idType: cliente.documento_tipo || 'CC',
      idNumber: cliente.documento_numero || '',
      firstName: cliente.nombre?.split(' ')[0] || '',
      lastName: cliente.nombre?.split(' ').slice(1).join(' ') || '',
      email: cliente.email || '',
      cellphone: cliente.telefono || '',
      address: {
        lineOne: cliente.direccion || 'Bogotá D.C.',
        city: cliente.ciudad || 'Bogotá',
        country: 'CO',
      },
    },
    redirectionUrls: {
      approved: `${urlBase}/pago/respuesta?metodo=addi&estado=aprobado&pedido=${pedido.id}`,
      rejected: `${urlBase}/pago/respuesta?metodo=addi&estado=rechazado&pedido=${pedido.id}`,
      cancelled: `${urlBase}/pago/respuesta?metodo=addi&estado=cancelado&pedido=${pedido.id}`,
    },
  };

  const res = await axios.post(
    `${ADDI_CONFIG.base_url}/v1/allies/${ADDI_CONFIG.ally_slug}/orders`,
    payload,
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
  );
  return res.data;
}

function verificarWebhook(req) {
  const authHeader = req.headers['authorization'] || '';
  const expected = 'Basic ' + Buffer.from(`${ADDI_CONFIG.webhook_user}:${ADDI_CONFIG.webhook_pass}`).toString('base64');
  return authHeader === expected;
}

// approved | rejected | cancelled | fraud_prevention_rejected
function interpretarEstado(addiStatus) {
  if (addiStatus === 'approved') return { estado: 'Confirmado', exitoso: true };
  if (addiStatus === 'cancelled') return { estado: 'Cancelado', exitoso: false };
  return { estado: 'Cancelado', exitoso: false };
}

module.exports = { crearOrden, verificarWebhook, interpretarEstado, ADDI_CONFIG };
