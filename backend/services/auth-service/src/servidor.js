const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const rutasAuth = require('./rutas/rutasAuth');

const aplicacion = express();
const puerto = process.env.PUERTO || 3001;

// Middleware de seguridad
aplicacion.use(helmet());
aplicacion.use(cors());
aplicacion.use(express.json({ limit: '10mb' }));

// Rutas
aplicacion.use('/api/auth', rutasAuth);
aplicacion.use('/', rutasAuth);

// Ruta de salud
aplicacion.get('/salud', (req, res) => {
  res.json({ 
    estado: 'activo', 
    servicio: 'autenticacion',
    timestamp: new Date().toISOString()
  });
});

// Manejador de errores simple
aplicacion.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

aplicacion.listen(puerto, () => {
  console.log(`🚀 Servicio de Autenticación ejecutándose en puerto ${puerto}`);
});

module.exports = aplicacion;