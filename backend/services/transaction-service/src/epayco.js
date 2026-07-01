/**
 * ePayco Integration — EGOS
 * Documentación: https://docs.epayco.co
 * 
 * Variables de entorno requeridas (agregar cuando tengas cuenta):
 *   EPAYCO_P_CUST_ID   → Customer ID (ej: 12345)
 *   EPAYCO_P_KEY       → Public Key (ej: abc123...)
 *   EPAYCO_PRIVATE_KEY → Private Key (ej: xyz789...)
 *   EPAYCO_TEST        → "true" en pruebas, "false" en producción
 */

const crypto = require('crypto');
const axios = require('axios');

// ============================================
// CONFIGURACIÓN
// ============================================
const EPAYCO_CONFIG = {
  p_cust_id:    process.env.EPAYCO_P_CUST_ID,
  p_key:        process.env.EPAYCO_P_KEY,
  public_key:   process.env.EPAYCO_PUBLIC_KEY,
  private_key:  process.env.EPAYCO_PRIVATE_KEY,
  test:         process.env.EPAYCO_TEST === 'true',
  currency:     'COP',
  country:      'CO',
  lang:         'es',
  external:     'false',
  response_url: `${process.env.FRONTEND_URL || 'https://egoscolombia.com.co'}/pago/respuesta`,
  confirmation_url: `${process.env.BACKEND_URL || 'https://api.egoscolombia.com.co'}/api/pagos/epayco/confirmar`,
};

const estaConfigurado = () => {
  return !!(EPAYCO_CONFIG.p_cust_id && EPAYCO_CONFIG.p_key && EPAYCO_CONFIG.private_key);
};

// ============================================
// GENERAR FIRMA DE SEGURIDAD
// Fórmula oficial ePayco: MD5(p_cust_id^p_key^x_ref_payco^x_transaction_id^x_amount^x_currency_code)
// Separador ^ obligatorio entre cada campo
// ============================================
const generarFirma = (refPayco, transactionId, amount, currencyCode) => {
  const cadena = `${EPAYCO_CONFIG.p_cust_id}^${EPAYCO_CONFIG.p_key}^${refPayco}^${transactionId}^${amount}^${currencyCode}`;
  return crypto.createHash('md5').update(cadena).digest('hex');
};

// ============================================
// VERIFICAR FIRMA DEL WEBHOOK
// ============================================
const verificarFirmaWebhook = (datos) => {
  const { x_ref_payco, x_transaction_id, x_amount, x_currency_code, x_signature } = datos;
  if (!x_ref_payco || !x_transaction_id || !x_amount || !x_currency_code || !x_signature) {
    console.error('❌ Webhook ePayco: faltan campos para verificar firma');
    return false;
  }
  const firmaEsperada = generarFirma(x_ref_payco, x_transaction_id, x_amount, x_currency_code);
  const coincide = firmaEsperada === x_signature;
  console.log(`🔐 Firma esperada: ${firmaEsperada} | Firma recibida: ${x_signature} | Válida: ${coincide}`);
  return coincide;
};

// ============================================
// GENERAR DATOS PARA EL WIDGET DE EPAYCO
// Estos datos se envían al frontend para inicializar el widget
// ============================================
const generarDatosWidget = (pedido, cliente) => {
  const monto = parseFloat(pedido.total).toFixed(2);
  
  return {
    // Credenciales
    p_cust_id:    EPAYCO_CONFIG.p_cust_id,
    p_key:        EPAYCO_CONFIG.p_key,
    public_key:   EPAYCO_CONFIG.public_key,
    
    // Datos del pago
    name:         `Pedido EGOS #${pedido.id}`,
    description:  `Compra en EGOS — ${pedido.productos?.length || 1} producto(s)`,
    invoice:      pedido.id,
    currency:     EPAYCO_CONFIG.currency,
    amount:       monto,
    // Ropa colombiana: IVA 0% cuando precio < 4 UVT (~$185.000 COP) — Art. 468-1 ET
    tax_base:     monto,
    tax:          '0',
    country:      EPAYCO_CONFIG.country,
    lang:         EPAYCO_CONFIG.lang,
    
    // URLs de respuesta
    response:     EPAYCO_CONFIG.response_url,
    confirmation: EPAYCO_CONFIG.confirmation_url,
    
    // Datos del cliente
    name_billing:  cliente.nombre || 'Cliente EGOS',
    address_billing: cliente.direccion || 'Bogotá D.C.',
    type_doc_billing: cliente.documento_tipo || 'CC',
    mobilephone_billing: cliente.telefono || '',
    number_doc_billing: cliente.documento_numero || '',
    email_billing: cliente.email || '',
    
    // Configuración
    test:         EPAYCO_CONFIG.test,
    external:     EPAYCO_CONFIG.external,
    
    // Referencia interna
    extra1:       pedido.id,
    extra2:       String(pedido.usuario_id),
    extra3:       'EGOS_ECOMMERCE',
  };
};

// ============================================
// CONSULTAR ESTADO DE UN PAGO
// ============================================
const consultarPago = async (refPayco) => {
  try {
    const url = `https://secure.epayco.co/validation/v1/reference/${refPayco}`;
    const response = await axios.get(url, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error consultando pago ePayco:', error.message);
    throw error;
  }
};

// ============================================
// INTERPRETAR ESTADO DE EPAYCO
// Códigos: 1=Aceptada, 2=Rechazada, 3=Pendiente, 4=Fallida, 6=Reversada, 7=Retenida
// ============================================
const interpretarEstado = (codigoRespuesta) => {
  const estados = {
    '1': { estado: 'Confirmado', descripcion: 'Pago aceptado', exitoso: true },
    '2': { estado: 'Cancelado',  descripcion: 'Pago rechazado', exitoso: false },
    '3': { estado: 'Creado',     descripcion: 'Pago pendiente', exitoso: false },
    '4': { estado: 'Cancelado',  descripcion: 'Pago fallido', exitoso: false },
    '6': { estado: 'Cancelado',  descripcion: 'Pago reversado', exitoso: false },
    '7': { estado: 'Creado',     descripcion: 'Pago retenido para revisión', exitoso: false },
  };
  return estados[String(codigoRespuesta)] || { estado: 'Creado', descripcion: 'Estado desconocido', exitoso: false };
};

module.exports = {
  EPAYCO_CONFIG,
  estaConfigurado,
  generarDatosWidget,
  verificarFirmaWebhook,
  consultarPago,
  interpretarEstado,
};
