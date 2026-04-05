const pool = require('../config/baseDatos');
const bcrypt = require('bcryptjs');
const ServicioCorreo = require('../servicios/servicioCorreo');

// Roles internos permitidos (no clientes)
const ROLES_INTERNOS = [
  'rrhh', 'contador', 'ceo', 'cfo', 'cmo',
  'operations_director', 'tech_director', 'regional_manager',
  'category_manager', 'brand_manager', 'inventory_manager', 'marketing_manager',
  'product_manager', 'pricing_analyst', 'content_editor', 'visual_merchandiser',
  'photographer', 'customer_success', 'support_agent', 'logistics_coordinator',
  'qa_specialist', 'seller_premium', 'seller_standard', 'seller_basic'
];

class ControladorRRHH {

  static async listarEmpleados(req, res, next) {
    try {
      const { rol, activo, buscar } = req.query;

      let consulta = `
        SELECT id, nombre, apellido, email, rol, telefono, ciudad,
               documento_tipo, documento_numero, activo,
               fecha_creacion, fecha_actualizacion
        FROM usuarios
        WHERE rol != 'cliente'
      `;
      const params = [];
      let idx = 1;

      if (rol) {
        consulta += ` AND rol = $${idx++}`;
        params.push(rol);
      }

      if (activo !== undefined) {
        consulta += ` AND activo = $${idx++}`;
        params.push(activo === 'true');
      }

      if (buscar) {
        consulta += ` AND (nombre ILIKE $${idx} OR apellido ILIKE $${idx} OR email ILIKE $${idx})`;
        params.push(`%${buscar}%`);
        idx++;
      }

      consulta += ' ORDER BY rol, nombre ASC';

      const resultado = await pool.query(consulta, params);

      res.json({
        empleados: resultado.rows,
        total: resultado.rows.length,
        roles_disponibles: ROLES_INTERNOS
      });
    } catch (error) {
      next(error);
    }
  }

  static async crearEmpleado(req, res, next) {
    try {
      const {
        nombre, apellido, email, rol, telefono,
        documento_tipo, documento_numero, ciudad, direccion,
        contrasena_temporal
      } = req.body;

      // Validaciones
      if (!nombre || !email || !rol) {
        return res.status(400).json({ error: 'Nombre, email y rol son obligatorios' });
      }

      if (!ROLES_INTERNOS.includes(rol)) {
        return res.status(400).json({ error: `Rol inválido. Roles permitidos: ${ROLES_INTERNOS.join(', ')}` });
      }

      // Verificar email único
      const existe = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
      if (existe.rows.length > 0) {
        return res.status(409).json({ error: 'Ya existe un usuario con ese email' });
      }

      // Generar contraseña temporal si no se proporcionó
      const password = contrasena_temporal || _generarPasswordTemporal();
      const passwordHash = await bcrypt.hash(password, 10);

      const consulta = `
        INSERT INTO usuarios (
          nombre, apellido, email, password, rol,
          telefono, documento_tipo, documento_numero,
          ciudad, direccion, activo,
          acepta_terminos, acepta_datos
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true,true,true)
        RETURNING id, nombre, apellido, email, rol, fecha_creacion
      `;

      const resultado = await pool.query(consulta, [
        nombre, apellido || null, email, passwordHash, rol,
        telefono || null, documento_tipo || 'CC',
        documento_numero || null, ciudad || null, direccion || null
      ]);

      const nuevoEmpleado = resultado.rows[0];

      // Enviar correo con credenciales
      try {
        await ServicioCorreo.enviarCredencialesEmpleado(
          email, nombre, rol, password
        );
        console.log(`📧 Credenciales enviadas a ${email}`);
      } catch (errCorreo) {
        console.log(`⚠️ No se pudo enviar correo a ${email}:`, errCorreo.message);
      }

      res.status(201).json({
        mensaje: 'Empleado creado exitosamente',
        empleado: nuevoEmpleado,
        credenciales_enviadas: true,
        password_temporal: password
      });
    } catch (error) {
      next(error);
    }
  }

