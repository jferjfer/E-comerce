import { API_URL as API_BASE_URL } from '../config/api';
import type { Producto, Usuario, ItemCarrito } from '../types';

// ============================================
// FETCH CON AUTO-REFRESH DE TOKEN
// ============================================
let _refreshPromise: Promise<string | null> | null = null;

async function refreshToken(): Promise<string | null> {
  // Evitar múltiples refreshes simultáneos
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    try {
      const { useAuthStore } = await import('../store/useAuthStore');
      const token = useAuthStore.getState().token;
      if (!token) return null;

      const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        useAuthStore.getState().cerrarSesion();
        return null;
      }

      const data = await res.json();
      useAuthStore.setState({ token: data.token });
      return data.token as string;
    } catch {
      return null;
    } finally {
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
}

export async function fetchConAuth(url: string, opciones: RequestInit = {}): Promise<Response> {
  const { useAuthStore } = await import('../store/useAuthStore');
  const token = useAuthStore.getState().token;

  const headers = { ...opciones.headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  let res = await fetch(url, { ...opciones, headers });

  if (res.status === 401 && token) {
    const nuevoToken = await refreshToken();
    if (nuevoToken) {
      const headersNuevos = { ...opciones.headers, Authorization: `Bearer ${nuevoToken}` };
      res = await fetch(url, { ...opciones, headers: headersNuevos });
    }
  }

  return res;
}

const MICROSERVICES = {
  TRANSACTION: API_BASE_URL,
  SOCIAL: API_BASE_URL,
  MARKETING: API_BASE_URL,
  AI: API_BASE_URL
};

// Función para transformar producto del backend al frontend (armonizada)
const transformarProducto = (productoBackend: any): Producto => ({
  id: productoBackend.id?.toString() || '',
  nombre: productoBackend.nombre || '',
  precio: productoBackend.precio || 0,
  imagen: productoBackend.imagen || 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=500&fit=crop',
  descripcion: productoBackend.descripcion || 'Producto de calidad',
  categoria: productoBackend.categoria || 'General',
  tallas: productoBackend.tallas || ['S', 'M', 'L'],
  colores: productoBackend.colores || ['Negro', 'Blanco'],
  calificacion: productoBackend.calificacion || 5,
  en_stock: productoBackend.en_stock !== false,
  es_eco: productoBackend.es_eco || false,
  compatibilidad: productoBackend.compatibilidad || 95
});

export const api = {
  async obtenerProductos(): Promise<{ productos: Producto[]; total: number }> {
    try {
      console.log('🔄 Sincronizando productos con backend...');
      const response = await fetch(`${API_BASE_URL}/api/productos?limite=200`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const productos = (data.productos || []).map(transformarProducto);

      console.log(`✅ ${productos.length} productos sincronizados`);

      return {
        productos,
        total: data.total || productos.length
      };
    } catch (error) {
      console.error('❌ Error al obtener productos:', error);
      return { productos: [], total: 0 };
    }
  },

  async obtenerProductosDestacados(): Promise<{ productos: Producto[]; total: number }> {
    try {
      console.log('⭐ Obteniendo productos destacados...');
      const response = await fetch(`${API_BASE_URL}/api/productos/destacados`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const productos = (data.productos || []).map(transformarProducto);

      console.log(`✅ ${productos.length} productos destacados obtenidos`);

      return {
        productos,
        total: data.total || productos.length
      };
    } catch (error) {
      console.error('❌ Error al obtener productos destacados:', error);
      return { productos: [], total: 0 };
    }
  },

  async obtenerCategorias() {
    try {
      console.log('📂 Obteniendo categorías...');
      const response = await fetch(`${API_BASE_URL}/api/categorias`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ ${data.categorias?.length || 0} categorías obtenidas`);

      return data;
    } catch (error) {
      console.error('❌ Error al obtener categorías:', error);
      return { categorias: [] };
    }
  },

  async iniciarSesion(email: string, contrasena: string): Promise<{ exito: boolean; usuario?: Usuario; token?: string; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: contrasena })
      });

      const data = await response.json();

      if (response.ok && (data.token || data.datos?.token)) {
        const usuario = data.usuario || data.datos?.usuario;
        const token = data.token || data.datos?.token;

        return {
          exito: true,
          usuario: {
            id: usuario.id?.toString() || '',
            nombre: usuario.nombre || '',
            email: usuario.email || '',
            rol: usuario.rol || 'cliente'
          },
          token: token
        };
      }

      return {
        exito: false,
        error: data.error || 'Credenciales inválidas'
      };
    } catch (error) {
      return {
        exito: false,
        error: 'Error de conexión'
      };
    }
  },

  async registrar(datos: any): Promise<{ exito: boolean; usuario?: Usuario; token?: string; error?: string }> {
    try {
      console.log('📝 Registrando usuario:', datos.email);
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      });

      const data = await response.json();
      console.log('📋 Respuesta del servidor:', { status: response.status, data });

      if (response.ok && (response.status === 200 || response.status === 201)) {
        // Verificar que el registro fue realmente exitoso
        if (data.exito === false || (data.datos && data.datos.exito === false)) {
          return {
            exito: false,
            error: data.error || data.datos?.error || 'Error en el registro'
          };
        }
        console.log('✅ Registro exitoso');
        return {
          exito: true,
          usuario: data.usuario ? {
            id: data.usuario.id?.toString() || '',
            nombre: data.usuario.nombre || datos.nombre,
            email: data.usuario.email || datos.email,
            rol: data.usuario.rol || 'cliente'
          } : undefined,
          token: data.token
        };
      }

      console.error('❌ Error en registro:', data);
      return {
        exito: false,
        error: data.error || data.mensaje || 'Error en el registro'
      };
    } catch (error) {
      console.error('❌ Error de conexión al registrar:', error);
      return {
        exito: false,
        error: 'Error de conexión con el servidor'
      };
    }
  },

  async obtenerCarrito(token: string): Promise<{ items: ItemCarrito[] }> {
    try {
      const response = await fetchConAuth(`${API_BASE_URL}/api/carrito`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const items = (data.datos?.productos || []).map((item: any) => ({
        ...transformarProducto(item),
        cantidad: item.cantidad || 1
      }));
      return { items };
    } catch {
      return { items: [] };
    }
  },

  async agregarAlCarrito(token: string, productoId: string, cantidad: number = 1) {
    try {
      console.log(`🛒 Agregando producto ${productoId} al carrito (cantidad: ${cantidad})`);
      const response = await fetch(`${API_BASE_URL}/api/carrito`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id_producto: productoId, cantidad })
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Producto agregado al carrito exitosamente');
      } else {
        console.error('❌ Error del servidor:', data.error);
      }

      return data;
    } catch (error) {
      console.error('❌ Error al agregar al carrito:', error);
      return { error: 'Error de conexión' };
    }
  },

  async procesarCheckout(token: string, datos: any) {
    try {
      console.log('💳 Procesando checkout...');
      const checkoutData = {
        metodo_pago: datos.metodoPago || 'pago_en_linea',
        direccion_envio: datos.direccion_envio || 'Dirección predeterminada',
        items: datos.items || []  // Enviar items con cantidades reales del frontend
      };

      const response = await fetch(`${API_BASE_URL}/api/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(checkoutData)
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Checkout procesado exitosamente');
        return { exito: true, orden: data.orden };
      } else {
        console.error('❌ Error en checkout:', data.error);
        return { exito: false, error: data.error || 'Error al procesar el pago' };
      }
    } catch (error) {
      console.error('❌ Error de conexión en checkout:', error);
      return { exito: false, error: 'Error de conexión con el servidor' };
    }
  },

  async obtenerPedidos(token: string) {
    try {
      const response = await fetchConAuth(`${API_BASE_URL}/api/pedidos`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return { exito: true, pedidos: data.pedidos || [], total: data.total || 0 };
    } catch {
      return { exito: false, pedidos: [], total: 0 };
    }
  },

  async actualizarProducto(id: string, producto: any) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/productos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(producto)
      })
      const data = await response.json()
      if (response.ok) return { exito: true, producto: data.producto || data }
      return { exito: false, error: data.detail || data.error || 'Error al actualizar' }
    } catch (error) {
      return { exito: false, error: 'Error de conexión' }
    }
  },

  async crearProducto(producto: any) {
    try {
      console.log('📦 Creando producto:', producto.nombre);
      const response = await fetch(`${API_BASE_URL}/api/productos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(producto)
      });

      const data = await response.json();

      if (response.ok && data.exito) {
        console.log('✅ Producto creado:', data.producto);
        return {
          exito: true,
          producto: data.producto
        };
      }

      console.error('❌ Error al crear producto:', data);
      return {
        exito: false,
        error: data.mensaje || 'Error al crear producto'
      };
    } catch (error) {
      console.error('❌ Error de conexión:', error);
      return {
        exito: false,
        error: 'Error de conexión'
      };
    }
  },

  async chatIA(mensaje: string, historial: any[] = [], usuarioId?: string, token?: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje, historial, usuario_id: usuarioId, token })
      });

      const data = await response.json();

      if (response.ok) {
        return {
          exito: true,
          respuesta: data.respuesta,
          productos_recomendados: data.productos_recomendados || []
        };
      }

      return {
        exito: false,
        error: 'Error al obtener respuesta',
        productos_recomendados: []
      };
    } catch (error) {
      console.error('❌ Error en chat IA:', error);
      return {
        exito: false,
        error: 'Error de conexión',
        productos_recomendados: []
      };
    }
  },

  async obtenerRecomendacionesIA(usuarioId: string, productosVistos: string[] = []) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/recomendaciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          usuario_id: usuarioId,
          productos_vistos: productosVistos,
          preferencias: {}
        })
      });

      const data = await response.json();

      if (response.ok) {
        return {
          exito: true,
          recomendaciones: data.recomendaciones || []
        };
      }

      return { exito: false, recomendaciones: [] };
    } catch (error) {
      console.error('❌ Error obteniendo recomendaciones:', error);
      return { exito: false, recomendaciones: [] };
    }
  },

  async analizarEstilo(descripcion: string, categoria?: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/estilos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descripcion, categoria })
      });

      const data = await response.json();

      if (response.ok) {
        return {
          exito: true,
          estilos: data.estilos || []
        };
      }

      return { exito: false, estilos: [] };
    } catch (error) {
      console.error('❌ Error analizando estilo:', error);
      return { exito: false, estilos: [] };
    }
  },

  async obtenerPerfil(token: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/usuarios/perfil`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        return { exito: true, datos: data.datos };
      }

      return { exito: false, error: 'Error al obtener perfil' };
    } catch (error) {
      console.error('❌ Error obteniendo perfil:', error);
      return { exito: false, error: 'Error de conexión' };
    }
  },

  async actualizarPerfil(token: string, datos: any) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/usuarios/perfil`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(datos)
      });

      const data = await response.json();

      if (response.ok) {
        return { exito: true, datos: data.datos };
      }

      return { exito: false, error: data.error || 'Error al actualizar perfil' };
    } catch (error) {
      console.error('❌ Error actualizando perfil:', error);
      return { exito: false, error: 'Error de conexión' };
    }
  },

  // ============================================
  // SERVICIO DE PAGOS - Preparado para pasarela
  // ============================================

  async iniciarPago(metodoPago: string, monto: number, pedidoId: string, token: string) {
    // TODO: Cuando se integre la pasarela (Wompi/PayU/MercadoPago),
    // este método llamará al endpoint de la pasarela y retornará la URL de redirección
    // Por ahora simula aprobación para pago_en_linea y efectivo
    console.log(`💳 Iniciando pago: ${metodoPago} - $${monto} - Pedido: ${pedidoId}`);
    return {
      exito: true,
      estado: metodoPago === 'efectivo' ? 'Pendiente' : 'Aprobado',
      referencia: `REF-${Date.now()}`,
      // url_redireccion: null  // Aquí irá la URL de la pasarela
    };
  },

  async verificarPago(pagoId: string, token: string) {
    // TODO: Consultar estado del pago en la pasarela
    console.log(`🔍 Verificando pago: ${pagoId}`);
    return { exito: true, estado: 'Aprobado' };
  },

  // ============================================
  // CRÉDITO INTERNO
  // ============================================

  async evaluarCredito(token: string, usuario: any) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/credito/evaluar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          usuario_id: parseInt(usuario.id),
          fecha_registro: (usuario as any).fecha_creacion || new Date(Date.now() - 365*24*60*60*1000).toISOString(),
          total_compras_historico: (usuario as any).total_compras_historico || 0,
          numero_compras: (usuario as any).numero_compras || 0
        })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Error evaluando crédito:', error);
      return { califica: false, razon: 'Error de conexión' };
    }
  },

  async solicitarCreditoInterno(token: string, usuarioId: string, monto: number, plazo: number) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/credito/interno/solicitar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          usuario_id: parseInt(usuarioId),
          monto_solicitado: monto,
          plazo_meses: plazo
        })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Error solicitando crédito:', error);
      return { aprobado: false, error: 'Error de conexión' };
    }
  },

  async cargarCredito(token: string, creditoId: string, pedidoId: string, monto: number) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/credito/interno/cargo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ credito_id: creditoId, pedido_id: pedidoId, monto })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Error cargando crédito:', error);
      return { error: 'Error de conexión' };
    }
  },

  // ============================================
  // BONOS
  // ============================================

  async validarBono(codigo: string, usuarioId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/bonos/validar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo, usuario_id: parseInt(usuarioId) })
      });
      return await response.json();
    } catch (error) {
      return { valido: false, razon: 'Error de conexión' };
    }
  },

  async aplicarBono(codigo: string, usuarioId: string, pedidoId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/bonos/aplicar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo, usuario_id: parseInt(usuarioId), pedido_id: pedidoId })
      });
      return await response.json();
    } catch (error) {
      return { error: 'Error de conexión' };
    }
  },

  async obtenerBonosUsuario(usuarioId: string, token: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/bonos/usuario/${usuarioId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return await response.json();
    } catch (error) {
      return { bonos: [], total: 0, disponibles: 0 };
    }
  }
};

// Mantener compatibilidad con nombres anteriores
export const {
  obtenerProductos: getProducts,
  obtenerCategorias: getCategories,
  iniciarSesion: login,
  registrar: register
} = api;