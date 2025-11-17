const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const rutasResenas = require('./rutas/rutasResenas');

const aplicacion = express();
const puerto = process.env.PUERTO || 3004;

// Middleware de seguridad
aplicacion.use(helmet());
aplicacion.use(cors());
aplicacion.use(express.json({ limit: '10mb' }));

// Rutas
aplicacion.use('/api/resenas', rutasResenas);

// Rutas simples
aplicacion.get('/api/preguntas', (req, res) => {
  res.json({ preguntas: [] });
});

aplicacion.get('/api/listas-deseos', (req, res) => {
  res.json({ listas: [] });
});

// Ruta de salud
aplicacion.get('/salud', (req, res) => {
  res.json({ 
    estado: 'activo', 
    servicio: 'social',
    timestamp: new Date().toISOString()
  });
});

// Manejador de errores simple
aplicacion.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

aplicacion.listen(puerto, () => {
  console.log(`🚀 Servicio Social ejecutándose en puerto ${puerto}`);
});

module.exports = aplicacion;