const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();
const pool = require('./config/baseDatos');
const manejadorErrores = require('./middleware/manejadorErrores');
const axios = require('axios');
const nodemailer = require('nodemailer');

// Transporter de correo (reutiliza config del auth-service via env)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const MENSAJES_ESTADO = {
  Confirmado: {
    emoji: '✅',
    titulo: '¡Pedido Confirmado!',
    mensaje: 'Tu pedido ha sido revisado y confirmado. Estamos preparándolo para enviarlo.',
    color: '#11998e'
  },
  Enviado: {
    emoji: '🚚',
    titulo: '¡Tu pedido está en camino!',
    mensaje: 'Tu pedido ha sido despachado y está en camino hacia ti.',
    color: '#667eea'
  },
  Entregado: {
    emoji: '🎉',
    titulo: '¡Pedido Entregado!',
    mensaje: '¡Tu pedido ha sido entregado exitosamente! Esperamos que disfrutes tu compra.',
    color: '#38ef7d'
  },
  Cancelado: {
    emoji: '❌',
    titulo: 'Pedido Cancelado',
    mensaje: 'Tu pedido ha sido cancelado. Si tienes dudas, contáctanos.',
    color: '#e74c3c'
  }
};

async function enviarNotificacionEstado(email, nombreUsuario, pedidoId, nuevoEstado, total) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;
  const info = MENSAJES_ESTADO[nuevoEstado];
  if (!info) return;

  const urlPedidos = `${process.env.FRONTEND_URL || 'http://localhost:3005'}/orders`;
  const formatearPrecio = (v) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v);

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9">
      <div style="background:${info.color};padding:40px 30px;text-align:center">
        <div style="font-size:52px;margin-bottom:10px">${info.emoji}</div>
        <h1 style="color:white;margin:0;font-size:26px">${info.titulo}</h1>
        <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:14px">Pedido #${pedidoId}</p>
      </div>
      <div style="background:white;padding:40px 30px">
        <p style="font-size:16px;color:#333">Hola <strong>${nombreUsuario}</strong>,</p>
        <p style="color:#555;line-height:1.6">${info.mensaje}</p>
        <div style="background:#f8f8f8;border-radius:8px;padding:20px;margin:24px 0;text-align:center">
          <p style="margin:0;color:#666;font-size:14px">Número de pedido</p>
          <p style="margin:8px 0;font-size:22px;font-weight:bold;color:#333;font-family:monospace">#${pedidoId}</p>
          <p style="margin:0;color:#666;font-size:14px">Total</p>
          <p style="margin:8px 0;font-size:20px;font-weight:bold;color:${info.color}">${formatearPrecio(total)}</p>
          <p style="margin:8px 0;font-size:14px;color:#888">Estado actual: <strong style="color:${info.color}">${nuevoEstado}</strong></p>
        </div>
        <div style="text-align:center;margin:30px 0">
          <a href="${urlPedidos}" style="background:${info.color};color:white;padding:14px 32px;text-decoration:none;border-radius:6px;font-size:16px;font-weight:bold;display:inline-block">Ver Mis Pedidos</a>
        </div>
      </div>
      <div style="background:#f0f0f0;padding:20px 30px;text-align:center">
        <p style="color:#888;font-size:12px;margin:0">Este es un correo automático, no respondas a este mensaje.<br>EGOS — Wear Your Truth</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"EGOS" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `${info.emoji} Pedido #${pedidoId} — ${nuevoEstado} | EGOS`,
      html
    });
    console.log(`📧 Notificación de estado [${nuevoEstado}] enviada a ${email}`);
  } catch (err) {
    console.log(`⚠️ No se pudo enviar notificación a ${email}:`, err.message);
  }
}

