import { API_URL } from '@/constants';

const getToken = (): string | null => {
  try {
    const { useAuthStore } = require('@/store/useAuthStore');
    return useAuthStore.getState().token;
  } catch {
    return null;
  }
};

// Fetch con token automático
async function fetchAuth(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  // 401 → cerrar sesión automáticamente
  if (res.status === 401) {
    try {
      const { useAuthStore } = require('@/store/useAuthStore');
      useAuthStore.getState().cerrarSesion();
    } catch {}
  }
  return res;
}

export const api = {
  // ── AUTH ─────────────────────────────────────────────────────────────────
  async login(email: string, password: string) {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return res.json();
  },

  async register(datos: any) {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
    });
    return res.json();
  },

  async recuperarContrasena(email: string) {
    const res = await fetch(`${API_URL}/api/auth/recuperar-contrasena`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return res.json();
  },

  // ── PERFIL ────────────────────────────────────────────────────────────────
  async getPerfil(token: string) {
    const res = await fetch(`${API_URL}/api/usuarios/perfil`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async actualizarPerfil(token: string, datos: any) {
    const res = await fetch(`${API_URL}/api/usuarios/perfil`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(datos),
    });
    return res.json();
  },

  // ── PRODUCTOS ─────────────────────────────────────────────────────────────
  async getProductos(params?: { categoria?: string; buscar?: string; limite?: number }) {
    const q = new URLSearchParams();
    if (params?.categoria) q.append('categoria', params.categoria);
    if (params?.buscar) q.append('buscar', params.buscar);
    if (params?.limite) q.append('limite', String(params.limite));
    const res = await fetch(`${API_URL}/api/productos?${q}`);
    return res.json();
  },

  async getProducto(id: string) {
    const res = await fetch(`${API_URL}/api/productos/${id}`);
    return res.json();
  },

  async getCategorias() {
    const res = await fetch(`${API_URL}/api/categorias`);
    return res.json();
  },

  // ── RESEÑAS ───────────────────────────────────────────────────────────────
  async getResenas(productoId: string) {
    const res = await fetch(`${API_URL}/api/resenas/${productoId}`);
    return res.json();
  },

  async crearResena(token: string, productoId: string, calificacion: number, comentario: string) {
    const res = await fetch(`${API_URL}/api/resenas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ producto_id: productoId, calificacion, comentario }),
    });
    return res.json();
  },

  // ── CARRITO ───────────────────────────────────────────────────────────────
  async getCarrito(token: string) {
    const res = await fetch(`${API_URL}/api/carrito`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async agregarAlCarrito(token: string, productoId: string, cantidad = 1) {
    const res = await fetch(`${API_URL}/api/carrito`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id_producto: productoId, cantidad }),
    });
    return res.json();
  },

  async eliminarDelCarrito(token: string, productoId: string) {
    const res = await fetch(`${API_URL}/api/carrito/${productoId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async vaciarCarritoBackend(token: string) {
    const res = await fetch(`${API_URL}/api/carrito`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  // ── PEDIDOS ───────────────────────────────────────────────────────────────
  async getPedidos(token: string) {
    console.log('🔍 [api.getPedidos] Llamando:', `${API_URL}/api/pedidos`);
    const res = await fetch(`${API_URL}/api/pedidos`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('🔍 [api.getPedidos] Status HTTP:', res.status);
    const data = await res.json();
    console.log('🔍 [api.getPedidos] Pedidos recibidos:', data?.pedidos?.length ?? 'sin pedidos');
    return data;
  },

  async checkout(token: string, datos: any) {
    const res = await fetch(`${API_URL}/api/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(datos),
    });
    return res.json();
  },

  async solicitarDevolucion(token: string, pedidoId: string, razon: string) {
    const res = await fetch(`${API_URL}/api/pedidos/${pedidoId}/devolucion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ razon }),
    });
    return res.json();
  },

  // ── FAVORITOS ─────────────────────────────────────────────────────────────
  async getFavoritos(token: string) {
    const res = await fetch(`${API_URL}/api/listas-deseos`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async addFavorito(token: string, productoId: string) {
    await fetch(`${API_URL}/api/listas-deseos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ producto_id: productoId }),
    });
  },

  async removeFavorito(token: string, productoId: string) {
    await fetch(`${API_URL}/api/listas-deseos/${productoId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // ── MARKETING ─────────────────────────────────────────────────────────────
  async getCampanas() {
    const res = await fetch(`${API_URL}/api/campanas`);
    return res.json();
  },

  async getCupones() {
    const res = await fetch(`${API_URL}/api/cupones`);
    return res.json();
  },

  async validarBono(codigo: string, usuarioId: string) {
    const res = await fetch(`${API_URL}/api/bonos/validar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo, usuario_id: parseInt(usuarioId) }),
    });
    return res.json();
  },

  async aplicarBono(codigo: string, usuarioId: string, pedidoId: string) {
    const res = await fetch(`${API_URL}/api/bonos/aplicar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo, usuario_id: parseInt(usuarioId), pedido_id: pedidoId }),
    });
    return res.json();
  },

  async getBonosUsuario(token: string, usuarioId: string) {
    const res = await fetch(`${API_URL}/api/bonos/usuario/${usuarioId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  // ── SOCIAL ────────────────────────────────────────────────────────────────
  async getPreguntas(productoId: string) {
    const res = await fetch(`${API_URL}/api/preguntas/${productoId}`);
    return res.json();
  },

  async crearPregunta(token: string, productoId: string, pregunta: string) {
    const res = await fetch(`${API_URL}/api/preguntas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ producto_id: productoId, pregunta }),
    });
    return res.json();
  },

  // ── IA ────────────────────────────────────────────────────────────────────
  async chatIA(mensaje: string, historial: any[] = [], usuarioId?: string, token?: string) {
    const res = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mensaje, historial, usuario_id: usuarioId ? String(usuarioId) : undefined, token }),
    });
    const data = await res.json();
    // El backend devuelve {respuesta, productos_recomendados} directamente
    // Normalizamos para que siempre tenga exito + respuesta
    return {
      exito: !!(data.respuesta || data.text || data.message),
      respuesta: data.respuesta || data.text || data.message || '',
      productos_recomendados: data.productos_recomendados || [],
      ...data,
    };
  },

  async getRecomendaciones(usuarioId: string, productosVistos: string[] = []) {
    const res = await fetch(`${API_URL}/api/recomendaciones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario_id: usuarioId, productos_vistos: productosVistos }),
    });
    return res.json();
  },

  // ── CRÉDITO ───────────────────────────────────────────────────────────────
  async evaluarCredito(token: string, usuario: any) {
    const res = await fetch(`${API_URL}/api/credito/evaluar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        usuario_id: parseInt(usuario.id),
        fecha_registro: usuario.fecha_creacion || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        total_compras_historico: usuario.total_compras_historico || 0,
        numero_compras: usuario.numero_compras || 0,
      }),
    });
    return res.json();
  },

  async solicitarCredito(token: string, usuarioId: string, monto: number, plazo: number) {
    const res = await fetch(`${API_URL}/api/credito/interno/solicitar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ usuario_id: parseInt(usuarioId), monto_solicitado: monto, plazo_meses: plazo }),
    });
    return res.json();
  },

  async getCreditosUsuario(token: string, usuarioId: string) {
    const res = await fetch(`${API_URL}/api/credito/interno/usuario/${usuarioId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  // ── LOGÍSTICA / ENVÍOS ────────────────────────────────────────────────────
  async analizarEstilo(descripcion: string, categoria?: string) {
    const res = await fetch(`${API_URL}/api/estilos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ descripcion, categoria }),
    });
    const data = await res.json();
    return { exito: true, estilos: data.estilos || [], recomendaciones: data.recomendaciones || [], ...data };
  },

  async getEstadoEnvio(token: string, pedidoId: string) {
    const res = await fetch(`${API_URL}/api/envios/pedido/${pedidoId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },
};
