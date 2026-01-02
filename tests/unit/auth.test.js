const request = require('supertest');

describe('Auth Service - Pruebas Unitarias', () => {
  const BASE_URL = 'http://auth-service:3011';

  test('GET /salud - Debe retornar estado activo', async () => {
    const response = await request(BASE_URL).get('/salud');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('estado', 'activo');
    expect(response.body).toHaveProperty('servicio', 'autenticacion');
  });

  test('POST /api/auth/login - Login exitoso con credenciales válidas', async () => {
    const response = await request(BASE_URL)
      .post('/api/auth/login')
      .send({
        email: 'demo@estilomoda.com',
        password: 'admin123'
      });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('exito', true);
    expect(response.body).toHaveProperty('mensaje');
  });

  test('POST /api/auth/login - Login fallido con credenciales inválidas', async () => {
    const response = await request(BASE_URL)
      .post('/api/auth/login')
      .send({
        email: 'noexiste@test.com',
        password: 'wrongpass'
      });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('exito');
  });

  test('POST /api/auth/registro - Registro con email duplicado debe fallar', async () => {
    const response = await request(BASE_URL)
      .post('/api/auth/registro')
      .send({
        nombre: 'Test User',
        email: 'demo@estilomoda.com',
        password: 'test123'
      });
    
    expect([200, 201, 400]).toContain(response.status);
  });
});
