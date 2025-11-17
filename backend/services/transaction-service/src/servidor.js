const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const rutasCarrito = require('./rutas/rutasCarrito');

const aplicacion = express();
const puerto = process.env.PUERTO || 3003;

// Middleware de seguridad
aplicacion.use(helmet());
aplicacion.use(cors());
aplicacion.use(express.json({ limit: '10mb' }));

// Rutas
aplicacion.use('/api/carrito', rutasCarrito);

// Ruta de salud
aplicacion.get('/salud', (req, res) => {
  res.json({ 
    estado: 'activo', 
    servicio: 'transacciones',
    timestamp: new Date().toISOString()
  });
});

// Manejador de errores simple
aplicacion.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

aplicacion.listen(puerto, () => {
  console.log(`🚀 Servicio de Transacciones ejecutándose en puerto ${puerto}`);
});

module.exports = aplicacion;