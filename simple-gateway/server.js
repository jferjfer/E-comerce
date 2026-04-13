const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const axios = require('axios');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const port = process.env.PUERTO || 3000;

// Seguridad con helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
  hsts: { maxAge: 31536000, includeSubDomains: true },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// Ocultar información del servidor
app.disable('x-powered-by');

// Rate limiting general — 200 requests por minuto por IP
const limiterGeneral = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  message: { error: 'Demasiadas solicitudes, intenta en un minuto' },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting estricto para auth — 10 intentos por minuto
const limiterAuth = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos de autenticación, intenta en un minuto' },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting para checkout — 20 por minuto
const limiterCheckout = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Demasiadas solicitudes de pago, intenta en un minuto' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiterGeneral);

// Crear servidor HTTP + Socket.IO
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [
      'http://localhost:3005',
      'http://149.130.182.9:3005',
      'http://localhost:5173',
      'http://localhost:3000',
      'http://149.130.182.9:3000',
      'http://149.130.182.9',
      'http://34.173.145.178',
      'http://34.123.67.97',
      'https://egoscolombia.com.co',
      'https://www.egoscolombia.com.co',
      'http://egoscolombia.com.co',
      'http://www.egoscolombia.com.co'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Mapa de usuarios conectados: usuarioId -> Set de socketIds
const usuariosConectados = new Map();

io.on('connection', (socket) => {
  console.log(`🔌 Socket conectado: ${socket.id}`);

  // Cliente se identifica con su usuarioId
  socket.on('identificar', (usuarioId) => {
    if (!usuarioId) return;
    const id = String(usuarioId);
    if (!usuariosConectados.has(id)) usuariosConectados.set(id, new Set());
    usuariosConectados.get(id).add(socket.id);
    socket.join(`usuario_${id}`);
    console.log(`👤 Usuario ${id} identificado (socket: ${socket.id})`);
  });

  // Roles admin se unen a sala general
  socket.on('unirse_admin', (rol) => {
    socket.join('admins');
    console.log(`🔑 Admin [${rol}] unido a sala admins (socket: ${socket.id})`);
  });

  socket.on('disconnect', () => {
    usuariosConectados.forEach((sockets, userId) => {
      sockets.delete(socket.id);
      if (sockets.size === 0) usuariosConectados.delete(userId);
    });
    console.log(`🔌 Socket desconectado: ${socket.id}`);
  });
});

// Endpoint interno para que microservicios emitan eventos
app.post('/interno/emitir', express.json(), (req, res) => {
  const { evento, datos, usuarioId, sala } = req.body;
  if (!evento) return res.status(400).json({ error: 'evento requerido' });

  if (usuarioId) {
    io.to(`usuario_${usuarioId}`).emit(evento, datos);
    console.log(`📡 Evento [${evento}] emitido a usuario ${usuarioId}`);
  }
  if (sala) {
    io.to(sala).emit(evento, datos);
    console.log(`📡 Evento [${evento}] emitido a sala ${sala}`);
  }
  if (!usuarioId && !sala) {
    io.emit(evento, datos);
  }

  res.json({ ok: true });
});

// CORS - Configuración unificada
const ALLOWED_ORIGINS = [
  'http://localhost:3005',
  'http://149.130.182.9:3005',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://149.130.182.9:3000',
  'http://149.130.182.9',
  'http://34.173.145.178',
  'http://34.123.67.97',
  'https://egoscolombia.com.co',
  'https://www.egoscolombia.com.co',
  'http://egoscolombia.com.co',
  'http://www.egoscolombia.com.co',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || ALLOWED_ORIGINS.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
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
      `${CATALOG_URL}/api/productos/${req.params.id}/imagen`,
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



// Avatar Virtual 3D - Crear avatar completo
app.post('/api/avatar/crear', upload.fields([
  { name: 'foto_cara', maxCount: 1 },
  { name: 'foto_cuerpo', maxCount: 1 }
]), async (req, res) => {
  try {
    const form = new FormData();

    // Agregar fotos
    if (req.files['foto_cara']) {
      form.append('foto_cara', req.files['foto_cara'][0].buffer, {
        filename: req.files['foto_cara'][0].originalname,
        contentType: req.files['foto_cara'][0].mimetype
      });
    }

    if (req.files['foto_cuerpo']) {
      form.append('foto_cuerpo', req.files['foto_cuerpo'][0].buffer, {
        filename: req.files['foto_cuerpo'][0].originalname,
        contentType: req.files['foto_cuerpo'][0].mimetype
      });
    }

    // Agregar otros campos
    form.append('producto_url', req.body.producto_url);
    form.append('animacion', req.body.animacion || 'catwalk');

    console.log('🎨 Proxy: Creando avatar 3D...');

    const response = await axios.post(
      `${AI_URL}/api/avatar/crear`,
      form,
      {
        headers: form.getHeaders(),
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        timeout: 180000  // 3 minutos
      }
    );

    console.log('✅ Avatar creado exitosamente');
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('❌ Error creando avatar:', error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

// Avatar Virtual 3D - Demo sin fotos
app.post('/api/avatar/demo', express.json(), async (req, res) => {
  try {
    const response = await axios.post(
      `${AI_URL}/api/avatar/demo`,
      new URLSearchParams({ producto_url: req.body.producto_url }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 30000
      }
    );

    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

// Avatar Virtual 3D - Listar animaciones
app.get('/api/avatar/animaciones', async (req, res) => {
  try {
    const response = await axios.get(`${AI_URL}/api/avatar/animaciones`);
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
  console.log(`   Origin: ${req.headers.origin || 'No origin'}`);

  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`📋 Body:`, JSON.stringify(req.body, null, 2));
  }

  if (req.headers.authorization) {
    console.log(`🔑 Auth: Bearer ***${req.headers.authorization.slice(-10)}`);
  }

  next();
});

// URLs de microservicios - usa variables de entorno si existen (Render), sino usa Docker network (local)
const CONTABILIDAD_URL = process.env.CONTABILIDAD_SERVICE_URL || 'http://contabilidad-service:3012';
const FACTURACION_URL = process.env.FACTURACION_SERVICE_URL || 'http://facturacion-service:3010';

const AUTH_URL      = process.env.AUTH_SERVICE_URL      || 'http://auth-service:3011';
const CATALOG_URL   = process.env.CATALOG_SERVICE_URL   || 'http://catalog-service:3002';
const TRANS_URL     = process.env.TRANSACTION_SERVICE_URL || 'http://transaction-service:3003';
const SOCIAL_URL    = process.env.SOCIAL_SERVICE_URL    || 'http://social-service:3004';
const MARKETING_URL = process.env.MARKETING_SERVICE_URL || 'http://marketing-service:3006';
const AI_URL        = process.env.AI_SERVICE_URL        || 'http://ai-service:3007';
const CREDIT_URL    = process.env.CREDIT_SERVICE_URL    || 'http://credit-service:3008';
const LOGISTICS_URL = process.env.LOGISTICS_SERVICE_URL || 'http://logistics-service:3009';

const services = {
  '/api/contabilidad': CONTABILIDAD_URL,
  '/api/auth': AUTH_URL,
  '/api/usuarios': AUTH_URL,
  '/api/productos': CATALOG_URL,
  '/api/categorias': CATALOG_URL,
  '/api/buscar': CATALOG_URL,
  '/api/tendencias': CATALOG_URL,
  '/api/carrito': TRANS_URL,
  '/api/pedidos': TRANS_URL,
  '/api/devoluciones': TRANS_URL,
  '/api/pagos': TRANS_URL,
  '/api/checkout': TRANS_URL,
  '/api/resenas': SOCIAL_URL,
  '/api/preguntas': SOCIAL_URL,
  '/api/listas-deseos': SOCIAL_URL,
  '/api/cupones': MARKETING_URL,
  '/api/campanas': MARKETING_URL,
  '/api/fidelizacion': MARKETING_URL,
  '/api/analytics': MARKETING_URL,
  '/api/recomendaciones': AI_URL,
  '/api/perfil': AI_URL,
  '/api/analisis': AI_URL,
  '/api/estilos': AI_URL,
  '/api/chat': AI_URL,
  '/api/credito': CREDIT_URL,
  '/api/inventario': LOGISTICS_URL,
  '/api/almacenes': LOGISTICS_URL,
  '/api/entregas': LOGISTICS_URL
};

// Manejo directo optimizado para auth endpoints
const manejarAuthDirecto = async (req, res, endpoint) => {
  const inicio = Date.now();
  console.log(`🔐 ${endpoint.toUpperCase()} DIRECTO iniciado`);

  try {
    const respuesta = await axios({
      method: req.method,
      url: `${AUTH_URL}/api/auth/${endpoint}`,
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

// Rutas auth optimizadas con rate limiting estricto
app.post('/api/auth/register', limiterAuth, (req, res) => manejarAuthDirecto(req, res, 'register'));
app.post('/api/auth/registro', limiterAuth, (req, res) => manejarAuthDirecto(req, res, 'registro'));
app.post('/api/auth/login', limiterAuth, (req, res) => manejarAuthDirecto(req, res, 'login'));
app.get('/api/auth/verificar', (req, res) => manejarAuthDirecto(req, res, 'verificar'));
app.post('/api/auth/logout', (req, res) => manejarAuthDirecto(req, res, 'logout'));
app.post('/api/auth/solicitar-recuperacion', limiterAuth, (req, res) => manejarAuthDirecto(req, res, 'solicitar-recuperacion'));
app.post('/api/auth/restablecer-contrasena', limiterAuth, (req, res) => manejarAuthDirecto(req, res, 'restablecer-contrasena'));

// Rutas de usuarios
app.get('/api/usuarios/perfil', async (req, res) => {
  try {
    const response = await axios({
      method: 'GET',
      url: `${AUTH_URL}/api/usuarios/perfil`,
      headers: { Authorization: req.headers.authorization },
      timeout: 5000
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.put('/api/usuarios/perfil', async (req, res) => {
  try {
    const response = await axios({
      method: 'PUT',
      url: `${AUTH_URL}/api/usuarios/perfil`,
      data: req.body,
      headers: { Authorization: req.headers.authorization },
      timeout: 5000
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

// Rutas RRHH
app.all('/api/usuarios/rrhh*', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${AUTH_URL}${req.url}`,
      data: req.body,
      headers: { Authorization: req.headers.authorization },
      timeout: 10000
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

// Manejo directo de rutas principales de productos
app.get('/api/productos', async (req, res) => {
  try {
    const response = await axios({
      method: 'GET',
      url: `${CATALOG_URL}${req.url}`,
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
      url: `${CATALOG_URL}${req.url}`,
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
      url: `${CATALOG_URL}${req.url}`,
      headers: { Authorization: req.headers.authorization },
      timeout: 10000
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.put('/api/productos/:id', async (req, res) => {
  try {
    const response = await axios({
      method: 'PUT',
      url: `${CATALOG_URL}${req.url}`,
      data: req.body,
      headers: { Authorization: req.headers.authorization },
      timeout: 10000
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.delete('/api/productos/:id', async (req, res) => {
  try {
    const response = await axios({
      method: 'DELETE',
      url: `${CATALOG_URL}${req.url}`,
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
      url: `${CATALOG_URL}${req.url}`,
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
      url: `${TRANS_URL}${req.url}`,
      data: req.body,
      headers: { Authorization: req.headers.authorization },
      timeout: 30000
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.get('/api/eventos/pedidos', async (req, res) => {
  try {
    const response = await axios({
      method: 'GET',
      url: `${TRANS_URL}/api/eventos/pedidos`,
      headers: { Authorization: req.headers.authorization },
      responseType: 'stream',
      timeout: 0 // sin timeout para SSE
    });
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    response.data.pipe(res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


  try {
    const response = await axios({
      method: req.method,
      url: `${TRANS_URL}${req.url}`,
      data: req.body,
      headers: { Authorization: req.headers.authorization },
      timeout: 30000
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.all('/api/admin*', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${TRANS_URL}${req.url}`,
      data: req.body,
      headers: { Authorization: req.headers.authorization },
      timeout: 30000
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.all('/api/pagos*', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${TRANS_URL}${req.url}`,
      data: req.body,
      headers: { Authorization: req.headers.authorization },
      timeout: 30000
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.all('/api/checkout*', limiterCheckout, async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${TRANS_URL}${req.url}`,
      data: req.body,
      headers: { Authorization: req.headers.authorization },
      timeout: 30000
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.all('/api/credito*', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${CREDIT_URL}${req.url}`,
      data: req.body,
      headers: { Authorization: req.headers.authorization },
      timeout: 10000
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.all('/api/contabilidad*', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${CONTABILIDAD_URL}${req.url}`,
      data: req.body,
      headers: { Authorization: req.headers.authorization },
      timeout: 10000
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.all('/api/facturas*', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${FACTURACION_URL}${req.url}`,
      data: req.body,
      headers: { Authorization: req.headers.authorization },
      timeout: 30000
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.all('/api/notas-credito*', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${FACTURACION_URL}${req.url}`,
      data: req.body,
      headers: { Authorization: req.headers.authorization },
      timeout: 30000
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.all('/api/notas-debito*', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${FACTURACION_URL}${req.url}`,
      data: req.body,
      headers: { Authorization: req.headers.authorization },
      timeout: 30000
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.all('/api/dian*', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${FACTURACION_URL}${req.url}`,
      data: req.body,
      headers: { Authorization: req.headers.authorization },
      timeout: 120000
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.all('/api/bonos*', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${CREDIT_URL}${req.url}`,
      data: req.body,
      headers: { Authorization: req.headers.authorization },
      timeout: 10000
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
      url: `${TRANS_URL}${req.url}`,
      data: req.body,
      headers: { Authorization: req.headers.authorization },
      timeout: 30000
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.all('/api/campanas*', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${MARKETING_URL}${req.url}`,
      data: req.body,
      headers: { Authorization: req.headers.authorization },
      timeout: 10000
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.all('/api/cupones*', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${MARKETING_URL}${req.url}`,
      data: req.body,
      headers: { Authorization: req.headers.authorization },
      timeout: 10000
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.all('/api/fidelizacion*', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${MARKETING_URL}${req.url}`,
      data: req.body,
      headers: { Authorization: req.headers.authorization },
      timeout: 10000
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.all('/api/analytics*', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${MARKETING_URL}${req.url}`,
      data: req.body,
      headers: { Authorization: req.headers.authorization },
      timeout: 10000
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.all('/api/resenas*', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${SOCIAL_URL}${req.url}`,
      data: req.body,
      headers: { Authorization: req.headers.authorization },
      timeout: 10000
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.all('/api/preguntas*', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${SOCIAL_URL}${req.url}`,
      data: req.body,
      headers: { Authorization: req.headers.authorization },
      timeout: 10000
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.all('/api/listas-deseos*', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${SOCIAL_URL}${req.url}`,
      data: req.body,
      headers: { Authorization: req.headers.authorization },
      timeout: 10000
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.all('/api/inventario*', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${LOGISTICS_URL}${req.url}`,
      data: req.body,
      headers: { Authorization: req.headers.authorization },
      timeout: 10000
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.all('/api/almacenes*', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${LOGISTICS_URL}${req.url}`,
      data: req.body,
      headers: { Authorization: req.headers.authorization },
      timeout: 10000
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.all('/api/entregas*', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${LOGISTICS_URL}${req.url}`,
      data: req.body,
      headers: { Authorization: req.headers.authorization },
      timeout: 10000
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.all('/api/envios*', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${LOGISTICS_URL}${req.url}`,
      data: req.body,
      headers: { Authorization: req.headers.authorization },
      timeout: 10000
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.all('/api/domicilios*', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${LOGISTICS_URL}${req.url}`,
      data: req.body,
      headers: { Authorization: req.headers.authorization },
      timeout: 10000
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.all('/api/recomendaciones*', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${AI_URL}${req.url}`,
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
      url: `${AI_URL}${req.url}`,
      data: req.body,
      headers: { Authorization: req.headers.authorization },
      timeout: 30000  // 30 segundos para IA
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

// Proxy específico para virtual-tryon (multipart, preservando path)
app.use('/api/virtual-tryon', createProxyMiddleware({
  target: AI_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/': '/api/virtual-tryon'
  },
  timeout: 180000 // 3 minutos
}));

// Proxy para rutas restantes
Object.keys(services).forEach(path => {
  if (['/api/auth', '/api/productos', '/api/categorias', '/api/carrito', '/api/pedidos', '/api/checkout', '/api/pagos'].includes(path)) return;

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
    mensaje: 'Simple Gateway - EGOS',
    version: '1.0.0',
    servicios_disponibles: Object.keys(services).length,
    documentacion: {
      estado_servicios: '/estado-servicios',
      salud: '/salud'
    }
  });
});

const server = httpServer.listen(port, () => {
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