async function enviarConfirmacionCompra(email, nombreUsuario, pedido) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;

  const urlPedidos = `${process.env.FRONTEND_URL || 'http://localhost:3005'}/orders`;
  const formatearPrecio = (v) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v);

  const productosHtml = (pedido.productos || []).map(p => `
    <tr>
      <td style="padding:10px;border-bottom:1px solid #eee;color:#555">Producto #${p.id}</td>
      <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;color:#555">${p.cantidad}</td>
      <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;font-weight:bold;color:#333">${formatearPrecio(p.precio * p.cantidad)}</td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9">
      <div style="background:linear-gradient(135deg,#11998e,#38ef7d);padding:40px 30px;text-align:center">
        <div style="font-size:48px;margin-bottom:10px">✅</div>
        <h1 style="color:white;margin:0;font-size:26px">¡Pedido Confirmado!</h1>
        <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:14px">Pedido #${pedido.id}</p>
      </div>
      <div style="background:white;padding:40px 30px">
        <p style="font-size:16px;color:#333">Hola <strong>${nombreUsuario}</strong>,</p>
        <p style="color:#555;line-height:1.6">Tu pedido ha sido recibido y está siendo procesado. Te notificaremos cuando sea enviado.</p>
        <div style="background:#f8f8f8;border-radius:8px;padding:20px;margin:24px 0">
          <p style="margin:0 0 12px;font-weight:bold;color:#333">Resumen del pedido</p>
          <table style="width:100%;border-collapse:collapse">
            <thead><tr style="background:#eee">
              <th style="padding:10px;text-align:left;font-size:12px;color:#666">Producto</th>
              <th style="padding:10px;text-align:center;font-size:12px;color:#666">Cant.</th>
              <th style="padding:10px;text-align:right;font-size:12px;color:#666">Subtotal</th>
            </tr></thead>
            <tbody>${productosHtml}</tbody>
            <tfoot><tr>
              <td colspan="2" style="padding:14px 10px;font-weight:bold;color:#333;font-size:16px">Total</td>
              <td style="padding:14px 10px;text-align:right;font-weight:bold;color:#11998e;font-size:18px">${formatearPrecio(pedido.total)}</td>
            </tr></tfoot>
          </table>
        </div>
        <div style="background:#fff8e1;border-left:4px solid #ffc107;padding:16px;border-radius:4px;margin:20px 0">
          <p style="margin:0;color:#555;font-size:14px">
            <strong>Método de pago:</strong> ${pedido.metodo_pago || 'Tarjeta'}<br>
            <strong>Estado:</strong> Creado — en preparación<br>
            <strong>Fecha:</strong> ${new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div style="text-align:center;margin:30px 0">
          <a href="${urlPedidos}" style="background:linear-gradient(135deg,#11998e,#38ef7d);color:white;padding:14px 32px;text-decoration:none;border-radius:6px;font-size:16px;font-weight:bold;display:inline-block">Ver Mis Pedidos</a>
        </div>
      </div>
      <div style="background:#f0f0f0;padding:20px 30px;text-align:center">
        <p style="color:#888;font-size:12px;margin:0">Este es un correo automático, no respondas a este mensaje.<br>EGOS — Wear Your Truth</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"EGOS" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `✅ Pedido #${pedido.id} confirmado — EGOS`,
      html
    });
    console.log(`📧 Correo de confirmación enviado a ${email}`);
  } catch (err) {
    console.log(`⚠️ No se pudo enviar correo de confirmación a ${email}:`, err.message);
  }
}

const aplicacion = express();
const puerto = process.env.PUERTO || 3003;

