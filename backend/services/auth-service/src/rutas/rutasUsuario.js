const express = require('express');
const ControladorUsuario = require('../controladores/controladorUsuario');
const ControladorRRHH = require('../controladores/controladorRRHH');
const { autenticar } = require('../middleware/autenticacion');

const router = express.Router();

// Middleware para verificar rol RRHH o CEO
const soloRRHH = (req, res, next) => {
  const rolesPermitidos = ['rrhh', 'ceo'];
  if (!rolesPermitidos.includes(req.usuario.rol)) {
    return res.status(403).json({ error: 'Acceso denegado. Solo RRHH o CEO.' });
  }
  next();
};

// GET /api/usuarios/perfil
router.get('/perfil', autenticar, ControladorUsuario.obtenerPerfil);

// PUT /api/usuarios/perfil
router.put('/perfil', autenticar, ControladorUsuario.actualizarPerfil);

// PUT /api/usuarios/total-compras
router.put('/total-compras', autenticar, ControladorUsuario.actualizarTotalCompras);

// ============================================
// RUTAS RRHH
// ============================================

// GET /api/usuarios/rrhh/empleados — listar todos los empleados
router.get('/rrhh/empleados', autenticar, soloRRHH, ControladorRRHH.listarEmpleados);

// POST /api/usuarios/rrhh/crear — crear usuario interno
router.post('/rrhh/crear', autenticar, soloRRHH, ControladorRRHH.crearEmpleado);

// PUT /api/usuarios/rrhh/:id — editar usuario
router.put('/rrhh/:id', autenticar, soloRRHH, ControladorRRHH.editarEmpleado);

// PUT /api/usuarios/rrhh/:id/estado — activar/desactivar
router.put('/rrhh/:id/estado', autenticar, soloRRHH, ControladorRRHH.cambiarEstado);

// DELETE /api/usuarios/rrhh/:id — eliminar usuario
router.delete('/rrhh/:id', autenticar, soloRRHH, ControladorRRHH.eliminarEmpleado);

// GET /api/usuarios/:id
router.get('/:id', ControladorUsuario.obtenerUsuarioPorId);

module.exports = router;