const request = require('supertest');

describe('Gateway - Pruebas de Integración', () => {
  const BASE_URL = 'http://localhost:3000';

  test('GET /salud - Gateway debe estar activo', async () => {
    const response = await request(BASE_URL).get('/salud');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('estado', 'activo');
    expect(response.body).toHaveProperty('gateway');
  });

  test('GET /estado-servicios - Debe retornar estado de todos los servicios', async () => {
    const response = await request(BASE_URL).get('/estado-servicios');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('resumen');
    expect(response.body).toHaveProperty('servicios');
    expect(response.body.resumen).toHaveProperty('total_servicios');
    expect(response.body.resumen).toHaveProperty('servicios_activos');
  });

  test('Proxy a /api/productos debe funcionar', async () => {
    const response = await request(BASE_URL).get('/api/productos');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('productos');
  });

  test('Proxy a /api/cupones debe funcionar', async () => {
    const response = await request(BASE_URL).get('/api/cupones');
    
    expect(response.status).toBe(200);
  });

  test('Ruta inexistente debe retornar 404', async () => {
    const response = await request(BASE_URL).get('/api/ruta-inexistente');
    
    expect(response.status).toBe(404);
  });
});
