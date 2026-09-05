const express = require('express');
const { autenticar } = require('../middleware/autenticacion');

const router = express.Router();

// Placeholder para rutas de preguntas
router.get('/', (req, res) => {
  res.json({ mensaje: 'Endpoint de preguntas - Por implementar' });
});

module.exports = router;