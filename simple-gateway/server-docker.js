const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = process.env.PUERTO || 3000;

// Detectar si estamos en Docker
const isDocker = process.env.DOCKER_ENV === 'true';

// URLs de servicios (Docker usa nombres de contenedores)
const getServiceUrl = (service, port) => {
  return isDocker ? `http://${service}:${port}` : `http://localhost:${port}`;
};

app.use(cors({
  origin: ['http://localhost:3005', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json());

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

// Servicios
const services = {
  '/api/auth': getServiceUrl('auth-service', 3011),
  '/api/usuarios': getServiceUrl('auth-service', 3011),
  '/api/productos': getServiceUrl('catalog-service', 3002),
  '/api/categorias': getServiceUrl('catalog-service', 3002),
  '/api/buscar': getServiceUrl('catalog-service', 3002),
  '/api/tendencias': getServiceUrl('catalog-service', 3002),
  '/api/carrito': getServiceUrl('transaction-service', 3003),
  '/api/pedidos': getServiceUrl('transaction-service', 3003),
  '/api/pagos': getServiceUrl('transaction-service', 3003),
  '/api/checkout': getServiceUrl('transaction-service', 3003),
  '/api/resenas': getServiceUrl('social-service', 3004),
  '/api/preguntas': getServiceUrl('social-service', 3004),
  '/api/listas-deseos': getServiceUrl('social-service', 3004),
  '/api/cupones': getServiceUrl('marketing-service', 3006),
  '/api/campanas': getServiceUrl('marketing-service', 3006),
  '/api/fidelizacion': getServiceUrl('marketing-service', 3006),
  '/api/analytics': getServiceUrl('marketing-service', 3006),
  '/api/recomendaciones': getServiceUrl('ai-service', 3007),
  '/api/perfil': getServiceUrl('ai-service', 3007),
  '/api/analisis': getServiceUrl('ai-service', 3007),
  '/api/estilos': getServiceUrl('ai-service', 3007)
};

// Manejo directo para auth
const manejarAuthDirecto = async (req, res, endpoint) => {
  const inicio = Date.now();
  console.log(`🔐 ${endpoint.toUpperCase()} DIRECTO iniciado`);

  try {
    const respuesta = await axios({
      method: req.method,
      url: `${getServiceUrl('auth-service', 3011)}/api/auth/${endpoint}`,
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

app.post('/api/auth/register', (req, res) => manejarAuthDirecto(req, res, 'register'));
app.post('/api/auth/registro', (req, res) => manejarAuthDirecto(req, res, 'registro'));
app.post('/api/auth/login', (req, res) => manejarAuthDirecto(req, res, 'login'));
app.get('/api/auth/verificar', (req, res) => manejarAuthDirecto(req, res, 'verificar'));
app.post('/api/auth/logout', (req, res) => manejarAuthDirecto(req, res, 'logout'));

// Manejo directo para carrito (evita timeout del proxy)
app.post('/api/carrito', async (req, res) => {
  try {
    const response = await axios.post(`${getServiceUrl('transaction-service', 3003)}/api/carrito`, req.body, {
      headers: { Authorization: req.headers.authorization },
      timeout: 30000
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.get('/api/carrito', async (req, res) => {
  try {
    const response = await axios.get(`${getServiceUrl('transaction-service', 3003)}/api/carrito`, {
      headers: { Authorization: req.headers.authorization },
      timeout: 30000
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.post('/api/checkout', async (req, res) => {
  try {
    const response = await axios.post(`${getServiceUrl('transaction-service', 3003)}/api/checkout`, req.body, {
      headers: { Authorization: req.headers.authorization },
      timeout: 30000
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

Object.keys(services).forEach(path => {
  if (path === '/api/auth' || path === '/api/carrito' || path === '/api/checkout') return;

  app.use(path, createProxyMiddleware({
    target: services[path],
    changeOrigin: true,
    timeout: 60000,
    proxyTimeout: 60000,
    secure: false,
    logLevel: 'silent',
    onProxyReq: (proxyReq, req, res) => {
      proxyReq.setTimeout(60000);
    },
    onError: (err, req, res) => {
      console.error(`❌ Proxy error ${path}: ${err.message}`);
      if (!res.headersSent) {
        res.status(503).json({ error: 'Servicio no disponible' });
      }
    }
  }));
});

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

app.get('/salud', (req, res) => {
  res.json({
    estado: 'activo',
    gateway: 'simple-proxy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    servicios_configurados: Object.keys(services).length,
    modo: isDocker ? 'Docker' : 'Local'
  });
});

app.get('/', (req, res) => {
  res.json({
    mensaje: 'Simple Gateway - Estilo y Moda',
    version: '1.0.0',
    servicios_disponibles: Object.keys(services).length,
    modo: isDocker ? 'Docker' : 'Local',
    documentacion: {
      estado_servicios: '/estado-servicios',
      salud: '/salud'
    }
  });
});

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Simple Gateway ejecutándose en puerto ${port}`);
  console.log(`📋 ${Object.keys(services).length} rutas configuradas`);
  console.log(`🐳 Modo: ${isDocker ? 'Docker' : 'Local'}`);
  console.log(`🔗 Estado servicios: http://localhost:${port}/estado-servicios`);
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`\n❌ ERROR CRÍTICO: El puerto ${port} está ocupado.`);
    process.exit(1);
  } else {
    console.error('❌ Error del servidor:', e);
  }
});
