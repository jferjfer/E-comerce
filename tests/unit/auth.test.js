/**
 * Tests unitarios — Auth Service
 */

const request = require('supertest');

const BASE_URL = process.env.AUTH_URL || 'http://localhost:3011';

describe('Auth Service — Salud', () => {
  test('GET /salud retorna estado activo', async () => {
    const res = await request(BASE_URL).get('/salud');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('estado', 'activo');
    expect(res.body).toHaveProperty('servicio', 'autenticacion');
  });
});

describe('Auth Service — Login', () => {
  test('login exitoso con credenciales válidas', async () => {
    const res = await request(BASE_URL)
      .post('/api/auth/login')
      .send({ email: 'demo@egoscolombia.com', password: 'admin123' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('exito', true);
    expect(res.body.token || res.body.datos?.token).toBeTruthy();
  }, 10000);

  test('login fallido con contraseña incorrecta retorna exito:false', async () => {
    const res = await request(BASE_URL)
      .post('/api/auth/login')
      .send({ email: 'demo@egoscolombia.com', password: 'wrongpass' });
    expect(res.body).toHaveProperty('exito', false);
  }, 10000);

  test('login con email inexistente retorna exito:false', async () => {
    const res = await request(BASE_URL)
      .post('/api/auth/login')
      .send({ email: 'noexiste_xyz@test.com', password: 'cualquiera' });
    expect(res.body).toHaveProperty('exito', false);
  }, 10000);

  test('login sin body retorna error', async () => {
    const res = await request(BASE_URL).post('/api/auth/login').send({});
    expect([400, 422, 200]).toContain(res.status);
    if (res.status === 200) expect(res.body.exito).toBe(false);
  });
});

describe('Auth Service — Registro', () => {
  test('email duplicado debe fallar', async () => {
    const res = await request(BASE_URL)
      .post('/api/auth/register')
      .send({
        nombre: 'Test',
        email: 'demo@egoscolombia.com',
        password: 'test123',
        acepta_terminos: true,
        acepta_datos: true
      });
    expect([200, 400]).toContain(res.status);
    if (res.status === 200) expect(res.body.exito).toBe(false);
  }, 10000);

  test('registro sin email retorna error de validación', async () => {
    const res = await request(BASE_URL)
      .post('/api/auth/register')
      .send({ nombre: 'Test', password: 'test123' });
    expect([400, 422]).toContain(res.status);
  });
});

describe('Auth Service — Token', () => {
  let token = null;

  beforeAll(async () => {
    const res = await request(BASE_URL)
      .post('/api/auth/login')
      .send({ email: 'demo@egoscolombia.com', password: 'admin123' });
    token = res.body?.token || res.body?.datos?.token;
  }, 10000);

  test('token obtenido en login es un JWT válido (3 partes)', () => {
    if (!token) return;
    const partes = token.split('.');
    expect(partes.length).toBe(3);
  });

  test('GET /api/usuarios/perfil con token válido retorna 200', async () => {
    if (!token) return;
    const res = await request(BASE_URL)
      .get('/api/usuarios/perfil')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  test('GET /api/usuarios/perfil sin token retorna 401', async () => {
    const res = await request(BASE_URL).get('/api/usuarios/perfil');
    expect(res.status).toBe(401);
  });
});
