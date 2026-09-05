const express = require('express');
const { autenticar } = require('../middleware/autenticacion');

const router = express.Router();

// Placeholder para rutas de pagos
router.get('/', autenticar, (req, res) => {
  res.json({ mensaje: 'Endpoint de pagos - Por implementar' });
});

module.exports = router;