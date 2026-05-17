/**
 * Tests unitarios — Credit Service: generar-manual de bonos
 * Verifica que solo customer_success puede generar bonos de compensación
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');

const BASE_URL = process.env.CREDIT_URL || 'http://localhost:3008';
const JWT_SECRETO = process.env.JWT_SECRETO || 'test_secret';

// Genera un JWT con el rol indicado
function generarToken(rol, id = 99) {
  return jwt.sign(
    { id, email: `${rol}@egoscolombia.com`, rol, activo: true },
    JWT_SECRETO,
    { expiresIn: '1h' }
  );
}

const USUARIO_ID_PRUEBA = 1;

describe('Credit Service — Salud', () => {
  test('GET /salud retorna estado activo', async () => {
    const res = await request(BASE_URL).get('/salud');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('estado', 'activo');
    expect(res.body).toHaveProperty('servicio', 'credito');
  });
});

describe('Credit Service — Generar bono manual (solo customer_success)', () => {
  test('sin token retorna 401', async () => {
    const res = await request(BASE_URL)
      .post(`/api/bonos/generar-manual/${USUARIO_ID_PRUEBA}`);
    expect(res.status).toBe(401);
  });

  test('token con rol ceo retorna 403', async () => {
    const token = generarToken('ceo');
    const res = await request(BASE_URL)
      .post(`/api/bonos/generar-manual/${USUARIO_ID_PRUEBA}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.detail).toMatch(/customer_success/i);
  });

  test('token con rol cliente retorna 403', async () => {
    const token = generarToken('cliente');
    const res = await request(BASE_URL)
      .post(`/api/bonos/generar-manual/${USUARIO_ID_PRUEBA}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  test('token con rol rrhh retorna 403', async () => {
    const token = generarToken('rrhh');
    const res = await request(BASE_URL)
      .post(`/api/bonos/generar-manual/${USUARIO_ID_PRUEBA}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  test('token con rol customer_success genera bono exitosamente', async () => {
    const token = generarToken('customer_success');
    const res = await request(BASE_URL)
      .post(`/api/bonos/generar-manual/${USUARIO_ID_PRUEBA}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('codigo');
    expect(res.body).toHaveProperty('monto', 100000);
    expect(res.body).toHaveProperty('fecha_vencimiento');
    expect(res.body).toHaveProperty('generado_por', 'customer_success@egoscolombia.com');
    // El código debe tener formato EGOS + 6 chars
    expect(res.body.codigo).toMatch(/^EGOS[A-Z0-9]{6}$/);
  }, 15000);

  test('token expirado retorna 401', async () => {
    const token = jwt.sign(
      { id: 1, email: 'cs@egos.com', rol: 'customer_success', activo: true },
      JWT_SECRETO,
      { expiresIn: '-1s' }
    );
    const res = await request(BASE_URL)
      .post(`/api/bonos/generar-manual/${USUARIO_ID_PRUEBA}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });
});
