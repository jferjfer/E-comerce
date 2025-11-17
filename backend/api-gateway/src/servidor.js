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
    : ['http://localhost:3005', 'http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
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

// Configuración de proxies para cada microservicio
const servicios = {
  '/api/auth': 'http://ecommerce-auth:3001',
  '/api/productos': 'http://ecommerce-catalog:3002',
  '/api/categorias': 'http://ecommerce-catalog:3002',
  '/api/tendencias': 'http://ecommerce-catalog:3002',
  '/api/carrito': 'http://ecommerce-transaction:3003',
  '/api/pedidos': 'http://ecommerce-transaction:3003',
  '/api/pagos': 'http://ecommerce-transaction:3003',
  '/api/inventario': 'http://ecommerce-logistics:3009',
  '/api/resenas': 'http://ecommerce-social:3004',
  '/api/preguntas': 'http://ecommerce-social:3004',
  '/api/listas-deseos': 'http://ecommerce-social:3004',
  '/api/cupones': 'http://ecommerce-marketing:3006',
  '/api/fidelizacion': 'http://ecommerce-marketing:3006',
  '/api/recomendaciones': 'http://ecommerce-ai:3007',
  '/api/estilos': 'http://ecommerce-ai:3007',
  '/api/credito': 'http://ecommerce-credit:3008'
};

// Proxy simple para auth
aplicacion.use('/api/auth', createProxyMiddleware({
  target: 'http://ecommerce-auth:3001',
  changeOrigin: true,
  pathRewrite: { '^/api/auth': '/api/auth' },
  timeout: 5000
}));

// Proxy para productos
aplicacion.use('/api/productos', createProxyMiddleware({
  target: 'http://ecommerce-catalog:3002',
  changeOrigin: true,
  timeout: 5000
}));

// Proxy para categorias
aplicacion.use('/api/categorias', createProxyMiddleware({
  target: 'http://ecommerce-catalog:3002',
  changeOrigin: true,
  timeout: 5000
}));

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
    mensaje: 'API Gateway E-Commerce',
    version: '1.0.0',
    documentacion: '/estado-servicios',
    servicios_disponibles: Object.keys(servicios)
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