// Crear tabla pedido_historial si no existe
async function inicializarBaseDatos() {
  let reintentos = 3;
  
  while (reintentos > 0) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS pedido_historial (
          id SERIAL PRIMARY KEY,
          id_pedido VARCHAR(20) NOT NULL,
          estado_anterior VARCHAR(50),
          estado_nuevo VARCHAR(50) NOT NULL,
          comentario TEXT,
          fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_pedido_historial_pedido ON pedido_historial(id_pedido);
      `);
      
      // Crear función para trigger
      await pool.query(`
        CREATE OR REPLACE FUNCTION registrar_cambio_estado_pedido()
        RETURNS TRIGGER AS $$
        BEGIN
          IF (TG_OP = 'UPDATE' AND OLD.estado != NEW.estado) THEN
            INSERT INTO pedido_historial (id_pedido, estado_anterior, estado_nuevo, comentario)
            VALUES (NEW.id, OLD.estado, NEW.estado, 'Cambio automático de estado');
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `);
      
      // Crear trigger
      await pool.query(`
        DROP TRIGGER IF EXISTS trigger_cambio_estado_pedido ON pedido;
        CREATE TRIGGER trigger_cambio_estado_pedido
          AFTER UPDATE ON pedido
          FOR EACH ROW
          EXECUTE FUNCTION registrar_cambio_estado_pedido();
      `);
      
      console.log('✅ Tabla pedido_historial y trigger creados');
      break;
    } catch (error) {
      reintentos--;
      console.error(`⚠️ Error BD (${reintentos} reintentos restantes):`, error.message);
      if (reintentos > 0) {
        console.log('🔄 Reintentando en 5 segundos...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      } else {
        console.error('❌ Error crítico: No se pudo conectar a PostgreSQL');
      }
    }
  }
}

// Inicializar BD con delay para permitir conexión
// setTimeout(inicializarBaseDatos, 2000); // DESHABILITADO - trigger manual

aplicacion.use(helmet());

const ALLOWED_ORIGINS = [
  'http://localhost:3005',
  'http://149.130.182.9:3005',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://149.130.182.9:3000',
  'http://149.130.182.9',
  process.env.FRONTEND_URL
].filter(Boolean);

aplicacion.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
aplicacion.use(express.json({ limit: '10mb' }));

// Logging middleware detallado
aplicacion.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`🛒 [${timestamp}] ${req.method} ${req.url}`);

  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`   └─ Body:`, JSON.stringify(req.body, null, 2));
  }

  const originalSend = res.send;
  res.send = function (data) {
    if (res.statusCode >= 400) {
      console.error(`❌ [${timestamp}] Transaction Error ${res.statusCode}:`);
      console.error(`   └─ Response:`, data);
    }
    originalSend.call(this, data);
  };

  next();
});

// Capturar errores globales
process.on('uncaughtException', (err) => {
  console.error(`🚨 [${new Date().toISOString()}] Transaction - Uncaught Exception:`);
  console.error(`   └─ Error: ${err.message}`);
  console.error(`   └─ Stack: ${err.stack}`);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`🚨 [${new Date().toISOString()}] Transaction - Unhandled Rejection:`);
  console.error(`   └─ Reason:`, reason);
});

// Función para generar IDs personalizados
function generarId(prefijo) {
  const ahora = new Date();
  const año = ahora.getFullYear().toString().slice(-2);
  const mes = (ahora.getMonth() + 1).toString().padStart(2, '0');
  const dia = ahora.getDate().toString().padStart(2, '0');
  const fecha = `${año}${mes}${dia}`;
  const secuencial = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
  return `${prefijo}${fecha}${secuencial}`;
}

// Funciones de base de datos
async function obtenerCarrito(usuarioId) {
  const consulta = 'SELECT * FROM carrito WHERE id_usuario = $1';
  const resultado = await pool.query(consulta, [usuarioId]);
  return resultado.rows[0] || { productos: [], total: 0 };
}

async function guardarCarrito(usuarioId, carrito) {
  const consulta = `
    INSERT INTO carrito (id_usuario, fecha_actualizacion)
    VALUES ($1, CURRENT_TIMESTAMP)
    ON CONFLICT (id_usuario) 
    DO UPDATE SET fecha_actualizacion = CURRENT_TIMESTAMP
    RETURNING id
  `;
  const resultado = await pool.query(consulta, [usuarioId]);
  const carritoId = resultado.rows[0].id;

  // Limpiar productos existentes del carrito
  await pool.query('DELETE FROM carrito_producto WHERE id_carrito = $1', [carritoId]);

  // Insertar productos actualizados
  for (const producto of carrito.productos) {
    await pool.query(`
      INSERT INTO carrito_producto (id_carrito, id_producto, cantidad, precio_unitario)
      VALUES ($1, $2, $3, $4)
    `, [carritoId, producto.id, producto.cantidad, producto.precio]);
  }
}

// Middleware de autenticación JWT
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRETO || 'estilo_moda_jwt_secreto_produccion_2024_seguro_v2';
console.log('🔑 Transaction Service usando JWT_SECRET:', JWT_SECRET.substring(0, 20) + '...');

const autenticacion = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Token requerido' });
    }

    console.log('🔑 Verificando token con secreto:', JWT_SECRET.substring(0, 10) + '...');
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Token válido para usuario:', decoded.id);
    req.usuario = { id: decoded.id, email: decoded.email, rol: decoded.rol };
    next();
  } catch (error) {
    console.error('❌ Error autenticación:', error.message);
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// Endpoints directos para desarrollo
aplicacion.get('/api/carrito', autenticacion, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    // Obtener carrito y sus productos
    const consultaCarrito = `
      SELECT c.id, c.usuario_id, c.fecha_creacion, c.fecha_actualizacion,
             COALESCE(json_agg(
               json_build_object(
                 'id', cp.id_producto,
                 'cantidad', cp.cantidad,
                 'precio', cp.precio_unitario,
                 'nombre', COALESCE(cp.nombre_producto, 'Producto ' || cp.id_producto),
                 'imagen', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=500&fit=crop'
               )
             ) FILTER (WHERE cp.id IS NOT NULL), '[]') as productos
      FROM carrito c
      LEFT JOIN carrito_producto cp ON c.id = cp.id_carrito
      WHERE c.usuario_id = $1
      GROUP BY c.id, c.usuario_id, c.fecha_creacion, c.fecha_actualizacion
    `;

    const resultado = await pool.query(consultaCarrito, [parseInt(usuarioId)]);

    let carrito;
    if (resultado.rows.length > 0) {
      const row = resultado.rows[0];
      const productos = row.productos === '[]' ? [] : row.productos;
      const total = productos.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);

      carrito = {
        productos: productos,
        total: total
      };
    } else {
      carrito = { productos: [], total: 0 };
    }

    console.log(`🛒 Obteniendo carrito para usuario ${usuarioId}`);
    res.json({ datos: carrito });
  } catch (error) {
    console.error('Error obteniendo carrito:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Error obteniendo carrito', detalle: error.message });
  }
});

aplicacion.post('/api/carrito', autenticacion, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { id_producto, cantidad = 1 } = req.body;

    console.log(`🛒 Agregando producto ${id_producto} (cantidad: ${cantidad}) al carrito del usuario ${usuarioId}`);

    // Crear o obtener carrito con ID personalizado
    const consultaCarritoExistente = 'SELECT id FROM carrito WHERE usuario_id = $1';
    const carritoExistente = await pool.query(consultaCarritoExistente, [parseInt(usuarioId)]);
    
    let carritoId;
    if (carritoExistente.rows.length > 0) {
      carritoId = carritoExistente.rows[0].id;
      await pool.query('UPDATE carrito SET fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = $1', [carritoId]);
    } else {
      carritoId = generarId('CA');
      await pool.query(
        'INSERT INTO carrito (id, usuario_id, fecha_actualizacion) VALUES ($1, $2, CURRENT_TIMESTAMP)',
        [carritoId, parseInt(usuarioId)]
      );
    }

    // Verificar si el producto ya existe en el carrito
    const consultaProductoExistente = `
      SELECT * FROM carrito_producto 
      WHERE id_carrito = $1 AND id_producto = $2
    `;
    const productoExistente = await pool.query(consultaProductoExistente, [carritoId, id_producto]);

    // Obtener precio y nombre real desde catalog-service
    let precio = 0;
    let nombreProducto = `Producto ${id_producto}`;
    try {
      const resProd = await axios.get(`http://catalog-service:3002/api/productos/${id_producto}`, { timeout: 5000 });
      const prod = resProd.data?.producto || resProd.data;
      precio = prod?.precio || 0;
      nombreProducto = prod?.nombre || nombreProducto;
    } catch (e) {
      console.log(`⚠️ No se pudo obtener precio del producto ${id_producto}:`, e.message);
    }

    if (productoExistente.rows.length > 0) {
      // Actualizar cantidad
      await pool.query(`
        UPDATE carrito_producto 
        SET cantidad = cantidad + $1
        WHERE id_carrito = $2 AND id_producto = $3
      `, [cantidad, carritoId, id_producto]);
    } else {
      // Insertar nuevo producto
      await pool.query(`
        INSERT INTO carrito_producto (id_carrito, id_producto, cantidad, precio_unitario, nombre_producto)
        VALUES ($1, $2, $3, $4, $5)
      `, [carritoId, id_producto, cantidad, precio, nombreProducto]);
    }

    // Contar total de items
    const consultaTotal = `
      SELECT COUNT(*) as total_items
      FROM carrito_producto
      WHERE id_carrito = $1
    `;
    const totalItems = await pool.query(consultaTotal, [carritoId]);

    res.json({
      mensaje: 'Producto agregado al carrito exitosamente',
      datos: { id_producto, cantidad, total_items: parseInt(totalItems.rows[0].total_items) }
    });
  } catch (error) {
    console.error('Error agregando al carrito:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Error agregando producto', detalle: error.message });
  }
});

