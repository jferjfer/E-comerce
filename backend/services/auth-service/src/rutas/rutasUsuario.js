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

// GET /api/usuarios/todos — para credit-service (cron de bonos)
router.get('/todos/clientes', async (req, res) => {
  try {
    const pool = require('../config/baseDatos');
    const resultado = await pool.query(
      `SELECT id, nombre, email, rol, fecha_creacion, total_compras_historico, activo
       FROM usuarios
       WHERE rol = 'cliente' AND activo = true
       ORDER BY fecha_creacion ASC`
    );
    res.json({ usuarios: resultado.rows, total: resultado.rows.length });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo usuarios' });
  }
});

module.exports = router;