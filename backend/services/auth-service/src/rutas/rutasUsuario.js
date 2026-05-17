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

// GET /api/usuarios/buscar?q= — buscar clientes por nombre o email (customer_success)
router.get('/buscar/clientes', autenticar, async (req, res) => {
  try {
    const rolesPermitidos = ['customer_success', 'ceo', 'support_agent'];
    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ error: 'Sin permisos' });
    }
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Ingresa al menos 2 caracteres' });
    }
    const pool = require('../config/baseDatos');
    const resultado = await pool.query(
      `SELECT id, nombre, apellido, email, telefono, ciudad, documento_tipo,
              documento_numero, total_compras_historico, activo, fecha_creacion
       FROM usuarios
       WHERE rol = 'cliente'
         AND (email ILIKE $1 OR documento_numero ILIKE $1)
       ORDER BY nombre ASC LIMIT 20`,
      [`%${q.trim()}%`]
    );
    res.json({ clientes: resultado.rows, total: resultado.rows.length });
  } catch (error) {
    res.status(500).json({ error: 'Error buscando clientes' });
  }
});

// GET /api/usuarios/cliente/:id/trazabilidad — trazabilidad completa (customer_success)
router.get('/cliente/:id/trazabilidad', autenticar, async (req, res) => {
  try {
    const rolesPermitidos = ['customer_success', 'ceo', 'support_agent'];
    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ error: 'Sin permisos' });
    }
    const { id } = req.params;
    const pool = require('../config/baseDatos');
    const axios = require('axios');

    // 1. Perfil completo
    const perfil = await pool.query(
      `SELECT id, nombre, apellido, email, rol, telefono, ciudad, departamento,
              direccion, documento_tipo, documento_numero, genero, fecha_nacimiento,
              total_compras_historico, activo, acepta_marketing,
              fecha_creacion, fecha_actualizacion
       FROM usuarios WHERE id = $1 AND rol = 'cliente'`,
      [parseInt(id)]
    );
    if (perfil.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // 2. Log de auditoría
    const auditoria = await pool.query(
      `SELECT accion, entidad_afectada, ip_address, fecha_hora
       FROM log_auditoria WHERE id_usuario = $1
       ORDER BY fecha_hora DESC LIMIT 50`,
      [parseInt(id)]
    );

    // 3. Intentos de login
    const intentos = await pool.query(
      `SELECT ip_address, exitoso, fecha
       FROM intentos_login WHERE email = $1
       ORDER BY fecha DESC LIMIT 20`,
      [perfil.rows[0].email]
    );

    // 4. Pedidos desde transaction-service
    let pedidos = [];
    try {
      const resPedidos = await axios.get(
        `${process.env.TRANSACTION_SERVICE_URL || 'http://transaction-service:3003'}/api/pedidos`,
        { headers: { Authorization: req.headers.authorization }, timeout: 5000 }
      );
      pedidos = resPedidos.data.pedidos || [];
    } catch (e) { console.log('⚠️ No se pudieron obtener pedidos:', e.message); }

    // 5. Devoluciones desde transaction-service
    let devoluciones = [];
    try {
      const resDev = await axios.get(
        `${process.env.TRANSACTION_SERVICE_URL || 'http://transaction-service:3003'}/api/devoluciones`,
        { headers: { Authorization: req.headers.authorization }, timeout: 5000 }
      );
      devoluciones = (resDev.data.devoluciones || []).filter(
        (d) => String(d.usuario_id) === String(id)
      );
    } catch (e) { console.log('⚠️ No se pudieron obtener devoluciones:', e.message); }

    // 6. Bonos desde credit-service
    let bonos = [];
    try {
      const resBonos = await axios.get(
        `${process.env.CREDIT_SERVICE_URL || 'http://credit-service:3008'}/api/bonos/usuario/${id}`,
        { timeout: 5000 }
      );
      bonos = resBonos.data.bonos || [];
    } catch (e) { console.log('⚠️ No se pudieron obtener bonos:', e.message); }

    // Registrar en auditoría que se consultó este cliente
    await pool.query(
      `INSERT INTO log_auditoria (id_usuario, accion, entidad_afectada)
       VALUES ($1, 'CONSULTA_CLIENTE', $2)`,
      [req.usuario.id, `Cliente ID ${id} consultado por ${req.usuario.email}`]
    );

    res.json({
      perfil: perfil.rows[0],
      auditoria: auditoria.rows,
      intentos_login: intentos.rows,
      pedidos,
      devoluciones,
      bonos,
      resumen: {
        total_pedidos: pedidos.length,
        total_devoluciones: devoluciones.length,
        total_bonos: bonos.length,
        bonos_disponibles: bonos.filter((b) => b.estado === 'Disponible').length,
        ultimo_login: intentos.rows.find((i) => i.exitoso)?.fecha || null
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo trazabilidad' });
  }
});

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