aplicacion.delete('/api/carrito/:productoId', autenticacion, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const productoId = req.params.productoId;

    console.log(`🗑️ Eliminando producto ${productoId} del carrito del usuario ${usuarioId}`);

    // Obtener ID del carrito
    const consultaCarrito = 'SELECT id FROM carrito WHERE usuario_id = $1';
    const resultadoCarrito = await pool.query(consultaCarrito, [parseInt(usuarioId)]);

    if (resultadoCarrito.rows.length === 0) {
      return res.status(404).json({ error: 'Carrito no encontrado' });
    }

    const carritoId = resultadoCarrito.rows[0].id;

    // Eliminar producto del carrito
    await pool.query(`
      DELETE FROM carrito_producto 
      WHERE id_carrito = $1 AND id_producto = $2
    `, [carritoId, productoId]);

    res.json({ mensaje: 'Producto eliminado del carrito' });
  } catch (error) {
    console.error('Error eliminando del carrito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

aplicacion.get('/api/pedidos', autenticacion, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    console.log(`📦 Obteniendo pedidos del usuario ${usuarioId}`);

    const consultaPedidos = `
      SELECT 
        p.id,
        p.estado,
        p.total,
        p.fecha_creacion,
        p.fecha_actualizacion,
        json_agg(
          json_build_object(
            'id', pp.id_producto,
            'cantidad', pp.cantidad,
            'precio', pp.precio_unitario,
            'subtotal', pp.subtotal
          )
        ) as productos
      FROM pedido p
      LEFT JOIN pedido_producto pp ON p.id = pp.id_pedido
      WHERE p.usuario_id = $1
      GROUP BY p.id, p.estado, p.total, p.fecha_creacion, p.fecha_actualizacion
      ORDER BY p.fecha_creacion DESC
    `;

    const resultado = await pool.query(consultaPedidos, [parseInt(usuarioId)]);

    console.log(`✅ ${resultado.rows.length} pedidos encontrados`);

    res.json({
      pedidos: resultado.rows,
      total: resultado.rows.length
    });
  } catch (error) {
    console.error('Error obteniendo pedidos:', error.message);
    res.status(500).json({ error: 'Error obteniendo pedidos', detalle: error.message });
  }
});

aplicacion.get('/api/pedidos/:pedidoId/historial', autenticacion, async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const usuarioId = req.usuario.id;

    console.log(`📜 Obteniendo historial del pedido ${pedidoId}`);

    // Verificar que el pedido pertenece al usuario
    const verificacion = await pool.query(
      'SELECT id FROM pedido WHERE id = $1 AND usuario_id = $2',
      [pedidoId, parseInt(usuarioId)]
    );

    if (verificacion.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    const consultaHistorial = `
      SELECT 
        estado_anterior,
        estado_nuevo,
        comentario,
        fecha_cambio
      FROM pedido_historial
      WHERE id_pedido = $1
      ORDER BY fecha_cambio ASC
    `;

    const resultado = await pool.query(consultaHistorial, [pedidoId]);

    res.json({
      pedido_id: pedidoId,
      historial: resultado.rows
    });
  } catch (error) {
    console.error('Error obteniendo historial:', error.message);
    res.status(500).json({ error: 'Error obteniendo historial' });
  }
});

