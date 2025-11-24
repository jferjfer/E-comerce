const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const aplicacion = express();
const puerto = process.env.PUERTO || 3000;

// Middleware de seguridad
aplicacion.use(helmet());

// CORS configurado específicamente
const corsOptions = {
  origin: process.env.ENTORNO === 'produccion' 
    ? ['https://tudominio.com'] 
    : ['http://localhost:3005', 'http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
aplicacion.use(cors(corsOptions));

// Rate limiting
const limitador = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana
  message: {
    error: 'Demasiadas solicitudes, intenta de nuevo más tarde'
  }
});

aplicacion.use(limitador);
aplicacion.use(express.json());

// Middleware para logging de peticiones
aplicacion.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url} - ${new Date().toLocaleTimeString()}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📋 Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Configuración de proxies para cada microservicio (desarrollo local)
const servicios = {
  '/api/auth': 'http://localhost:3011',
  '/api/productos': 'http://localhost:3002',
  '/api/categorias': 'http://localhost:3002',
  '/api/tendencias': 'http://localhost:3002',
  '/api/carrito': 'http://localhost:3003',
  '/api/pedidos': 'http://localhost:3003',
  '/api/pagos': 'http://localhost:3003',
  '/api/inventario': 'http://localhost:3009',
  '/api/resenas': 'http://localhost:3004',
  '/api/preguntas': 'http://localhost:3004',
  '/api/listas-deseos': 'http://localhost:3004',
  '/api/cupones': 'http://localhost:3006',
  '/api/fidelizacion': 'http://localhost:3006',
  '/api/recomendaciones': 'http://localhost:3007',
  '/api/estilos': 'http://localhost:3007',
  '/api/credito': 'http://localhost:3008'
};

// Rutas básicas para desarrollo (sin microservicios activos)
aplicacion.get('/api/productos', (req, res) => {
  res.json({
    productos: [
      { 
        id: 1, 
        nombre: 'Vestido Elegante', 
        precio: 89.99, 
        categoria: 'Vestidos',
        descripcion: 'Vestido elegante perfecto para ocasiones especiales',
        imagen: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=500&fit=crop',
        tallas: ['S', 'M', 'L', 'XL'],
        colores: ['Negro', 'Azul marino', 'Rojo'],
        calificacion: 5,
        en_stock: true,
        es_eco: true,
        compatibilidad: 98
      },
      { 
        id: 2, 
        nombre: 'Camisa Casual', 
        precio: 45.50, 
        categoria: 'Camisas',
        descripcion: 'Camisa cómoda para el día a día',
        imagen: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop',
        tallas: ['S', 'M', 'L', 'XL'],
        colores: ['Blanco', 'Azul', 'Gris'],
        calificacion: 4,
        en_stock: true,
        es_eco: false,
        compatibilidad: 95
      },
      { 
        id: 3, 
        nombre: 'Zapatos Deportivos', 
        precio: 120.00, 
        categoria: 'Calzado',
        descripcion: 'Zapatos deportivos de alta calidad',
        imagen: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=500&fit=crop',
        tallas: ['38', '39', '40', '41', '42'],
        colores: ['Negro', 'Blanco', 'Azul'],
        calificacion: 5,
        en_stock: true,
        es_eco: false,
        compatibilidad: 92
      }
    ],
    total: 3
  });
});

aplicacion.get('/api/categorias', (req, res) => {
  res.json({
    categorias: [
      { id: 1, nombre: 'Vestidos', descripcion: 'Vestidos elegantes y casuales' },
      { id: 2, nombre: 'Camisas', descripcion: 'Camisas y blusas' },
      { id: 3, nombre: 'Pantalones', descripcion: 'Pantalones y jeans' },
      { id: 4, nombre: 'Blazers', descripcion: 'Blazers y chaquetas' },
      { id: 5, nombre: 'Calzado', descripcion: 'Zapatos y calzado en general' }
    ]
  });
});

aplicacion.post('/api/auth/login', async (req, res) => {
  try {
    const axios = require('axios');
    const respuesta = await axios.post('http://localhost:3011/api/auth/login-simple', req.body);
    console.log('✅ Login exitoso desde auth-service');
    res.json(respuesta.data);
  } catch (error) {
    console.log('❌ Login fallido desde auth-service, usando fallback');
    
    // Fallback para desarrollo
    const { email, password } = req.body
    if (email === 'demo@estilomoda.com' && password === 'admin123') {
      res.json({
        token: 'demo_token_' + Date.now(),
        usuario: { 
          id: 1, 
          email, 
          nombre: 'Usuario Demo', 
          rol: 'cliente' 
        }
      })
    } else {
      res.status(401).json({ error: 'Credenciales inválidas' })
    }
  }
});

// Rutas de carrito
aplicacion.get('/api/carrito', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  
  if (!token) {
    return res.status(401).json({ error: 'Token requerido' })
  }
  
  // Simulación de carrito por usuario
  const carritoSimulado = {
    datos: {
      productos: [
        {
          id: '1',
          nombre: 'Vestido Elegante',
          precio: 8999,
          cantidad: 1,
          imagen: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=500&fit=crop'
        }
      ],
      total: 8999
    }
  }
  
  res.json(carritoSimulado)
})

