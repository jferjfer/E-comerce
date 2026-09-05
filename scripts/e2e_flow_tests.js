#!/usr/bin/env node
/**
 * Script E2E ligero para testear flujos críticos del sistema
 * - Registro de usuario
 * - Login
 * - Listado de productos
 * - Agregar producto al carrito
 * - Obtener carrito
 * - Checkout
 *
 * Uso (PowerShell):
 *   node .\scripts\e2e_flow_tests.js
 *
 * Nota: este script usa el Gateway en http://localhost:3000. Asegúrate de
 * iniciar los servicios con `node iniciar-todos-servicios.js` antes de ejecutar.
 */

const axios = require('axios');

const API = axios.create({
  baseURL: 'http://localhost:3000',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

function extractTokenFromResponse(respData) {
  if (!respData) return null;
  if (typeof respData === 'string') return null;
  if (respData.token) return respData.token;
  if (respData.datos && respData.datos.token) return respData.datos.token;
  if (respData.data && respData.data.token) return respData.data.token;
  return null;
}

async function main() {
  console.log('\n=== E2E FLOW TEST START ===\n');

  const timestamp = Date.now();
  const testEmail = `e2e_${timestamp}@test.local`;
  const testPassword = 'Pruebas123!';
  const nombre = 'Usuario E2E';

  const results = [];

  // 1) Registro
  try {
    console.log('1) Registrando usuario:', testEmail);
    const res = await API.post('/api/auth/register', {
      nombre,
      email: testEmail,
      password: testPassword
    });

    const tokenReg = extractTokenFromResponse(res.data) || (res.data && res.data.datos && res.data.datos.token);
    const usuarioReg = (res.data && (res.data.datos || res.data)).usuario || null;

    if (res.status === 201 && tokenReg) {
      console.log('   ✅ Registro OK - token recibido');
      results.push({ step: 'registro', ok: true, token: tokenReg, usuario: usuarioReg });
    } else {
      console.warn('   ⚠️ Registro: respuesta inesperada', res.status, res.data);
      results.push({ step: 'registro', ok: false, data: res.data });
    }
  } catch (err) {
    console.error('   ❌ Error en registro:', err.response ? err.response.data : err.message);
    results.push({ step: 'registro', ok: false, error: err.response ? err.response.data : err.message });
  }

  // 2) Login
  let token = null;
  try {
    console.log('\n2) Iniciando sesión con usuario registrado');
    const res = await API.post('/api/auth/login', { email: testEmail, password: testPassword });
    token = extractTokenFromResponse(res.data) || (res.data && res.data.datos && res.data.datos.token);

    if (token) {
      console.log('   ✅ Login OK - token extraído');
      results.push({ step: 'login', ok: true, token });
    } else {
      console.warn('   ⚠️ Login: token no encontrado en respuesta', res.data);
      results.push({ step: 'login', ok: false, data: res.data });
    }
  } catch (err) {
    console.error('   ❌ Error en login:', err.response ? err.response.data : err.message);
    results.push({ step: 'login', ok: false, error: err.response ? err.response.data : err.message });
  }

  // Ensure we have a token for the following steps (some services accept any token present)
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  // 3) Obtener productos
  let productos = [];
  try {
    console.log('\n3) Obteniendo listado de productos');
    const res = await API.get('/api/productos');
    productos = (res.data && res.data.productos) || res.data || [];
    console.log(`   ✅ Productos obtenidos: ${productos.length}`);
    results.push({ step: 'productos', ok: true, total: productos.length });
  } catch (err) {
    console.error('   ❌ Error obteniendo productos:', err.response ? err.response.data : err.message);
    results.push({ step: 'productos', ok: false, error: err.response ? err.response.data : err.message });
  }

  // 4) Agregar producto al carrito
  let carrito = null;
  try {
    console.log('\n4) Agregando producto al carrito');
    const productoId = (productos[0] && productos[0].id) || 'prod_demo_1';
    const res = await API.post('/api/carrito', { id_producto: productoId, cantidad: 1 }, { headers: authHeader });
    console.log('   ✅ Agregado al carrito:', res.data && (res.data.mensaje || 'OK'));
    results.push({ step: 'agregar_carrito', ok: true, data: res.data });
  } catch (err) {
    console.error('   ❌ Error agregando al carrito:', err.response ? err.response.data : err.message);
    results.push({ step: 'agregar_carrito', ok: false, error: err.response ? err.response.data : err.message });
  }

  // 5) Obtener carrito
  try {
    console.log('\n5) Obteniendo carrito del usuario');
    const res = await API.get('/api/carrito', { headers: authHeader });
    carrito = (res.data && (res.data.datos || res.data)) || null;
    console.log('   ✅ Carrito:', carrito && (carrito.productos ? `${carrito.productos.length} items` : JSON.stringify(carrito)));
    results.push({ step: 'obtener_carrito', ok: true, carrito });
  } catch (err) {
    console.error('   ❌ Error obteniendo carrito:', err.response ? err.response.data : err.message);
    results.push({ step: 'obtener_carrito', ok: false, error: err.response ? err.response.data : err.message });
  }

  // 6) Obtener perfil de usuario autenticado
  try {
    console.log('\n6) Solicitando perfil de usuario autenticado');
    const res = await API.get('/api/usuarios/perfil', { headers: authHeader });
    const perfil = res.data && (res.data.datos || res.data);
    console.log('   ✅ Perfil obtenido:', perfil && perfil.email ? perfil.email : 'OK');
    results.push({ step: 'perfil', ok: true, perfil });
  } catch (err) {
    console.error('   ❌ Error obteniendo perfil:', err.response ? err.response.data : err.message);
    results.push({ step: 'perfil', ok: false, error: err.response ? err.response.data : err.message });
  }

  // 6) Checkout
  try {
    console.log('\n6) Realizando checkout');
    const res = await API.post('/api/checkout', { metodo_pago: 'Tarjeta', direccion_envio: { direccion: 'Calle Falsa 123', ciudad: 'Bogotá' } }, { headers: authHeader });
    console.log('   ✅ Checkout:', res.data && (res.data.mensaje || 'OK'));
    results.push({ step: 'checkout', ok: true, pedido: res.data && res.data.pedido });
  } catch (err) {
    console.error('   ❌ Error en checkout:', err.response ? err.response.data : err.message);
    results.push({ step: 'checkout', ok: false, error: err.response ? err.response.data : err.message });
  }

  // 7) Solicitar recuperación de contraseña (flujo de solicitud)
  try {
    console.log('\n7) Solicitando recuperación de contraseña (request)');
    const res = await API.post('/api/auth/solicitar-recuperacion', { email: testEmail });
    console.log('   ✅ Respuesta solicitud recuperación:', res.data && res.data.mensaje ? res.data.mensaje : JSON.stringify(res.data));
    results.push({ step: 'solicitar_recuperacion', ok: true, data: res.data });
  } catch (err) {
    console.error('   ❌ Error solicitando recuperación:', err.response ? err.response.data : err.message);
    results.push({ step: 'solicitar_recuperacion', ok: false, error: err.response ? err.response.data : err.message });
  }

  // 8) Intentar restablecer contraseña con token inválido (debe fallar correctamente)
  try {
    console.log('\n8) Intentando restablecer contraseña con token inválido (debe responder error)');
    const res = await API.post('/api/auth/restablecer-contrasena', { token: 'token_invalido_de_prueba', nuevaContrasena: 'NuevaPrueba123' });
    // Si responde 200, marcar como fallo porque esperamos error de token
    console.warn('   ⚠️ Restablecer contraseña respondió 200 (se esperaba error):', res.data);
    results.push({ step: 'restablecer_contrasena_invalid', ok: false, data: res.data });
  } catch (err) {
    console.log('   ✅ Restablecer contraseña con token inválido devolvió error (esperado):', err.response ? err.response.data : err.message);
    results.push({ step: 'restablecer_contrasena_invalid', ok: true });
  }

  // 9) Logout
  try {
    console.log('\n9) Cerrando sesión (logout)');
    const res = await API.post('/api/auth/logout', {}, { headers: authHeader });
    console.log('   ✅ Logout:', res.data && res.data.mensaje ? res.data.mensaje : 'OK');
    results.push({ step: 'logout', ok: true });
  } catch (err) {
    console.error('   ❌ Error en logout:', err.response ? err.response.data : err.message);
    results.push({ step: 'logout', ok: false, error: err.response ? err.response.data : err.message });
  }

  // Resumen
  console.log('\n=== E2E FLOW TEST SUMMARY ===');
  results.forEach(r => {
    console.log(`- ${r.step}: ${r.ok ? 'OK' : 'FAIL'}` + (r.error ? ` - ${JSON.stringify(r.error)}` : ''));
  });

  const allOk = results.every(r => r.ok);
  console.log(`\nRESULTADO FINAL: ${allOk ? 'TODAS LAS PRUEBAS PASARON ✅' : 'HUBO FALLAS ❌'}`);

  process.exit(allOk ? 0 : 1);
}

main().catch(err => {
  console.error('Script terminado con error:', err);
  process.exit(2);
});
