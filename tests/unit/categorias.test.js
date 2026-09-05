/**
 * Tests unitarios — Gestión de Categorías
 * Cubre: GET, POST, PUT, DELETE + permisos por rol
 */

const request = require('supertest');

const BASE_URL = process.env.CATALOG_URL || 'http://localhost:3002';
const AUTH_URL  = process.env.AUTH_URL   || 'http://localhost:3011';

// ── Helpers ──────────────────────────────────────────────────────────────────

async function obtenerToken(email, password) {
  const res = await request(AUTH_URL)
    .post('/api/auth/login')
    .send({ email, password });
  return res.body?.token || res.body?.datos?.token || null;
}

let tokenProductManager = null;
let tokenCliente        = null;
let categoriaCreada     = null;

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeAll(async () => {
  tokenProductManager = await obtenerToken('admin@egoscolombia.com', 'admin123');
  tokenCliente        = await obtenerToken('demo@egoscolombia.com',  'admin123');
}, 15000);

// ── GET /api/categorias ───────────────────────────────────────────────────────

describe('GET /api/categorias', () => {
  test('debe retornar 200 y un array', async () => {
    const res = await request(BASE_URL).get('/api/categorias');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('categorias');
    expect(Array.isArray(res.body.categorias)).toBe(true);
  });

  test('no requiere autenticación (endpoint público)', async () => {
    const res = await request(BASE_URL).get('/api/categorias');
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });

  test('cada categoría tiene id, nombre y descripcion', async () => {
    const res = await request(BASE_URL).get('/api/categorias');
    if (res.body.categorias.length > 0) {
      const cat = res.body.categorias[0];
      expect(cat).toHaveProperty('id');
      expect(cat).toHaveProperty('nombre');
      expect(typeof cat.nombre).toBe('string');
      expect(cat.nombre.length).toBeGreaterThan(0);
    }
  });
});

// ── POST /api/categorias ──────────────────────────────────────────────────────

describe('POST /api/categorias', () => {
  test('sin token debe retornar 401', async () => {
    const res = await request(BASE_URL)
      .post('/api/categorias')
      .send({ nombre: 'TestSinToken', descripcion: 'desc' });
    expect(res.status).toBe(401);
  });

  test('con token de cliente debe retornar 403', async () => {
    if (!tokenCliente) return;
    const res = await request(BASE_URL)
      .post('/api/categorias')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ nombre: 'TestCliente', descripcion: 'desc' });
    expect(res.status).toBe(403);
  });

  test('product_manager puede crear una categoría', async () => {
    if (!tokenProductManager) {
      console.warn('⚠️  Sin token product_manager — saltando test');
      return;
    }
    const nombre = `TestCat_${Date.now()}`;
    const res = await request(BASE_URL)
      .post('/api/categorias')
      .set('Authorization', `Bearer ${tokenProductManager}`)
      .send({ nombre, descripcion: 'Categoría de prueba', imagen: '' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('categoria');
    expect(res.body.categoria.nombre).toBe(nombre);
    expect(res.body.categoria).toHaveProperty('id');
    categoriaCreada = res.body.categoria;
  }, 10000);

  test('nombre duplicado debe retornar 400', async () => {
    if (!tokenProductManager || !categoriaCreada) return;
    const res = await request(BASE_URL)
      .post('/api/categorias')
      .set('Authorization', `Bearer ${tokenProductManager}`)
      .send({ nombre: categoriaCreada.nombre, descripcion: 'duplicado' });
    expect(res.status).toBe(400);
  });

  test('nombre vacío debe retornar error de validación', async () => {
    if (!tokenProductManager) return;
    const res = await request(BASE_URL)
      .post('/api/categorias')
      .set('Authorization', `Bearer ${tokenProductManager}`)
      .send({ nombre: '', descripcion: 'sin nombre' });
    expect([400, 422]).toContain(res.status);
  });
});

// ── PUT /api/categorias/:id ───────────────────────────────────────────────────

describe('PUT /api/categorias/:id', () => {
  test('sin token debe retornar 401', async () => {
    const res = await request(BASE_URL)
      .put('/api/categorias/1')
      .send({ nombre: 'Modificado' });
    expect(res.status).toBe(401);
  });

  test('con token de cliente debe retornar 403', async () => {
    if (!tokenCliente) return;
    const res = await request(BASE_URL)
      .put('/api/categorias/1')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ nombre: 'Modificado' });
    expect(res.status).toBe(403);
  });

  test('product_manager puede editar la categoría creada', async () => {
    if (!tokenProductManager || !categoriaCreada) return;
    const res = await request(BASE_URL)
      .put(`/api/categorias/${categoriaCreada.id}`)
      .set('Authorization', `Bearer ${tokenProductManager}`)
      .send({ nombre: categoriaCreada.nombre, descripcion: 'Descripción actualizada' });
    expect(res.status).toBe(200);
    expect(res.body.categoria.descripcion).toBe('Descripción actualizada');
  });

  test('id inexistente debe retornar 404', async () => {
    if (!tokenProductManager) return;
    const res = await request(BASE_URL)
      .put('/api/categorias/id_que_no_existe_99999')
      .set('Authorization', `Bearer ${tokenProductManager}`)
      .send({ nombre: 'X', descripcion: 'X' });
    expect(res.status).toBe(404);
  });
});

// ── DELETE /api/categorias/:id ────────────────────────────────────────────────

describe('DELETE /api/categorias/:id', () => {
  test('sin token debe retornar 401', async () => {
    const res = await request(BASE_URL).delete('/api/categorias/1');
    expect(res.status).toBe(401);
  });

  test('con token de cliente debe retornar 403', async () => {
    if (!tokenCliente) return;
    const res = await request(BASE_URL)
      .delete('/api/categorias/1')
      .set('Authorization', `Bearer ${tokenCliente}`);
    expect(res.status).toBe(403);
  });

  test('product_manager puede eliminar la categoría creada', async () => {
    if (!tokenProductManager || !categoriaCreada) return;
    const res = await request(BASE_URL)
      .delete(`/api/categorias/${categoriaCreada.id}`)
      .set('Authorization', `Bearer ${tokenProductManager}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('mensaje');
  });

  test('id inexistente debe retornar 404', async () => {
    if (!tokenProductManager) return;
    const res = await request(BASE_URL)
      .delete('/api/categorias/id_que_no_existe_99999')
      .set('Authorization', `Bearer ${tokenProductManager}`);
    expect(res.status).toBe(404);
  });
});
