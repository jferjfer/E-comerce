  TRANSACTION: 'http://localhost:3003',
  SOCIAL: 'http://localhost:3004',
  MARKETING: 'http://localhost:3006',
  AI: 'http://localhost:3007'
};

// Función para transformar producto del backend al frontend (armonizada)
const transformarProducto = (productoBackend: any): Producto => ({
  id: productoBackend.id?.toString() || '',
  nombre: productoBackend.nombre || '',
  precio: Math.round((productoBackend.precio || 0) * 100), // Backend en pesos, frontend en centavos
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
      const response = await fetch(`${API_BASE_URL}/api/productos`);

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

      if (response.ok && data.token) {
        return {
          exito: true,
          usuario: {
            id: data.usuario.id?.toString() || '',
            nombre: data.usuario.nombre || '',
            email: data.usuario.email || '',
            rol: data.usuario.rol || 'cliente'
          },
          token: data.token
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
      console.log('🛒 Sincronizando carrito con backend...');
      const response = await fetch(`${API_BASE_URL}/api/carrito`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const items = (data.datos?.productos || []).map((item: any) => ({
        ...transformarProducto(item),
        cantidad: item.cantidad || 1
      }));

      console.log(`✅ Carrito sincronizado: ${items.length} items`);
      return { items };
    } catch (error) {
      console.error('❌ Error al obtener carrito:', error);
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

  async obtenerPedidos(token: string) {
    try {
      console.log('📦 Obteniendo historial de pedidos...');
      const response = await fetch(`${API_BASE_URL}/api/pedidos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (response.ok) {
        console.log(`✅ ${data.pedidos?.length || 0} pedidos obtenidos`);
        return { exito: true, pedidos: data.pedidos || [] };
      } else {
        return { exito: false, error: data.error || 'Error al obtener pedidos' };
      }
    } catch (error) {
      console.error('❌ Error obteniendo pedidos:', error);
      return { exito: false, error: 'Error de conexión' };
    }
  },

  async procesarCheckout(token: string, datos: any) {
    try {
      console.log('💳 Procesando checkout...', datos);
      const response = await fetch(`${API_BASE_URL}/api/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(datos)
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Checkout exitoso:', data);
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

  async crearProducto(producto: any): Promise<{ exito: boolean; producto?: any; error?: string }> {
    try {
      console.log('📦 Creando producto:', producto.nombre);
      const response = await fetch(`${API_BASE_URL}/api/productos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(producto)
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Producto creado exitosamente:', data);
        return { exito: true, producto: data.producto };
      } else {
        console.error('❌ Error creando producto:', data.error);
        return { exito: false, error: data.error || 'Error al crear el producto' };
      }
    } catch (error) {
      console.error('❌ Error de conexión creando producto:', error);
      return { exito: false, error: 'Error de conexión con el servidor' };
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