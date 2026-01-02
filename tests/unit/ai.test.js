const request = require('supertest');

describe('AI Service - Pruebas Unitarias', () => {
  const BASE_URL = 'http://ai-service:3007';

  test('GET /salud - Debe retornar estado activo', async () => {
    const response = await request(BASE_URL).get('/salud');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('estado', 'activo');
    expect(response.body).toHaveProperty('servicio', 'inteligencia-artificial-unificado');
    expect(response.body).toHaveProperty('openai_configurado');
  });

  test('POST /api/chat - Debe responder a mensaje simple', async () => {
    const response = await request(BASE_URL)
      .post('/api/chat')
      .send({
        mensaje: 'Hola',
        historial: []
      });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('respuesta');
    expect(response.body).toHaveProperty('productos_recomendados');
    expect(Array.isArray(response.body.productos_recomendados)).toBe(true);
  });

  test('POST /api/chat - Debe recomendar productos', async () => {
    const response = await request(BASE_URL)
      .post('/api/chat')
      .send({
        mensaje: 'Necesito un vestido para una boda',
        historial: []
      });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('respuesta');
    expect(typeof response.body.respuesta).toBe('string');
    expect(response.body.respuesta.length).toBeGreaterThan(0);
  });

  test('Estadísticas deben mostrar productos disponibles', async () => {
    const response = await request(BASE_URL).get('/salud');
    
    expect(response.body).toHaveProperty('estadisticas');
    expect(response.body.estadisticas).toHaveProperty('productos_disponibles');
    expect(response.body.estadisticas.productos_disponibles).toBeGreaterThan(0);
  });
});
