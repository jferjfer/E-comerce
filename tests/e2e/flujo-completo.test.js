const request = require('supertest');

describe('E2E - Flujo Completo de Usuario', () => {
  const GATEWAY_URL = 'http://localhost:3000';
  let authToken = '';
  let userId = '';

  test('1. Login de usuario', async () => {
    const response = await request(GATEWAY_URL)
      .post('/api/auth/login')
      .send({
        email: 'demo@estilomoda.com',
        password: 'admin123'
      });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    
    authToken = response.body.token;
    userId = response.body.usuario.id;
  });

  test('2. Obtener lista de productos', async () => {
    const response = await request(GATEWAY_URL)
      .get('/api/productos')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.productos.length).toBeGreaterThan(0);
  });

  test('3. Ver detalle de un producto', async () => {
    const response = await request(GATEWAY_URL)
      .get('/api/productos/1')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('nombre');
    expect(response.body).toHaveProperty('precio');
  });

  test('4. Consultar cupones disponibles', async () => {
    const response = await request(GATEWAY_URL)
      .get('/api/cupones')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('cupones');
  });

  test('5. Usar chat de IA', async () => {
    const response = await request(GATEWAY_URL)
      .post('/api/chat')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        mensaje: 'Recomiéndame un producto',
        historial: []
      });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('respuesta');
  });

  test('6. Verificar token válido', async () => {
    const response = await request(GATEWAY_URL)
      .get('/api/auth/verificar')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('usuario');
  });
});
