const Usuario = require('../modelos/Usuario');

class ControladorUsuario {
  static async obtenerPerfil(req, res, next) {
    try {
      const usuario = await Usuario.buscarPorId(req.usuario.id);
      
      if (!usuario) {
        return res.status(404).json({
          error: 'Usuario no encontrado'
        });
      }

      res.json({
        mensaje: 'Perfil obtenido exitosamente',
        datos: usuario
      });
    } catch (error) {
      next(error);
    }
  }

  static async obtenerUsuarioPorId(req, res, next) {
    try {
      const { id } = req.params;
      const usuario = await Usuario.buscarPorId(parseInt(id));
      
      if (!usuario) {
        return res.status(404).json({
          error: 'Usuario no encontrado'
        });
      }

      res.json({
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async actualizarPerfil(req, res, next) {
    try {
      const { nombre, telefono, direccion, ciudad } = req.body;
      const usuarioId = req.usuario.id;

      const pool = require('../config/baseDatos');
      const consulta = `
        UPDATE usuarios 
        SET nombre = COALESCE($1, nombre),
            telefono = COALESCE($2, telefono),
            direccion = COALESCE($3, direccion),
            ciudad = COALESCE($4, ciudad),
            fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id = $5
        RETURNING id, nombre, email, rol, telefono, direccion, ciudad
      `;

      const resultado = await pool.query(consulta, [nombre, telefono, direccion, ciudad, usuarioId]);

      if (resultado.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.json({
        mensaje: 'Perfil actualizado exitosamente',
        datos: resultado.rows[0]
      });
    } catch (error) {
      next(error);
    }
  }

  static async actualizarTotalCompras(req, res, next) {
    try {
      const { nuevoTotal } = req.body;
      
      if (typeof nuevoTotal !== 'number' || nuevoTotal < 0) {
        return res.status(400).json({
          error: 'El total debe ser un número positivo'
        });
      }

      const resultado = await Usuario.actualizarTotalCompras(req.usuario.id, nuevoTotal);

      res.json({
        mensaje: 'Total de compras actualizado exitosamente',
        datos: resultado
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ControladorUsuario;