aplicacion.put('/api/pedidos/:pedidoId/estado', autenticacion, async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const { estado, comentario } = req.body;
    const usuarioRol = req.usuario.rol;
    const usuarioId = req.usuario.id;

    const rolesAdmin = ['ceo', 'customer_success', 'logistics_coordinator', 'operations_director', 'support_agent'];
    const esAdmin = rolesAdmin.includes(usuarioRol);

    console.log(`🔄 Actualizando estado del pedido ${pedidoId} a ${estado} — Rol: ${usuarioRol}`);

    // Admin puede cambiar cualquier pedido, cliente solo el suyo
    const condicion = esAdmin
      ? 'SELECT id, estado FROM pedido WHERE id = $1'
      : 'SELECT id, estado FROM pedido WHERE id = $1 AND usuario_id = $2';
    const params = esAdmin ? [pedidoId] : [pedidoId, parseInt(usuarioId)];

    const verificacion = await pool.query(condicion, params);

    if (verificacion.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    const estadoAnterior = verificacion.rows[0].estado;

    await pool.query(
      'UPDATE pedido SET estado = $1, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = $2',
      [estado, pedidoId]
    );

    if (comentario) {
      await pool.query(
        'INSERT INTO pedido_historial (id_pedido, estado_anterior, estado_nuevo, comentario) VALUES ($1, $2, $3, $4)',
        [pedidoId, estadoAnterior, estado, comentario]
      );
    }

    // Notificar al cliente por correo y en tiempo real (sin bloquear respuesta)
    pool.query('SELECT usuario_id, total FROM pedido WHERE id = $1', [pedidoId])
      .then(async (pedidoData) => {
        if (!pedidoData.rows.length) return;
        const { usuario_id, total } = pedidoData.rows[0];

        // Emitir evento WebSocket via gateway
        axios.post('http://gateway:3000/interno/emitir', {
          evento: 'pedido_actualizado',
          usuarioId: usuario_id,
          sala: 'admins',
          datos: { pedidoId, estadoAnterior, estado_nuevo: estado, total, usuario_id }
        }, { timeout: 2000 }).catch(() => {});

        // Enviar correo
        const resU = await axios.get(`http://auth-service:3011/api/usuarios/${usuario_id}`, { timeout: 2000 });
        const { email, nombre } = resU.data.usuario || {};
        if (email) enviarNotificacionEstado(email, nombre || 'Cliente', pedidoId, estado, total || 0);
      })
      .catch(e => console.log(`⚠️ No se pudo notificar cambio de estado:`, e.message));

    res.json({
      mensaje: 'Estado actualizado exitosamente',
      pedido_id: pedidoId,
      estado_anterior: estadoAnterior,
      estado_nuevo: estado
    });
  } catch (error) {
    console.error('Error actualizando estado:', error.message);
    res.status(500).json({ error: 'Error actualizando estado' });
  }
});

aplicacion.post('/api/checkout', autenticacion, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { metodo_pago, direccion_envio } = req.body;

    console.log(`💳 Procesando checkout para usuario ${usuarioId}`);

    // Obtener carrito y productos
    const consultaCarrito = `
      SELECT c.id, 
             json_agg(
               json_build_object(
                 'id', cp.id_producto,
                 'cantidad', cp.cantidad,
                 'precio', cp.precio_unitario
               )
             ) as productos,
             SUM(cp.cantidad * cp.precio_unitario) as total
      FROM carrito c
      LEFT JOIN carrito_producto cp ON c.id = cp.id_carrito
      WHERE c.usuario_id = $1
      GROUP BY c.id
    `;

    const resultadoCarrito = await pool.query(consultaCarrito, [parseInt(usuarioId)]);

    if (resultadoCarrito.rows.length === 0 || !resultadoCarrito.rows[0].productos[0].id) {
      return res.status(400).json({ error: 'El carrito está vacío' });
    }

    const carrito = resultadoCarrito.rows[0];
    const carritoId = carrito.id;

    // Crear pedido con ID personalizado
    const pedidoId = generarId('EM');
    await pool.query(
      'INSERT INTO pedido (id, usuario_id, estado, total) VALUES ($1, $2, $3, $4)',
      [pedidoId, parseInt(usuarioId), 'Creado', carrito.total]
    );

    // Copiar productos del carrito al pedido
    for (const producto of carrito.productos) {
      await pool.query(
        'INSERT INTO pedido_producto (id_pedido, id_producto, cantidad, precio_unitario, subtotal, nombre_producto) VALUES ($1, $2, $3, $4, $5, $6)',
        [pedidoId, producto.id, producto.cantidad, producto.precio, producto.cantidad * producto.precio, producto.nombre || `Producto ${producto.id}`]
      );
    }
    
    // Crear pago con ID personalizado
    const pagoId = generarId('PG');
    await pool.query(
      'INSERT INTO pago (id, id_pedido, tipo_pago, monto, estado, metodo) VALUES ($1, $2, $3, $4, $5, $6)',
      [pagoId, pedidoId, metodo_pago || 'Tarjeta', carrito.total, 'Aprobado', metodo_pago || 'Tarjeta de Crédito']
    );

    // Limpiar carrito
    await pool.query('DELETE FROM carrito_producto WHERE id_carrito = $1', [carritoId]);

    const pedido = {
      id: pedidoId,
      usuario_id: usuarioId,
      productos: carrito.productos,
      total: carrito.total,
      metodo_pago,
      direccion_envio,
      estado: 'Creado',
      pago_id: pagoId,
      fecha_creacion: new Date().toISOString()
    };

    // Enviar correo de confirmación y generar factura
    let datosUsuario = { nombre: 'Cliente', email: '' };
    try {
      const resUsuario = await axios.get(
        `http://auth-service:3011/api/usuarios/${usuarioId}`,
        { timeout: 3000 }
      );
      const { email, nombre } = resUsuario.data.usuario || {};
      datosUsuario = { nombre: nombre || 'Cliente', email: email || '' };
      if (email) {
        enviarConfirmacionCompra(email, nombre || 'Cliente', pedido);
      }
    } catch (errCorreo) {
      console.log('⚠️ No se pudo obtener datos del usuario para correo:', errCorreo.message);
    }

    // Notificar a admins en tiempo real que hay un pedido nuevo
    axios.post('http://gateway:3000/interno/emitir', {
      evento: 'pedido_nuevo',
      sala: 'admins',
      datos: { pedidoId, total: carrito.total, usuario_id: usuarioId, estado: 'Creado' }
    }, { timeout: 2000 }).catch(() => {});

    // Generar factura electrónica en background
    axios.post('http://facturacion-service:3010/api/facturas/generar', {
      pedido_id: pedidoId,
      usuario_id: usuarioId,
      cliente: {
        nombre: datosUsuario.nombre,
        email: datosUsuario.email,
        nit_cc: datosUsuario.documento_numero || datosUsuario.nit_cc || '222222222222',
        direccion: datosUsuario.direccion || datosUsuario.ciudad || 'Bogotá D.C'
      },
      productos: carrito.productos.map(p => ({
        id: p.id,
        nombre: p.nombre || `Producto ${p.id}`,
        precio_unitario: p.precio,
        cantidad: p.cantidad
      }))
    }, { timeout: 5000 }).then(() => {
      console.log(`🧾 Factura electrónica iniciada para pedido ${pedidoId}`);
    }).catch(e => {
      console.log(`⚠️ No se pudo iniciar factura: ${e.message}`);
    });

    res.json({
      mensaje: 'Pedido creado exitosamente',
      orden: pedido
    });
  } catch (error) {
    console.error('Error en checkout:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Error procesando pedido', detalle: error.message });
  }
});

