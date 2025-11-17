const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const aplicacion = express();
const puerto = process.env.PUERTO || 3000;

// Middleware de seguridad
aplicacion.use(helmet());
aplicacion.use(cors());

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
  '/api/auth': process.env.SERVICIO_AUTH_URL || 'http://localhost:3001',
  '/api/productos': process.env.SERVICIO_CATALOGO_URL || 'http://localhost:3002',
  '/api/categorias': process.env.SERVICIO_CATALOGO_URL || 'http://localhost:3002',
  '/api/tendencias': process.env.SERVICIO_CATALOGO_URL || 'http://localhost:3002',
  '/api/carrito': process.env.SERVICIO_TRANSACCIONES_URL || 'http://localhost:3003',
  '/api/pedidos': process.env.SERVICIO_TRANSACCIONES_URL || 'http://localhost:3003',
  '/api/pagos': process.env.SERVICIO_TRANSACCIONES_URL || 'http://localhost:3003',
  '/api/inventario': process.env.SERVICIO_LOGISTICA_URL || 'http://localhost:3009',
  '/api/resenas': process.env.SERVICIO_SOCIAL_URL || 'http://localhost:3004',
  '/api/preguntas': process.env.SERVICIO_SOCIAL_URL || 'http://localhost:3004',
  '/api/listas-deseos': process.env.SERVICIO_SOCIAL_URL || 'http://localhost:3004',
  '/api/cupones': process.env.SERVICIO_MARKETING_URL || 'http://localhost:3006',
  '/api/fidelizacion': process.env.SERVICIO_MARKETING_URL || 'http://localhost:3006',
  '/api/recomendaciones': process.env.SERVICIO_IA_URL || 'http://localhost:3007',
  '/api/estilos': process.env.SERVICIO_IA_URL || 'http://localhost:3007',
  '/api/credito': process.env.SERVICIO_CREDITO_URL || 'http://localhost:3008'
};

// Crear proxies para cada servicio
Object.keys(servicios).forEach(ruta => {
  const urlDestino = servicios[ruta];
  
  aplicacion.use(ruta, createProxyMiddleware({
    target: urlDestino,
    changeOrigin: true,
    timeout: 30000,
    onError: (err, req, res) => {
      console.error(`❌ Error en proxy ${ruta}:`, err.message);
      res.status(503).json({
        error: 'Servicio no disponible temporalmente',
        servicio: ruta
      });
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(`🔄 Proxy: ${req.method} ${req.originalUrl} -> ${urlDestino}${req.url}`);
    }
  }));
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

aplicacion.listen(puerto, () => {
  console.log(`🚀 API Gateway ejecutándose en puerto ${puerto}`);
  console.log(`📋 Servicios configurados: ${Object.keys(servicios).length}`);
  console.log(`🔗 Documentación: http://localhost:${puerto}/estado-servicios`);
});

module.exports = aplicacion;