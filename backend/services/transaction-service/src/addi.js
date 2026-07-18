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
    totalAmount: `${Math.round(pedido.total)}.0`,
    shippingAmount: '0.0',
    currency: 'COP',
    items: (pedido.productos || []).map(p => ({
      sku: String(p.id),
      name: p.nombre || `Producto ${p.id}`,
      quantity: String(p.cantidad),
      unitPrice: `${Math.round(p.precio)}.0`,
      pictureUrl: p.imagen || '',
      category: p.categoria || 'Ropa',
    })),
    client: {
      idType: 'CC',
      idNumber: cliente.documento_numero || '',
      firstName: cliente.nombre?.split(' ')[0] || '',
      lastName: cliente.nombre?.split(' ').slice(1).join(' ') || '',
      email: cliente.email || '',
      cellphone: cliente.telefono || '',
      cellphoneCountryCode: '+57',
      address: {
        lineOne: cliente.direccion || 'Bogotá D.C.',
        city: cliente.ciudad || 'Bogotá',
        country: 'CO',
      },
    },
    shippingAddress: {
      lineOne: cliente.direccion || 'Bogotá D.C.',
      city: cliente.ciudad || 'Bogotá',
      country: 'CO',
    },
    allyUrlRedirection: {
      logoUrl: 'https://egoscolombia.com.co/logo.png',
      callbackUrl: `${process.env.API_URL || 'https://api.egoscolombia.com.co'}/api/pagos/addi/webhook`,
      redirectionUrl: `${urlBase}/pago/respuesta?metodo=addi&pedido=${pedido.id}`,
    },
  };

  // ADDI responde 301 con header Location — desactivar follow redirect
  const res = await axios.post(
    `${ADDI_CONFIG.base_url}/v1/online-applications`,
    payload,
    {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      maxRedirects: 0,
      validateStatus: s => s === 301,
    }
  );
  const checkoutUrl = res.headers['location'];
  if (!checkoutUrl) throw new Error('ADDI no devolvió header Location');
  return { checkoutUrl };
}

function verificarWebhook(req) {
  const authHeader = req.headers['authorization'] || '';
  const expected = 'Basic ' + Buffer.from(`${ADDI_CONFIG.webhook_user}:${ADDI_CONFIG.webhook_pass}`).toString('base64');
  return authHeader === expected;
}

// approved | rejected | cancelled | fraud_prevention_rejected
function interpretarEstado(addiStatus) {
  const s = (addiStatus || '').toUpperCase();
  if (s === 'APPROVED') return { estado: 'Confirmado', exitoso: true };
  if (s === 'PENDING') return { estado: 'Creado', exitoso: false };
  return { estado: 'Cancelado', exitoso: false };
}

module.exports = { crearOrden, verificarWebhook, interpretarEstado, ADDI_CONFIG };
