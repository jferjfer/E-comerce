const express = require('express');
const ControladorUsuario = require('../controladores/controladorUsuario');
const { autenticar } = require('../middleware/autenticacion');

const router = express.Router();

// GET /api/usuarios/perfil
router.get('/perfil', autenticar, ControladorUsuario.obtenerPerfil);

// GET /api/usuarios/:id - Obtener usuario por ID (sin autenticación para microservicios)
router.get('/:id', ControladorUsuario.obtenerUsuarioPorId);

// PUT /api/usuarios/total-compras
router.put('/total-compras', autenticar, ControladorUsuario.actualizarTotalCompras);

module.exports = router;