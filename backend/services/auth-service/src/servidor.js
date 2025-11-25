const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const rutasAuth = require('./rutas/rutasAuth');
const rutasUsuario = require('./rutas/rutasUsuario');
const manejadorErrores = require('./middleware/manejadorErrores');

const aplicacion = express();
const puerto = process.env.PUERTO || 3011;

// Middleware de seguridad
aplicacion.use(helmet());
aplicacion.use(cors({
  origin: ['http://localhost:3005', 'http://localhost:3000'],
  credentials: true
}));
aplicacion.use(express.json({ limit: '10mb' }));

// Logging middleware detallado
aplicacion.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`🔐 [${timestamp}] ${req.method} ${req.url}`);
  
  if (req.body && Object.keys(req.body).length > 0) {
    const bodyLog = { ...req.body };
    if (bodyLog.password) bodyLog.password = '***';
    if (bodyLog.contrasena) bodyLog.contrasena = '***';
    console.log(`   └─ Body:`, JSON.stringify(bodyLog, null, 2));
  }
  
  // Log de respuesta
  const originalSend = res.send;
  res.send = function(data) {
    if (res.statusCode >= 400) {
      console.error(`❌ [${timestamp}] Error Response ${res.statusCode}:`, data);
    } else {
      console.log(`✅ [${timestamp}] Success Response ${res.statusCode}`);
    }
    originalSend.call(this, data);
  };
  
  next();
});

// Rutas
aplicacion.use('/api/auth', rutasAuth);
aplicacion.use('/api/usuarios', rutasUsuario);
aplicacion.use('/', rutasAuth); // Compatibilidad

// Ruta de salud
aplicacion.get('/salud', (req, res) => {
  res.json({ 
    estado: 'activo', 
    servicio: 'autenticacion',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    endpoints: ['/api/auth/login', '/api/auth/register', '/api/usuarios/perfil']
  });
});

// Manejador de errores
aplicacion.use(manejadorErrores);

aplicacion.listen(puerto, () => {
  console.log(`🚀 Auth Service v2.0 ejecutándose en puerto ${puerto}`);
  console.log(`📋 Endpoints disponibles:`);
  console.log(`   • POST /api/auth/login`);
  console.log(`   • POST /api/auth/register`);
  console.log(`   • GET /api/usuarios/perfil`);
});

module.exports = aplicacion;