// Ruta de salud
aplicacion.get('/salud', (req, res) => {
  res.json({
    estado: 'activo',
    servicio: 'transacciones',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    carritos_activos: 0
  });
});

// Manejador de errores
aplicacion.use(manejadorErrores);

// Listar TODOS los pedidos (solo roles admin)
aplicacion.get('/api/admin/pedidos', autenticacion, async (req, res) => {
  try {
    const usuarioRol = req.usuario.rol;
    const rolesAdmin = ['ceo', 'customer_success', 'logistics_coordinator', 'operations_director', 'support_agent'];

    if (!rolesAdmin.includes(usuarioRol)) {
      return res.status(403).json({ error: 'Sin permisos para ver todos los pedidos' });
    }

    const { estado } = req.query;
    let consulta = `
      SELECT
        p.id, p.usuario_id, p.estado, p.total,
        p.fecha_creacion, p.fecha_actualizacion,
        json_agg(
          json_build_object(
            'id', pp.id_producto,
            'cantidad', pp.cantidad,
            'precio', pp.precio_unitario,
            'subtotal', pp.subtotal
          )
        ) FILTER (WHERE pp.id IS NOT NULL) as productos
      FROM pedido p
      LEFT JOIN pedido_producto pp ON p.id = pp.id_pedido
    `;
    const params = [];
    if (estado) {
      consulta += ' WHERE p.estado = $1';
      params.push(estado);
    }
    consulta += ' GROUP BY p.id, p.usuario_id, p.estado, p.total, p.fecha_creacion, p.fecha_actualizacion ORDER BY p.fecha_creacion DESC';

    const resultado = await pool.query(consulta, params);

    // Enriquecer con datos del cliente desde auth-service
    const axios = require('axios');
    const pedidosEnriquecidos = await Promise.all(
      resultado.rows.map(async (pedido) => {
        try {
          const res = await axios.get(`http://auth-service:3011/api/usuarios/${pedido.usuario_id}`, { timeout: 2000 });
          return {
            ...pedido,
            nombre_cliente: res.data.usuario?.nombre || `Usuario ${pedido.usuario_id}`,
            email_cliente: res.data.usuario?.email || 'N/A'
          };
        } catch {
          return {
            ...pedido,
            nombre_cliente: `Usuario ${pedido.usuario_id}`,
            email_cliente: 'N/A'
          };
        }
      })
    );

    res.json({ pedidos: pedidosEnriquecidos, total: pedidosEnriquecidos.length });
  } catch (error) {
    console.error('Error listando pedidos admin:', error.message);
    res.status(500).json({ error: 'Error listando pedidos' });
  }
});

// Solicitar devolución
aplicacion.post('/api/pedidos/:pedidoId/devolucion', autenticacion, async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const { razon } = req.body;
    const usuarioId = req.usuario.id;

    console.log(`🔄 Solicitando devolución para pedido ${pedidoId}`);

    // Verificar que el pedido existe y pertenece al usuario
    const pedido = await pool.query(
      'SELECT id, total FROM pedido WHERE id = $1 AND usuario_id = $2',
      [pedidoId, parseInt(usuarioId)]
    );

    if (pedido.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    // Verificar si ya existe una devolución
    const devolucionExistente = await pool.query(
      'SELECT id FROM devolucion WHERE id_pedido = $1',
      [pedidoId]
    );

    if (devolucionExistente.rows.length > 0) {
      return res.status(400).json({ error: 'Ya existe una solicitud de devolución para este pedido' });
    }

    // Crear devolución
    const resultado = await pool.query(
      `INSERT INTO devolucion (id_pedido, usuario_id, razon, estado)
       VALUES ($1, $2, $3, 'Solicitada')
       RETURNING id, estado, fecha_creacion`,
      [pedidoId, usuarioId, razon]
    );

    console.log(`✅ Devolución creada: ${resultado.rows[0].id}`);

    res.json({
      mensaje: 'Solicitud de devolución creada exitosamente',
      devolucion: resultado.rows[0]
    });
  } catch (error) {
    console.error('Error creando devolución:', error.message);
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
});