aplicacion.post('/api/carrito', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  const { id_producto, cantidad } = req.body
  
  if (!token) {
    return res.status(401).json({ error: 'Token requerido' })
  }
  
  console.log(`🛒 Agregando al carrito: Producto ${id_producto}, Cantidad: ${cantidad}`)
  
  res.json({
    mensaje: 'Producto agregado al carrito exitosamente',
    datos: {
      id_producto,
      cantidad
    }
  })
})

aplicacion.post('/api/auth/register', (req, res) => {
  const { 
    email, password, nombre, apellido, documento_tipo, documento_numero,
    telefono, fecha_nacimiento, genero, direccion, ciudad, departamento,
    acepta_terminos, acepta_datos, acepta_marketing 
  } = req.body;
  
  console.log('📝 Nuevo registro de cliente:', email, nombre, apellido);
  
  // Validaciones básicas según ley colombiana
  if (!documento_numero || !acepta_terminos || !acepta_datos) {
    console.log('❌ Registro fallido - campos obligatorios faltantes');
    return res.status(400).json({ error: 'Campos obligatorios faltantes' });
  }
  
  console.log('✅ Cliente registrado exitosamente:', email);
  res.json({
    id: Date.now(),
    email, nombre, apellido, documento_tipo, documento_numero,
    telefono, ciudad, departamento, rol: 'cliente',
    fecha_registro: new Date().toISOString(),
    mensaje: 'Cliente registrado exitosamente'
  });
});

aplicacion.post('/api/auth/solicitar-recuperacion', async (req, res) => {
  try {
    const axios = require('axios');
    const respuesta = await axios.post('http://localhost:3011/api/auth/solicitar-recuperacion', req.body);
    res.json(respuesta.data);
  } catch (error) {
    console.log('🔑 Solicitud de recuperación (simulada):', req.body.email);
    res.json({ mensaje: 'Si el email existe, recibirás un enlace de recuperación' });
  }
});

aplicacion.post('/api/auth/restablecer-contrasena', async (req, res) => {
  try {
    const axios = require('axios');
    const respuesta = await axios.post('http://localhost:3011/api/auth/restablecer-contrasena', req.body);
    res.json(respuesta.data);
  } catch (error) {
    console.log('🔑 Restablecimiento simulado');
    res.json({ mensaje: 'Contraseña restablecida exitosamente' });
  }
});

// Ruta de salud del API Gateway
aplicacion.get('/salud', (req, res) => {
  res.json({
    estado: 'activo',
    servicio: 'api-gateway',
    timestamp: new Date().toISOString(),
    servicios_configurados: Object.keys(servicios).length
  });
});

// Ruta de estado de servicios
aplicacion.get('/estado-servicios', async (req, res) => {
  const estadoServicios = {};
  
  for (const [ruta, url] of Object.entries(servicios)) {
    try {
      const axios = require('axios');
      const respuesta = await axios.get(`${url}/salud`, { timeout: 5000 });
      estadoServicios[ruta] = {
        estado: 'activo',
        url: url,
        respuesta: respuesta.data
      };
    } catch (error) {
      estadoServicios[ruta] = {
        estado: 'inactivo',
        url: url,
        error: error.message
      };
    }
  }
  
  res.json({
    timestamp: new Date().toISOString(),
    servicios: estadoServicios
  });
});

// Ruta por defecto
aplicacion.get('/', (req, res) => {
  res.json({
    mensaje: 'API Gateway - Estilo y Moda',
    version: '1.0.0',
    estado: 'Desarrollo Local',
    documentacion: '/estado-servicios',
    endpoints_disponibles: ['/api/productos', '/api/categorias', '/api/auth/login']
  });
});

// Manejador de rutas no encontradas
aplicacion.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    ruta: req.originalUrl,
    servicios_disponibles: Object.keys(servicios)
  });
});

// Crear servidor HTTP
const servidor = http.createServer(aplicacion);

// Configurar Socket.IO
const io = new Server(servidor, {
  cors: {
    origin: "http://localhost:3005",
    methods: ["GET", "POST"]
  },
  path: "/ws"
});

// Eventos WebSocket
io.on('connection', (socket) => {
  console.log('🔌 Cliente WebSocket conectado:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('🔌 Cliente WebSocket desconectado:', socket.id);
  });
  
  // Eventos personalizados para el e-commerce
  socket.on('carrito_actualizado', (data) => {
    socket.broadcast.emit('carrito_actualizado', data);
  });
  
  socket.on('nuevo_pedido', (data) => {
    socket.broadcast.emit('nuevo_pedido', data);
  });
});

servidor.listen(puerto, () => {
  console.log(`🚀 API Gateway ejecutándose en puerto ${puerto}`);
  console.log(`📋 Servicios configurados: ${Object.keys(servicios).length}`);
  console.log(`🔗 Documentación: http://localhost:${puerto}/estado-servicios`);
  console.log(`🔌 WebSocket disponible en ws://localhost:${puerto}/ws`);
});

module.exports = { aplicacion, io };