  static async editarEmpleado(req, res, next) {
    try {
      const { id } = req.params;
      const { nombre, apellido, telefono, rol, ciudad, direccion, documento_tipo, documento_numero } = req.body;

      // No permitir cambiar a rol cliente desde RRHH
      if (rol && !ROLES_INTERNOS.includes(rol)) {
        return res.status(400).json({ error: 'Rol inválido para empleado interno' });
      }

      const consulta = `
        UPDATE usuarios
        SET nombre = COALESCE($1, nombre),
            apellido = COALESCE($2, apellido),
            telefono = COALESCE($3, telefono),
            rol = COALESCE($4, rol),
            ciudad = COALESCE($5, ciudad),
            direccion = COALESCE($6, direccion),
            documento_tipo = COALESCE($7, documento_tipo),
            documento_numero = COALESCE($8, documento_numero),
            fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id = $9 AND rol != 'cliente'
        RETURNING id, nombre, apellido, email, rol, telefono, ciudad, activo
      `;

      const resultado = await pool.query(consulta, [
        nombre, apellido, telefono, rol, ciudad,
        direccion, documento_tipo, documento_numero, parseInt(id)
      ]);

      if (resultado.rows.length === 0) {
        return res.status(404).json({ error: 'Empleado no encontrado' });
      }

      res.json({
        mensaje: 'Empleado actualizado exitosamente',
        empleado: resultado.rows[0]
      });
    } catch (error) {
      next(error);
    }
  }

  static async cambiarEstado(req, res, next) {
    try {
      const { id } = req.params;
      const { activo, motivo } = req.body;

      if (typeof activo !== 'boolean') {
        return res.status(400).json({ error: 'El campo activo debe ser true o false' });
      }

      // No permitir desactivar al propio CEO
      const empleado = await pool.query('SELECT rol FROM usuarios WHERE id = $1', [parseInt(id)]);
      if (empleado.rows.length === 0) {
        return res.status(404).json({ error: 'Empleado no encontrado' });
      }
      if (empleado.rows[0].rol === 'ceo' && !activo) {
        return res.status(403).json({ error: 'No se puede desactivar al CEO' });
      }

      const resultado = await pool.query(`
        UPDATE usuarios
        SET activo = $1, fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id = $2 AND rol != 'cliente'
        RETURNING id, nombre, email, rol, activo
      `, [activo, parseInt(id)]);

      if (resultado.rows.length === 0) {
        return res.status(404).json({ error: 'Empleado no encontrado' });
      }

      const accion = activo ? 'activado' : 'desactivado';
      console.log(`👤 Empleado ${resultado.rows[0].email} ${accion} por ${req.usuario.email}. Motivo: ${motivo || 'N/A'}`);

      res.json({
        mensaje: `Empleado ${accion} exitosamente`,
        empleado: resultado.rows[0]
      });
    } catch (error) {
      next(error);
    }
  }

  static async eliminarEmpleado(req, res, next) {
    try {
      const { id } = req.params;

      // Solo CEO puede eliminar
      if (req.usuario.rol !== 'ceo') {
        return res.status(403).json({ error: 'Solo el CEO puede eliminar empleados' });
      }

      const empleado = await pool.query('SELECT rol, email FROM usuarios WHERE id = $1', [parseInt(id)]);
      if (empleado.rows.length === 0) {
        return res.status(404).json({ error: 'Empleado no encontrado' });
      }
      if (empleado.rows[0].rol === 'ceo') {
        return res.status(403).json({ error: 'No se puede eliminar al CEO' });
      }

      await pool.query('DELETE FROM usuarios WHERE id = $1 AND rol != $2', [parseInt(id), 'cliente']);

      res.json({
        mensaje: 'Empleado eliminado exitosamente',
        email: empleado.rows[0].email
      });
    } catch (error) {
      next(error);
    }
  }
}

function _generarPasswordTemporal() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  let pass = '';
  for (let i = 0; i < 10; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

module.exports = ControladorRRHH;
