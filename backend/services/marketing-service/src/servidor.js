const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const aplicacion = express();
const puerto = process.env.PUERTO || 3006;

aplicacion.use(helmet());
aplicacion.use(cors());
aplicacion.use(express.json());

aplicacion.get('/salud', (req, res) => {
  res.json({
    estado: 'activo',
    servicio: 'marketing',
    timestamp: new Date().toISOString()
  });
});

aplicacion.get('/api/cupones', (req, res) => {
  res.json({
    cupones: [
      { codigo: 'BIENVENIDO20', descuento: 20, tipo: 'porcentaje', activo: true },
      { codigo: 'ENVIOGRATIS', descuento: 0, tipo: 'envio_gratis', activo: true }
    ]
  });
});

aplicacion.get('/api/fidelizacion/:usuarioId', (req, res) => {
  res.json({
    usuario_id: req.params.usuarioId,
    puntos_totales: 1250,
    puntos_disponibles: 850,
    nivel: 'oro'
  });
});

aplicacion.listen(puerto, () => {
  console.log(`🚀 Marketing ejecutándose en puerto ${puerto}`);
});

module.exports = aplicacion;