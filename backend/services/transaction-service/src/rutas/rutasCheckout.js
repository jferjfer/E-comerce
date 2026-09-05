const express = require('express');
const ControladorCheckout = require('../controladores/controladorCheckout');
const { autenticar } = require('../middleware/autenticacion');

const router = express.Router();

// Ruta para procesar checkout
// Se puede requerir autenticación si se desea: router.post('/', autenticar, ControladorCheckout.procesarCheckout);
router.post('/', ControladorCheckout.procesarCheckout);

module.exports = router;
