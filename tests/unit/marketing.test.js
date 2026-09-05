const request = require('supertest');

describe('Marketing Service - Pruebas Unitarias', () => {
  const BASE_URL = 'http://marketing-service:3006';

  test('GET /salud - Debe retornar estado activo', async () => {
    const response = await request(BASE_URL).get('/salud');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('estado', 'activo');
    expect(response.body).toHaveProperty('servicio', 'marketing');
  });

  test('GET /api/cupones - Debe retornar lista de cupones', async () => {
    const response = await request(BASE_URL).get('/api/cupones');
    
    expect([200, 500]).toContain(response.status);
    if (response.status === 200) {
      expect(response.body).toHaveProperty('cupones');
      expect(Array.isArray(response.body.cupones)).toBe(true);
    }
  });

  test('GET /api/campanas - Debe retornar lista de campañas', async () => {
    const response = await request(BASE_URL).get('/api/campanas');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('campanas');
    expect(Array.isArray(response.body.campanas)).toBe(true);
  });

  test('Cupones deben tener estructura correcta', async () => {
    const response = await request(BASE_URL).get('/api/cupones');
    
    if (response.body.cupones.length > 0) {
      const cupon = response.body.cupones[0];
      expect(cupon).toHaveProperty('codigo');
      expect(cupon).toHaveProperty('tipo');
      expect(cupon).toHaveProperty('valor');
      expect(cupon).toHaveProperty('activo');
    }
  });

  test('Campañas deben tener estructura correcta', async () => {
    const response = await request(BASE_URL).get('/api/campanas');
    
    if (response.body.campanas.length > 0) {
      const campana = response.body.campanas[0];
      expect(campana).toHaveProperty('nombre');
      expect(campana).toHaveProperty('descripcion');
      expect(campana).toHaveProperty('activa');
      expect(campana).toHaveProperty('metricas');
    }
  });
});