// Obtener devolución de un pedido
aplicacion.get('/api/pedidos/:pedidoId/devolucion', autenticacion, async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const usuarioId = req.usuario.id;

    const resultado = await pool.query(
      `SELECT d.id, d.razon, d.estado, d.fecha_creacion, d.fecha_actualizacion
       FROM devolucion d
       WHERE d.id_pedido = $1 AND d.usuario_id = $2`,
      [pedidoId, usuarioId]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'No hay devolución para este pedido' });
    }

    res.json({ devolucion: resultado.rows[0] });
  } catch (error) {
    console.error('Error obteniendo devolución:', error.message);
    res.status(500).json({ error: 'Error al obtener la devolución' });
  }
});

// ============================================
// ENDPOINTS DE GESTIÓN DE DEVOLUCIONES
// ============================================

// Listar todas las devoluciones (con filtro por estado)
aplicacion.get('/api/devoluciones', autenticacion, async (req, res) => {
  try {
    const { estado } = req.query;

    console.log(`📋 Listando devoluciones - Estado: ${estado || 'Todas'}`);

    let consulta = `
      SELECT 
        d.id,
        d.id_pedido,
        d.usuario_id,
        d.razon,
        d.estado,
        d.fecha_creacion,
        d.fecha_actualizacion,
        p.total as monto_pedido
      FROM devolucion d
      INNER JOIN pedido p ON d.id_pedido = p.id
    `;

    const params = [];
    if (estado) {
      consulta += ' WHERE d.estado = $1';
      params.push(estado);
    }

    consulta += ' ORDER BY d.fecha_creacion DESC';

    const resultado = await pool.query(consulta, params);

    // Obtener nombres de clientes desde Auth Service
    const axios = require('axios');
    const devolucionesConNombres = await Promise.all(
      resultado.rows.map(async (dev) => {
        try {
          const response = await axios.get(`http://auth-service:3011/api/usuarios/${dev.usuario_id}`);
          return {
            ...dev,
            nombre_cliente: response.data.usuario?.nombre || 'N/A',
            email_cliente: response.data.usuario?.email || 'N/A'
          };
        } catch (error) {
          return {
            ...dev,
            nombre_cliente: `Usuario ${dev.usuario_id}`,
            email_cliente: 'N/A'
          };
        }
      })
    );

    console.log(`✅ ${devolucionesConNombres.length} devoluciones encontradas`);

    res.json({
      devoluciones: devolucionesConNombres,
      total: devolucionesConNombres.length
    });
  } catch (error) {
    console.error('Error listando devoluciones:', error.message);
    res.status(500).json({ error: 'Error al listar devoluciones' });
  }
});

// Aprobar devolución (Customer Success)
aplicacion.put('/api/devoluciones/:id/aprobar', autenticacion, async (req, res) => {
  try {
    const { id } = req.params;
    const { comentario } = req.body;
    const usuarioRol = req.usuario.rol;

    console.log(`✅ Aprobando devolución ${id} - Rol: ${usuarioRol}`);

    // Verificar rol
    if (usuarioRol !== 'customer_success' && usuarioRol !== 'ceo') {
      return res.status(403).json({ error: 'No tienes permisos para aprobar devoluciones' });
    }

    // Verificar que la devolución existe y está en estado Solicitada
    const verificacion = await pool.query(
      'SELECT id, estado FROM devolucion WHERE id = $1',
      [id]
    );

    if (verificacion.rows.length === 0) {
      return res.status(404).json({ error: 'Devolución no encontrada' });
    }

    if (verificacion.rows[0].estado !== 'Solicitada') {
      return res.status(400).json({ error: `No se puede aprobar una devolución en estado ${verificacion.rows[0].estado}` });
    }

    // Actualizar estado
    await pool.query(
      `UPDATE devolucion 
       SET estado = 'Aprobada', 
           comentario_aprobacion = $1,
           fecha_actualizacion = CURRENT_TIMESTAMP 
       WHERE id = $2`,
      [comentario || 'Aprobada por Customer Success', id]
    );

    console.log(`✅ Devolución ${id} aprobada`);

    res.json({
      mensaje: 'Devolución aprobada exitosamente',
      devolucion_id: id,
      nuevo_estado: 'Aprobada'
    });
  } catch (error) {
    console.error('Error aprobando devolución:', error.message);
    res.status(500).json({ error: 'Error al aprobar devolución' });
  }
});

