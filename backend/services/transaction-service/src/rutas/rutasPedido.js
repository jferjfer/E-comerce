const express = require('express');
const { autenticar } = require('../middleware/autenticacion');

const router = express.Router();

// Placeholder para rutas de pedidos
router.get('/', autenticar, (req, res) => {
  res.json({ mensaje: 'Endpoint de pedidos - Por implementar' });
});

module.exports = router;