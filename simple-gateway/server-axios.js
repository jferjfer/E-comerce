const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = process.env.PUERTO || 3000;
const isDocker = process.env.DOCKER_ENV === 'true';

const getServiceUrl = (service, port) => {
  return isDocker ? `http://${service}:${port}` : `http://localhost:${port}`;
};

app.use(cors({
  origin: ['http://localhost:3005', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json());

app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url} - ${new Date().toLocaleTimeString()}`);
  next();
});

// Helper para hacer proxy con axios
const proxyRequest = async (req, res, serviceUrl) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${serviceUrl}${req.url}`,
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization
      },
      timeout: 30000
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const data = error.response?.data || { error: error.message };
    res.status(status).json(data);
  }
};

// Auth Service
app.all('/api/auth/*', (req, res) => proxyRequest(req, res, getServiceUrl('auth-service', 3011)));
app.all('/api/usuarios/*', (req, res) => proxyRequest(req, res, getServiceUrl('auth-service', 3011)));

// Catalog Service
app.all('/api/productos*', (req, res) => proxyRequest(req, res, getServiceUrl('catalog-service', 3002)));
app.all('/api/categorias*', (req, res) => proxyRequest(req, res, getServiceUrl('catalog-service', 3002)));
app.all('/api/buscar*', (req, res) => proxyRequest(req, res, getServiceUrl('catalog-service', 3002)));
app.all('/api/tendencias*', (req, res) => proxyRequest(req, res, getServiceUrl('catalog-service', 3002)));

// Transaction Service
app.all('/api/carrito*', (req, res) => proxyRequest(req, res, getServiceUrl('transaction-service', 3003)));
app.all('/api/pedidos*', (req, res) => proxyRequest(req, res, getServiceUrl('transaction-service', 3003)));
app.all('/api/checkout*', (req, res) => proxyRequest(req, res, getServiceUrl('transaction-service', 3003)));
app.all('/api/pagos*', (req, res) => proxyRequest(req, res, getServiceUrl('transaction-service', 3003)));

// Social Service
app.all('/api/resenas*', (req, res) => proxyRequest(req, res, getServiceUrl('social-service', 3004)));
app.all('/api/preguntas*', (req, res) => proxyRequest(req, res, getServiceUrl('social-service', 3004)));
app.all('/api/listas-deseos*', (req, res) => proxyRequest(req, res, getServiceUrl('social-service', 3004)));

// Marketing Service
app.all('/api/cupones*', (req, res) => proxyRequest(req, res, getServiceUrl('marketing-service', 3006)));
app.all('/api/campanas*', (req, res) => proxyRequest(req, res, getServiceUrl('marketing-service', 3006)));
app.all('/api/fidelizacion*', (req, res) => proxyRequest(req, res, getServiceUrl('marketing-service', 3006)));
app.all('/api/analytics*', (req, res) => proxyRequest(req, res, getServiceUrl('marketing-service', 3006)));

// AI Service
app.all('/api/recomendaciones*', (req, res) => proxyRequest(req, res, getServiceUrl('ai-service', 3007)));
app.all('/api/perfil*', (req, res) => proxyRequest(req, res, getServiceUrl('ai-service', 3007)));
app.all('/api/analisis*', (req, res) => proxyRequest(req, res, getServiceUrl('ai-service', 3007)));
app.all('/api/estilos*', (req, res) => proxyRequest(req, res, getServiceUrl('ai-service', 3007)));

// Estado de servicios
app.get('/estado-servicios', async (req, res) => {
  const services = [
    { name: 'auth-service', port: 3011 },
    { name: 'catalog-service', port: 3002 },
    { name: 'transaction-service', port: 3003 },
    { name: 'social-service', port: 3004 },
    { name: 'marketing-service', port: 3006 },
    { name: 'ai-service', port: 3007 }
  ];

  const status = {};
  for (const service of services) {
    try {
      const url = `${getServiceUrl(service.name, service.port)}/salud`;
      const response = await axios.get(url, { timeout: 3000 });
      status[service.name] = { estado: 'activo', ...response.data };
    } catch (error) {
      status[service.name] = { estado: 'inactivo', error: error.message };
    }
  }

  const activos = Object.values(status).filter(s => s.estado === 'activo').length;
  res.json({
    timestamp: new Date().toISOString(),
    resumen: {
      total: services.length,
      activos,
      inactivos: services.length - activos,
      disponibilidad: Math.round((activos / services.length) * 100) + '%'
    },
    servicios: status
  });
});

app.get('/salud', (req, res) => {
  res.json({
    estado: 'activo',
    gateway: 'axios-gateway',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    modo: isDocker ? 'Docker' : 'Local'
  });
});

app.get('/', (req, res) => {
  res.json({
    mensaje: 'Gateway Axios - Estilo y Moda',
    version: '2.0.0',
    modo: isDocker ? 'Docker' : 'Local',
    documentacion: {
      estado_servicios: '/estado-servicios',
      salud: '/salud'
    }
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Gateway Axios ejecutándose en puerto ${port}`);
  console.log(`🐳 Modo: ${isDocker ? 'Docker' : 'Local'}`);
  console.log(`🔗 Estado: http://localhost:${port}/estado-servicios`);
});
