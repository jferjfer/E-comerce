const request = require('supertest');

describe('Catalog Service - Pruebas Unitarias', () => {
  const BASE_URL = 'http://catalog-service:3002';

  test('GET /salud - Debe retornar estado activo', async () => {
    const response = await request(BASE_URL).get('/salud');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('estado', 'activo');
    expect(response.body).toHaveProperty('servicio', 'catalogo');
  });

  test('GET /api/productos - Debe retornar lista de productos', async () => {
    const response = await request(BASE_URL).get('/api/productos');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('productos');
    expect(Array.isArray(response.body.productos)).toBe(true);
    expect(response.body.productos.length).toBeGreaterThan(0);
  });

  test('GET /api/productos/:id - Debe retornar un producto específico', async () => {
    const response = await request(BASE_URL).get('/api/productos/1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('producto');
    expect(response.body.producto).toHaveProperty('id');
    expect(response.body.producto).toHaveProperty('nombre');
    expect(response.body.producto).toHaveProperty('precio');
  });

  test('GET /api/categorias - Debe retornar lista de categorías', async () => {
    const response = await request(BASE_URL).get('/api/categorias');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('categorias');
    expect(Array.isArray(response.body.categorias)).toBe(true);
  });

  test('GET /api/productos/:id - Producto inexistente debe retornar 404', async () => {
    const response = await request(BASE_URL).get('/api/productos/99999');
    
    expect(response.status).toBe(404);
  });
});
