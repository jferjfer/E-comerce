import { API_URL } from '@/constants';
import { Producto, Usuario, ItemCarrito } from '@/types';

// Helper para obtener token del store
const getToken = async () => {
  const { useAuthStore } = await import('@/store/useAuthStore');
  return useAuthStore.getState().token;
};

export const api = {
  // ── AUTH ─────────────────────────────────────────────
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

  async getPerfil(token: string) {
    const res = await fetch(`${API_URL}/api/usuarios/perfil`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  // ── PRODUCTOS ─────────────────────────────────────────
  async getProductos(params?: {
    categoria?: string;
    buscar?: string;
    limite?: number;
    pagina?: number;
  }) {
    const query = new URLSearchParams();
    if (params?.categoria) query.append('categoria', params.categoria);
    if (params?.buscar) query.append('buscar', params.buscar);
    if (params?.limite) query.append('limite', String(params.limite));
    if (params?.pagina) query.append('pagina', String(params.pagina));

    const res = await fetch(`${API_URL}/api/productos?${query}`);
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

  // ── CARRITO ───────────────────────────────────────────
  async getCarrito(token: string) {
    const res = await fetch(`${API_URL}/api/carrito`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async agregarAlCarrito(token: string, productoId: string, cantidad = 1) {
    const res = await fetch(`${API_URL}/api/carrito`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
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

  // ── PEDIDOS ───────────────────────────────────────────
  async checkout(token: string, datos: any) {
    const res = await fetch(`${API_URL}/api/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(datos),
    });
    return res.json();
  },

  async getPedidos(token: string) {
    const res = await fetch(`${API_URL}/api/pedidos`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  // ── BONOS ─────────────────────────────────────────────
  async getBonos(usuarioId: string, token: string) {
    const res = await fetch(`${API_URL}/api/bonos/usuario/${usuarioId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
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

  // ── IA ────────────────────────────────────────────────
  async chatIA(mensaje: string, historial: any[] = [], usuarioId?: string, token?: string) {
    const res = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mensaje, historial, usuario_id: usuarioId, token }),
    });
    return res.json();
  },

  async getRecomendaciones(usuarioId: string, productosVistos: string[] = []) {
    const res = await fetch(`${API_URL}/api/recomendaciones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario_id: usuarioId, productos_vistos: productosVistos }),
    });
    return res.json();
  },
};
