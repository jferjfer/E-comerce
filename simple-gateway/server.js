const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = 3000;

// CORS
app.use(cors({
  origin: ['http://localhost:3005', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json());

// Logging detallado
app.use((req, res, next) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`📥 ${req.method} ${req.url} - ${timestamp}`);
  
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`📋 Body:`, JSON.stringify(req.body, null, 2));
  }
  
  if (req.headers.authorization) {
    console.log(`🔑 Auth: Bearer ***${req.headers.authorization.slice(-10)}`);
  }
  
  next();
});

// Proxies a microservicios
const services = {
  '/api/auth': 'http://localhost:3011',
  '/api/usuarios': 'http://localhost:3011',
  '/api/productos': 'http://localhost:3002',
  '/api/categorias': 'http://localhost:3002',
  '/api/buscar': 'http://localhost:3002',
  '/api/tendencias': 'http://localhost:3002',
  '/api/carrito': 'http://localhost:3003',
  '/api/pedidos': 'http://localhost:3003',
  '/api/pagos': 'http://localhost:3003',
  '/api/checkout': 'http://localhost:3003',
  '/api/resenas': 'http://localhost:3004',
  '/api/preguntas': 'http://localhost:3004',
  '/api/listas-deseos': 'http://localhost:3004',
  '/api/cupones': 'http://localhost:3006',
  '/api/campanas': 'http://localhost:3006',
  '/api/fidelizacion': 'http://localhost:3006',
  '/api/analytics': 'http://localhost:3006',
  '/api/recomendaciones': 'http://localhost:3007',
  '/api/perfil': 'http://localhost:3007',
  '/api/analisis': 'http://localhost:3007',
  '/api/estilos': 'http://localhost:3007',
  '/api/credito': 'http://localhost:3008',
  '/api/inventario': 'http://localhost:3009',
  '/api/almacenes': 'http://localhost:3009',
  '/api/entregas': 'http://localhost:3009'
};

// Manejo directo optimizado para auth endpoints
const manejarAuthDirecto = async (req, res, endpoint) => {
  const inicio = Date.now();
  console.log(`🔐 ${endpoint.toUpperCase()} DIRECTO iniciado`);
  
  try {
    const respuesta = await axios({
      method: req.method,
      url: `http://localhost:3011/api/auth/${endpoint}`,
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization
      },
      timeout: 30000
    });
    
    const duracion = Date.now() - inicio;
    console.log(`✅ ${endpoint.toUpperCase()} completado en ${duracion}ms`);
    
    res.status(respuesta.status).json(respuesta.data);
  } catch (error) {
    const duracion = Date.now() - inicio;
    console.error(`❌ ${endpoint.toUpperCase()} falló en ${duracion}ms:`, error.message);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

// Rutas auth optimizadas
app.post('/api/auth/register', (req, res) => manejarAuthDirecto(req, res, 'register'));
app.post('/api/auth/registro', (req, res) => manejarAuthDirecto(req, res, 'registro'));
app.post('/api/auth/login', (req, res) => manejarAuthDirecto(req, res, 'login'));
app.get('/api/auth/verificar', (req, res) => manejarAuthDirecto(req, res, 'verificar'));
app.post('/api/auth/logout', (req, res) => manejarAuthDirecto(req, res, 'logout'));

// Configurar proxies optimizados
Object.keys(services).forEach(path => {
  // Saltar /api/auth ya que se maneja directamente arriba
  if (path === '/api/auth') return;
  
  app.use(path, createProxyMiddleware({
    target: services[path],
    changeOrigin: true,
    timeout: 15000,
    proxyTimeout: 15000,
    secure: false,
    logLevel: 'silent',
    onError: (err, req, res) => {
      console.error(`❌ Proxy error ${path}: ${err.message}`);
      if (!res.headersSent) {
        res.status(503).json({ error: 'Servicio no disponible' });
      }
    }
  }));
});

// Ruta de estado de servicios
app.get('/estado-servicios', async (req, res) => {
  console.log('🔍 Verificando estado de microservicios...');
  
  const estadoServicios = {};
  const serviciosUnicos = [...new Set(Object.values(services))];
  
  for (const url of serviciosUnicos) {
    const puerto = url.split(':')[2];
    try {
      const respuesta = await axios.get(`${url}/salud`, { timeout: 3000 });
      estadoServicios[puerto] = {
        estado: 'activo',
        url: url,
        servicio: respuesta.data.servicio || 'desconocido',
        timestamp: respuesta.data.timestamp
      };
      console.log(`✅ Servicio ${puerto} - Activo`);
    } catch (error) {
      estadoServicios[puerto] = {
        estado: 'inactivo',
        url: url,
        error: error.message
      };
      console.log(`❌ Servicio ${puerto} - Inactivo`);
    }
  }
  
  const activos = Object.values(estadoServicios).filter(s => s.estado === 'activo').length;
  const total = Object.keys(estadoServicios).length;
  
  res.json({
    timestamp: new Date().toISOString(),
    resumen: {
      total_servicios: total,
      servicios_activos: activos,
      servicios_inactivos: total - activos,
      disponibilidad: Math.round((activos / total) * 100) + '%'
    },
    servicios: estadoServicios
  });
});

// Ruta de salud
app.get('/salud', (req, res) => {
  res.json({ 
    estado: 'activo', 
    gateway: 'simple-proxy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    servicios_configurados: Object.keys(services).length
  });
});

// Ruta principal
app.get('/', (req, res) => {
  res.json({
    mensaje: 'Simple Gateway - Estilo y Moda',
    version: '1.0.0',
    servicios_disponibles: Object.keys(services).length,
    documentacion: {
      estado_servicios: '/estado-servicios',
      salud: '/salud'
    }
  });
});

app.listen(port, () => {
  console.log(`🚀 Simple Gateway ejecutándose en puerto ${port}`);
  console.log(`📋 ${Object.keys(services).length} rutas configuradas`);
  console.log(`🔗 Estado servicios: http://localhost:${port}/estado-servicios`);
});