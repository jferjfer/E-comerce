const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = process.env.PUERTO || 3000;

// CORS - Configuración unificada
const ALLOWED_ORIGINS = [
  'http://localhost:3005',
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Proxy manual para subida de imágenes (ANTES de parsear body)
const FormData = require('form-data');
const multer = require('multer');
const upload = multer();

app.post('/api/productos/:id/imagen', upload.single('imagen'), async (req, res) => {
  try {
    const form = new FormData();
    form.append('imagen', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    
    const response = await axios.post(
      `http://catalog-service:3002/api/productos/${req.params.id}/imagen`,
      form,
      {
        headers: form.getHeaders(),
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      }
    );
    
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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

// Proxies a microservicios - DOCKER NETWORK
const services = {
  '/api/auth': 'http://auth-service:3011',
  '/api/usuarios': 'http://auth-service:3011',
  '/api/productos': 'http://catalog-service:3002',
  '/api/categorias': 'http://catalog-service:3002',
  '/api/buscar': 'http://catalog-service:3002',
  '/api/tendencias': 'http://catalog-service:3002',
  '/api/carrito': 'http://transaction-service:3003',
  '/api/pedidos': 'http://transaction-service:3003',
  '/api/devoluciones': 'http://transaction-service:3003',
  '/api/pagos': 'http://transaction-service:3003',
  '/api/checkout': 'http://transaction-service:3003',
  '/api/resenas': 'http://social-service:3004',
  '/api/preguntas': 'http://social-service:3004',
  '/api/listas-deseos': 'http://social-service:3004',
  '/api/cupones': 'http://marketing-service:3006',
  '/api/campanas': 'http://marketing-service:3006',
  '/api/fidelizacion': 'http://marketing-service:3006',
  '/api/analytics': 'http://marketing-service:3006',
  '/api/recomendaciones': 'http://ai-service:3007',
  '/api/perfil': 'http://ai-service:3007',
  '/api/analisis': 'http://ai-service:3007',
  '/api/estilos': 'http://ai-service:3007',
  '/api/chat': 'http://ai-service:3007',
  '/api/credito': 'http://credit-service:3008',
  '/api/inventario': 'http://logistics-service:3009',
  '/api/almacenes': 'http://logistics-service:3009',
  '/api/entregas': 'http://logistics-service:3009'
};

// Manejo directo optimizado para auth endpoints
const manejarAuthDirecto = async (req, res, endpoint) => {
  const inicio = Date.now();
  console.log(`🔐 ${endpoint.toUpperCase()} DIRECTO iniciado`);

  try {
    const respuesta = await axios({
      method: req.method,
      url: `http://auth-service:3011/api/auth/${endpoint}`,
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization
      },
      timeout: 5000
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

// Manejo directo de rutas principales de productos
app.get('/api/productos', async (req, res) => {
  try {
    const response = await axios({
      method: 'GET',
      url: `http://catalog-service:3002${req.url}`,
      headers: { Authorization: req.headers.authorization },
      timeout: 10000
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.post('/api/productos', async (req, res) => {
  try {
    const response = await axios({
      method: 'POST',
      url: `http://catalog-service:3002${req.url}`,
      data: req.body,
      headers: { Authorization: req.headers.authorization },
      timeout: 10000
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.get('/api/productos/:id', async (req, res) => {
  try {
    const response = await axios({
      method: 'GET',
      url: `http://catalog-service:3002${req.url}`,
      headers: { Authorization: req.headers.authorization },
      timeout: 10000
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.all('/api/categorias*', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `http://catalog-service:3002${req.url}`,
      data: req.body,
      headers: { Authorization: req.headers.authorization },
      timeout: 10000
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.all('/api/carrito*', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `http://transaction-service:3003${req.url}`,
      data: req.body,
      headers: { Authorization: req.headers.authorization },
      timeout: 30000
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.all('/api/pedidos*', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `http://transaction-service:3003${req.url}`,
      data: req.body,
      headers: { Authorization: req.headers.authorization },
      timeout: 30000
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.all('/api/checkout*', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `http://transaction-service:3003${req.url}`,
      data: req.body,
      headers: { Authorization: req.headers.authorization },
      timeout: 30000
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.all('/api/devoluciones*', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `http://transaction-service:3003${req.url}`,
      data: req.body,
      headers: { Authorization: req.headers.authorization },
      timeout: 30000
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.all('/api/chat*', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `http://ai-service:3007${req.url}`,
      data: req.body,
      headers: { Authorization: req.headers.authorization },
      timeout: 30000  // 30 segundos para IA
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

// Proxy para rutas restantes
Object.keys(services).forEach(path => {
  if (['/api/auth', '/api/productos', '/api/categorias', '/api/carrito', '/api/pedidos', '/api/checkout'].includes(path)) return;

  app.use(path, createProxyMiddleware({
    target: services[path],
    changeOrigin: true,
    timeout: 10000,
    proxyTimeout: 10000,
    secure: false,
    logLevel: 'silent'
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

const server = app.listen(port, () => {
  console.log(`🚀 Simple Gateway ejecutándose en puerto ${port}`);
  console.log(`📋 ${Object.keys(services).length} rutas configuradas`);
  console.log(`🔗 Estado servicios: http://localhost:${port}/estado-servicios`);
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`\n❌ ERROR CRÍTICO: El puerto ${port} está ocupado.`);
    console.error(`👉 Solución: Ejecuta 'npm run limpiar-puertos' o cierra la terminal que esté usando este puerto.\n`);
    process.exit(1);
  } else {
    console.error('❌ Error del servidor:', e);
  }
});