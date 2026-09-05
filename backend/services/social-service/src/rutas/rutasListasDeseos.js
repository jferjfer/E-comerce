const express = require('express');
const { autenticar } = require('../middleware/autenticacion');

const router = express.Router();

// Placeholder para rutas de listas de deseos
router.get('/', autenticar, (req, res) => {
  res.json({ mensaje: 'Endpoint de listas de deseos - Por implementar' });
});

module.exports = router;