// Rechazar devolución (Customer Success)
aplicacion.put('/api/devoluciones/:id/rechazar', autenticacion, async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;
    const usuarioRol = req.usuario.rol;

    console.log(`❌ Rechazando devolución ${id} - Rol: ${usuarioRol}`);

    // Verificar rol
    if (usuarioRol !== 'customer_success' && usuarioRol !== 'ceo') {
      return res.status(403).json({ error: 'No tienes permisos para rechazar devoluciones' });
    }

    if (!motivo) {
      return res.status(400).json({ error: 'El motivo de rechazo es requerido' });
    }

    // Verificar que la devolución existe y está en estado Solicitada
    const verificacion = await pool.query(
      'SELECT id, estado FROM devolucion WHERE id = $1',
      [id]
    );

    if (verificacion.rows.length === 0) {
      return res.status(404).json({ error: 'Devolución no encontrada' });
    }

    if (verificacion.rows[0].estado !== 'Solicitada') {
      return res.status(400).json({ error: `No se puede rechazar una devolución en estado ${verificacion.rows[0].estado}` });
    }

    // Actualizar estado
    await pool.query(
      `UPDATE devolucion 
       SET estado = 'Rechazada', 
           motivo_rechazo = $1,
           fecha_actualizacion = CURRENT_TIMESTAMP 
       WHERE id = $2`,
      [motivo, id]
    );

    console.log(`❌ Devolución ${id} rechazada`);

    res.json({
      mensaje: 'Devolución rechazada',
      devolucion_id: id,
      nuevo_estado: 'Rechazada',
      motivo: motivo
    });
  } catch (error) {
    console.error('Error rechazando devolución:', error.message);
    res.status(500).json({ error: 'Error al rechazar devolución' });
  }
});

// Completar devolución (Logistics Coordinator)
aplicacion.put('/api/devoluciones/:id/completar', autenticacion, async (req, res) => {
  try {
    const { id } = req.params;
    const { comentario } = req.body;
    const usuarioRol = req.usuario.rol;

    console.log(`📦 Completando devolución ${id} - Rol: ${usuarioRol}`);

    // Verificar rol
    if (usuarioRol !== 'logistics_coordinator' && usuarioRol !== 'ceo') {
      return res.status(403).json({ error: 'No tienes permisos para completar devoluciones' });
    }

    // Verificar que la devolución existe y está en estado Aprobada
    const verificacion = await pool.query(
      'SELECT id, estado FROM devolucion WHERE id = $1',
      [id]
    );

    if (verificacion.rows.length === 0) {
      return res.status(404).json({ error: 'Devolución no encontrada' });
    }

    if (verificacion.rows[0].estado !== 'Aprobada') {
      return res.status(400).json({ error: `Solo se pueden completar devoluciones aprobadas. Estado actual: ${verificacion.rows[0].estado}` });
    }

    // Actualizar estado
    await pool.query(
      `UPDATE devolucion 
       SET estado = 'Completada', 
           comentario_completado = $1,
           fecha_actualizacion = CURRENT_TIMESTAMP 
       WHERE id = $2`,
      [comentario || 'Completada por Logística', id]
    );

    console.log(`✅ Devolución ${id} completada`);

    res.json({
      mensaje: 'Devolución completada exitosamente',
      devolucion_id: id,
      nuevo_estado: 'Completada'
    });
  } catch (error) {
    console.error('Error completando devolución:', error.message);
    res.status(500).json({ error: 'Error al completar devolución' });
  }
});

// Endpoint para simular cambio de estado (SOLO DESARROLLO)
aplicacion.post('/api/pedidos/:pedidoId/simular-cambio', autenticacion, async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const usuarioId = req.usuario.id;

    // Verificar que el pedido pertenece al usuario
    const verificacion = await pool.query(
      'SELECT id, estado FROM pedido WHERE id = $1 AND usuario_id = $2',
      [pedidoId, parseInt(usuarioId)]
    );

    if (verificacion.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    const estadoActual = verificacion.rows[0].estado;
    const estados = ['Creado', 'Enviado', 'Entregado'];
    const indiceActual = estados.indexOf(estadoActual);
    const nuevoEstado = estados[indiceActual + 1] || 'Entregado';

    // El trigger registrará automáticamente en pedido_historial
    await pool.query(
      'UPDATE pedido SET estado = $1, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = $2',
      [nuevoEstado, pedidoId]
    );

    console.log(`✅ Estado cambiado: ${estadoActual} → ${nuevoEstado}`);

    res.json({
      mensaje: 'Estado actualizado',
      estado_anterior: estadoActual,
      estado_nuevo: nuevoEstado
    });
  } catch (error) {
    console.error('Error simulando cambio:', error.message);
    res.status(500).json({ error: 'Error simulando cambio' });
  }
});

aplicacion.listen(puerto, () => {
  console.log(`🚀 Transaction Service v2.0 ejecutándose en puerto ${puerto}`);
  console.log(`📋 Endpoints disponibles:`);
  console.log(`   • GET /api/carrito`);
  console.log(`   • POST /api/carrito`);
  console.log(`   • POST /api/checkout`);
  console.log(`   • GET /api/pedidos`);
  console.log(`   • GET /api/pedidos/:id/historial`);
  console.log(`   • POST /api/pedidos/:id/simular-cambio`);
  console.log(`   • GET /api/devoluciones`);
  console.log(`   • PUT /api/devoluciones/:id/aprobar`);
  console.log(`   • PUT /api/devoluciones/:id/rechazar`);
  console.log(`   • PUT /api/devoluciones/:id/completar`);
});

module.exports = aplicacion;