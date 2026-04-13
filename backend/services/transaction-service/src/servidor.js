const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();
const pool = require('./config/baseDatos');
const manejadorErrores = require('./middleware/manejadorErrores');
const axios = require('axios');
const nodemailer = require('nodemailer');
const epayco = require('./epayco');

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

  const urlPedidos = `${process.env.FRONTEND_URL || 'https://egoscolombia.com.co'}/orders`;
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

  const urlPedidos = `${process.env.FRONTEND_URL || 'https://egoscolombia.com.co'}/orders`;
  const formatearPrecio = (v) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v);

  const nombreCorto = nombreUsuario.split(' ')[0];

  const productosHtml = (pedido.productos || []).map(p => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #f0ebe4;color:#374151;font-size:14px">
        <strong>${p.nombre || 'Producto EGOS'}</strong>
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #f0ebe4;text-align:center;color:#6b7280;font-size:14px">${p.cantidad}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #f0ebe4;text-align:right;font-weight:bold;color:#111827;font-size:14px">${formatearPrecio(p.precio * p.cantidad)}</td>
    </tr>
  `).join('');

  const metodoPagoTexto = {
    'pago_en_linea': 'Pago en línea',
    'credito': 'Crédito EGOS',
    'efectivo': 'Efectivo',
    'tarjeta': 'Tarjeta'
  }[pedido.metodo_pago] || pedido.metodo_pago || 'Pago en línea';

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background:#f5f0eb;font-family:'Helvetica Neue',Arial,sans-serif">
      <div style="max-width:600px;margin:0 auto;background:#ffffff">

        <!-- HEADER -->
        <div style="background:#111827;padding:36px 40px;text-align:center">
          <div style="margin-bottom:4px">
            <span style="font-size:36px;font-weight:900;color:#c5a47e;letter-spacing:-2px">E</span>
          </div>
          <div style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:10px;text-transform:uppercase">EGOS</div>
          <div style="font-size:10px;color:#c5a47e;letter-spacing:4px;margin-top:2px;text-transform:uppercase">Wear Your Truth</div>
        </div>

        <!-- BANNER CONFIRMACION -->
        <div style="background:linear-gradient(135deg,#c5a47e,#a67c52);padding:32px 40px;text-align:center">
          <div style="font-size:40px;margin-bottom:8px">&#10003;</div>
          <h1 style="color:#111827;margin:0;font-size:24px;font-weight:800;letter-spacing:-0.5px">¡Tu pedido está confirmado!</h1>
          <p style="color:#111827;margin:8px 0 0;font-size:13px;opacity:0.8">Pedido <strong>#${pedido.id}</strong></p>
        </div>

        <!-- CUERPO -->
        <div style="padding:40px">

          <p style="font-size:17px;color:#111827;margin:0 0 8px">Hola <strong>${nombreCorto}</strong> 👋</p>
          <p style="font-size:14px;color:#6b7280;line-height:1.7;margin:0 0 28px">
            Gracias por confiar en <strong>EGOS</strong>. Tu pedido fue recibido y ya está en manos de nuestro equipo.
            Pronto te notificaremos cuando esté en camino hacia ti.
          </p>

          <!-- RESUMEN PEDIDO -->
          <div style="background:#faf8f5;border-radius:12px;overflow:hidden;margin-bottom:28px;border:1px solid #f0ebe4">
            <div style="background:#111827;padding:14px 20px">
              <p style="margin:0;font-size:12px;font-weight:700;color:#c5a47e;letter-spacing:2px;text-transform:uppercase">Resumen de tu pedido</p>
            </div>
            <table style="width:100%;border-collapse:collapse">
              <thead>
                <tr style="background:#f5f0eb">
                  <th style="padding:10px 16px;text-align:left;font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:1px">Producto</th>
                  <th style="padding:10px 16px;text-align:center;font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:1px">Cant.</th>
                  <th style="padding:10px 16px;text-align:right;font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:1px">Subtotal</th>
                </tr>
              </thead>
              <tbody>${productosHtml}</tbody>
              <tfoot>
                <tr style="background:#111827">
                  <td colspan="2" style="padding:16px;font-weight:700;color:#c5a47e;font-size:15px">Total pagado</td>
                  <td style="padding:16px;text-align:right;font-weight:800;color:#c5a47e;font-size:18px">${formatearPrecio(pedido.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- DETALLES -->
          <div style="display:flex;gap:12px;margin-bottom:28px">
            <div style="flex:1;background:#faf8f5;border-radius:10px;padding:16px;border:1px solid #f0ebe4">
              <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px">Método de pago</p>
              <p style="margin:0;font-size:14px;font-weight:600;color:#111827">${metodoPagoTexto}</p>
            </div>
            <div style="flex:1;background:#faf8f5;border-radius:10px;padding:16px;border:1px solid #f0ebe4">
              <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px">Estado</p>
              <p style="margin:0;font-size:14px;font-weight:600;color:#059669">✓ Confirmado</p>
            </div>
            <div style="flex:1;background:#faf8f5;border-radius:10px;padding:16px;border:1px solid #f0ebe4">
              <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px">Fecha</p>
              <p style="margin:0;font-size:14px;font-weight:600;color:#111827">${new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
          </div>

          <!-- MENSAJE EMOCIONAL -->
          <div style="background:linear-gradient(135deg,#111827,#1f2937);border-radius:12px;padding:24px;margin-bottom:28px;text-align:center">
            <p style="margin:0 0 8px;font-size:15px;color:#c5a47e;font-weight:600">✨ Cada prenda cuenta una historia</p>
            <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6">
              En EGOS creemos que la moda es una forma de expresión. Esperamos que lo que elegiste
              refleje exactamente quién eres.
            </p>
          </div>

          <!-- CTA -->
          <div style="text-align:center">
            <a href="${urlPedidos}" style="display:inline-block;background:#c5a47e;color:#111827;padding:16px 40px;text-decoration:none;border-radius:8px;font-size:15px;font-weight:700;letter-spacing:1px">
              Ver mis pedidos
            </a>
          </div>

        </div>

        <!-- FOOTER -->
        <div style="background:#111827;padding:28px 40px;text-align:center">
          <p style="margin:0 0 8px;font-size:11px;color:#c5a47e;letter-spacing:3px;text-transform:uppercase">EGOS — Wear Your Truth</p>
          <p style="margin:0;font-size:11px;color:#6b7280">hola@egos.com.co · egoscolombia.com.co</p>
          <p style="margin:8px 0 0;font-size:10px;color:#4b5563">Este es un correo automático, por favor no respondas a este mensaje.</p>
        </div>

      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"EGOS" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `✨ ¡Tu pedido #${pedido.id} está confirmado! — EGOS`,
      html
    });
    console.log(`📧 Correo de confirmación enviado a ${email}`);
  } catch (err) {
    console.log(`⚠️ No se pudo enviar correo de confirmación a ${email}:`, err.message);
  }
}

const aplicacion = express();
const puerto = process.env.PUERTO || 3003;
// v2.2.0 — WebSocket fix + historial sin duplicados

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
  'https://egoscolombia.com.co',
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
const JWT_SECRET = process.env.JWT_SECRETO;
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
    if (process.env.NODE_ENV !== 'production') console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Error obteniendo carrito' });
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
    if (process.env.NODE_ENV !== 'production') console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Error agregando producto' });
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
    res.status(500).json({ error: 'Error obteniendo pedidos' });
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
      ? 'SELECT id, estado, usuario_id, total FROM pedido WHERE id = $1'
      : 'SELECT id, estado, usuario_id, total FROM pedido WHERE id = $1 AND usuario_id = $2';
    const params = esAdmin ? [pedidoId] : [pedidoId, parseInt(usuarioId)];

    const verificacion = await pool.query(condicion, params);

    if (verificacion.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    const estadoAnterior = verificacion.rows[0].estado;
    const usuarioIdPedido = verificacion.rows[0].usuario_id;
    const totalPedido = verificacion.rows[0].total;

    await pool.query(
      'UPDATE pedido SET estado = $1, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = $2',
      [estado, pedidoId]
    );

    // Actualizar comentario del trigger
    if (comentario) {
      await pool.query(
        `UPDATE pedido_historial SET comentario = $1
         WHERE id = (SELECT id FROM pedido_historial WHERE id_pedido = $2 AND estado_nuevo = $3 ORDER BY fecha_cambio DESC LIMIT 1)`,
        [comentario, pedidoId, estado]
      );
    }

    // Emitir SSE inmediatamente
    emitirSSE(usuarioIdPedido, 'pedido_actualizado', {
      pedidoId, estadoAnterior, estado_nuevo: estado, total: totalPedido
    });

    // Emitir WebSocket via gateway como respaldo
    axios.post('http://gateway:3000/interno/emitir', {
      evento: 'pedido_actualizado',
      usuarioId: String(usuarioIdPedido),
      sala: 'admins',
      datos: { pedidoId, estadoAnterior, estado_nuevo: estado, total: totalPedido, usuario_id: usuarioIdPedido }
    }, { timeout: 2000 }).then(() => {
      console.log(`📡 WebSocket emitido a usuario_${usuarioIdPedido}`);
    }).catch(e => console.log(`⚠️ WebSocket error: ${e.message}`));

    // Enviar correo en background
    axios.get(`http://auth-service:3011/api/usuarios/${usuarioIdPedido}`, { timeout: 2000 })
      .then(resU => {
        const { email, nombre } = resU.data.usuario || {};
        if (email) enviarNotificacionEstado(email, nombre || 'Cliente', pedidoId, estado, totalPedido || 0);
      })
      .catch(e => console.log(`⚠️ No se pudo enviar correo: ${e.message}`));

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
    const { metodo_pago, direccion_envio, items: itemsFrontend } = req.body;

    console.log(`💳 Procesando checkout para usuario ${usuarioId}`);

    let carrito;

    // Si el frontend envía items con cantidades reales, usarlos directamente
    if (itemsFrontend && itemsFrontend.length > 0) {

      // 🔒 VALIDACIÓN DE SEGURIDAD: precios y cantidades deben ser positivos
      for (const item of itemsFrontend) {
        if (!item.id) {
          return res.status(400).json({ error: 'Producto inválido en el carrito' });
        }
        if (typeof item.precio !== 'number' || item.precio <= 0) {
          return res.status(400).json({ error: `Precio inválido para producto ${item.id}` });
        }
        if (typeof item.cantidad !== 'number' || item.cantidad <= 0 || item.cantidad > 100) {
          return res.status(400).json({ error: `Cantidad inválida para producto ${item.id} (máx 100)` });
        }
        if (item.precio > 50000000) {
          return res.status(400).json({ error: `Precio excede el máximo permitido` });
        }
      }

      const total = itemsFrontend.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);

      if (total <= 0) {
        return res.status(400).json({ error: 'El total del pedido debe ser mayor a cero' });
      }

      if (total < 5000) {
        return res.status(400).json({ error: 'El monto mínimo de compra es $5.000 COP' });
      }

      carrito = {
        id: null,
        productos: itemsFrontend.map(p => ({
          id: p.id,
          cantidad: Math.floor(p.cantidad), // Asegurar entero
          precio: Math.abs(p.precio),       // Asegurar positivo
          nombre: p.nombre || `Producto ${p.id}`
        })),
        total
      };
    } else {
      // Fallback: obtener carrito del backend
      const consultaCarrito = `
        SELECT c.id,
               json_agg(
                 json_build_object(
                   'id', cp.id_producto,
                   'cantidad', cp.cantidad,
                   'precio', cp.precio_unitario,
                   'nombre', COALESCE(cp.nombre_producto, 'Producto ' || cp.id_producto)
                 )
               ) as productos,
               SUM(cp.cantidad * cp.precio_unitario) as total
        FROM carrito c
        LEFT JOIN carrito_producto cp ON c.id = cp.id_carrito
        WHERE c.usuario_id = $1
        GROUP BY c.id
      `;
      const resultadoCarrito = await pool.query(consultaCarrito, [parseInt(usuarioId)]);

      if (resultadoCarrito.rows.length === 0 || !resultadoCarrito.rows[0].productos[0]?.id) {
        return res.status(400).json({ error: 'El carrito está vacío' });
      }
      carrito = resultadoCarrito.rows[0];
    }
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

    // Limpiar carrito del backend
    try {
      const carritoRow = await pool.query('SELECT id FROM carrito WHERE usuario_id = $1', [parseInt(usuarioId)]);
      if (carritoRow.rows.length > 0) {
        await pool.query('DELETE FROM carrito_producto WHERE id_carrito = $1', [carritoRow.rows[0].id]);
      }
    } catch (e) {
      console.log('⚠️ No se pudo limpiar carrito backend:', e.message);
    }

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
      const { email, nombre, documento_tipo, documento_numero, direccion, ciudad } = resUsuario.data.usuario || {};
      datosUsuario = {
        nombre: nombre || 'Cliente',
        email: email || '',
        documento_tipo: documento_tipo || 'CC',
        documento_numero: documento_numero || '',
        direccion: direccion || ciudad || 'Bogotá D.C'
      };
      if (email) {
        enviarConfirmacionCompra(email, nombre || 'Cliente', pedido);
      }
    } catch (errCorreo) {
      console.log('⚠️ No se pudo obtener datos del usuario para correo:', errCorreo.message);
    }

    // Registrar asiento contable automático
    axios.post('http://contabilidad-service:3012/api/contabilidad/eventos/venta', {
      pedido_id: pedidoId,
      total: carrito.total,
      usuario_id: usuarioId,
      metodo_pago: metodo_pago || 'pago_en_linea',
      fecha: new Date().toISOString()
    }, { timeout: 3000 }).then(() => {
      console.log(`📊 Asiento contable registrado para pedido ${pedidoId}`);
    }).catch(e => {
      console.log(`⚠️ No se pudo registrar asiento contable: ${e.message}`);
    });

    // Notificar a admins en tiempo real que hay un pedido nuevo
    axios.post('http://gateway:3000/interno/emitir', {
      evento: 'pedido_nuevo',
      sala: 'admins',
      datos: { pedidoId, total: carrito.total, usuario_id: usuarioId, estado: 'Creado' }
    }, { timeout: 2000 }).catch(() => {});

    // Actualizar total_compras_historico del usuario
    axios.put(`http://auth-service:3011/api/usuarios/total-compras`, {
      nuevoTotal: parseFloat(carrito.total)
    }, {
      headers: { Authorization: req.headers.authorization },
      timeout: 3000
    }).then(() => {
      console.log(`💰 Total compras actualizado para usuario ${usuarioId}: +${carrito.total}`);
    }).catch(e => {
      console.log(`⚠️ No se pudo actualizar total compras: ${e.message}`);
    });

    // Generar factura electrónica en background
    axios.post('http://facturacion-service:3010/api/facturas/generar', {
      pedido_id: pedidoId,
      usuario_id: usuarioId,
      cliente: {
        nombre: datosUsuario.nombre,
        email: datosUsuario.email,
        nit_cc: datosUsuario.documento_numero || 'Consumidor Final',
        tipo_documento: datosUsuario.documento_tipo || 'CC',
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
    if (process.env.NODE_ENV !== 'production') console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Error procesando pedido' });
  }
});

// ============================================
// SSE — Server-Sent Events para cambios de estado
// ============================================
const sseClientes = new Map(); // usuarioId -> Set de respuestas SSE

aplicacion.get('/api/eventos/pedidos', (req, res) => {
  // Aceptar token por header o query param
  const tokenHeader = req.headers.authorization?.replace('Bearer ', '');
  const tokenQuery = req.query.token as string;
  const token = tokenHeader || tokenQuery;

  if (!token) return res.status(401).json({ error: 'Token requerido' });

  let usuarioId: string;
  try {
    const decoded: any = require('jsonwebtoken').verify(token, JWT_SECRET);
    usuarioId = String(decoded.id);
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Registrar cliente
  if (!sseClientes.has(usuarioId)) sseClientes.set(usuarioId, new Set());
  sseClientes.get(usuarioId).add(res);
  console.log(`📡 SSE conectado: usuario ${usuarioId} (total: ${sseClientes.get(usuarioId).size})`);

  // Heartbeat cada 30s para mantener conexión
  const heartbeat = setInterval(() => {
    res.write(':heartbeat\n\n');
  }, 30000);

  // Limpiar al desconectar
  req.on('close', () => {
    clearInterval(heartbeat);
    sseClientes.get(usuarioId)?.delete(res);
    if (sseClientes.get(usuarioId)?.size === 0) sseClientes.delete(usuarioId);
    console.log(`📡 SSE desconectado: usuario ${usuarioId}`);
  });
});

function emitirSSE(usuarioId, evento, datos) {
  const clientes = sseClientes.get(String(usuarioId));
  if (!clientes || clientes.size === 0) return;
  const mensaje = `event: ${evento}\ndata: ${JSON.stringify(datos)}\n\n`;
  clientes.forEach(res => {
    try { res.write(mensaje); } catch (e) {}
  });
  console.log(`📡 SSE emitido a usuario ${usuarioId}: ${evento}`);
}

 (req, res) => {
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

    // Registrar asiento contable de devolución
    const pedidoData = await pool.query('SELECT total FROM pedido WHERE id = $1', [pedidoId]);
    if (pedidoData.rows.length > 0) {
      axios.post('http://contabilidad-service:3012/api/contabilidad/eventos/devolucion', {
        pedido_id: pedidoId,
        total: pedidoData.rows[0].total,
        fecha: new Date().toISOString()
      }, { timeout: 3000 }).catch(e => {
        console.log(`⚠️ No se pudo registrar asiento devolución: ${e.message}`);
      });
    }

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
    const usuarioRol = req.usuario.rol;
    const usuarioId = req.usuario.id;

    // Solo roles admin pueden ver todas las devoluciones
    const rolesAdmin = ['ceo', 'customer_success', 'logistics_coordinator', 'operations_director', 'support_agent'];
    if (!rolesAdmin.includes(usuarioRol)) {
      return res.status(403).json({ error: 'Sin permisos para ver todas las devoluciones' });
    }

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

// ============================================
// ENDPOINTS EPAYCO
// ============================================

// Verificar si ePayco está configurado
aplicacion.get('/api/pagos/epayco/estado', (req, res) => {
  res.json({
    configurado: epayco.estaConfigurado(),
    test: epayco.EPAYCO_CONFIG.test,
    mensaje: epayco.estaConfigurado()
      ? 'ePayco configurado y listo'
      : 'ePayco pendiente de configuración — agrega EPAYCO_P_CUST_ID, EPAYCO_P_KEY y EPAYCO_PRIVATE_KEY'
  });
});

// Obtener datos del widget para un pedido
aplicacion.post('/api/pagos/epayco/widget', autenticacion, async (req, res) => {
  try {
    const { pedido_id } = req.body;
    const usuarioId = req.usuario.id;

    if (!epayco.estaConfigurado()) {
      return res.status(503).json({
        error: 'Pasarela de pagos no configurada',
        mensaje: 'ePayco aún no está activado. Usa crédito interno o efectivo por ahora.'
      });
    }

    // Obtener pedido
    const pedidoResult = await pool.query(
      'SELECT * FROM pedido WHERE id = $1 AND usuario_id = $2',
      [pedido_id, parseInt(usuarioId)]
    );

    if (pedidoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    const pedido = pedidoResult.rows[0];

    // Obtener productos del pedido
    const productosResult = await pool.query(
      'SELECT * FROM pedido_producto WHERE id_pedido = $1',
      [pedido_id]
    );
    pedido.productos = productosResult.rows;

    // Obtener datos del cliente
    let cliente = { nombre: 'Cliente', email: '', documento_tipo: 'CC', documento_numero: '', telefono: '', direccion: '' };
    try {
      const resUsuario = await axios.get(`http://auth-service:3011/api/usuarios/${usuarioId}`, { timeout: 3000 });
      const u = resUsuario.data.usuario || {};
      cliente = {
        nombre: `${u.nombre || ''} ${u.apellido || ''}`.trim(),
        email: u.email || '',
        documento_tipo: u.documento_tipo || 'CC',
        documento_numero: u.documento_numero || '',
        telefono: u.telefono || '',
        direccion: u.direccion || u.ciudad || 'Bogotá D.C.'
      };
    } catch (e) {
      console.log('⚠️ No se pudo obtener datos del cliente para ePayco:', e.message);
    }

    const datosWidget = epayco.generarDatosWidget(pedido, cliente);

    console.log(`💳 Widget ePayco generado para pedido ${pedido_id}`);

    res.json({
      datos_widget: datosWidget,
      pedido_id: pedido_id,
      total: pedido.total
    });
  } catch (error) {
    console.error('Error generando widget ePayco:', error.message);
    res.status(500).json({ error: 'Error generando datos de pago' });
  }
});

// Webhook de confirmación — ePayco llama este endpoint cuando el pago es procesado
aplicacion.post('/api/pagos/epayco/confirmar', async (req, res) => {
  try {
    const datos = req.body;
    console.log('📥 Webhook ePayco recibido:', JSON.stringify(datos, null, 2));

    // Verificar firma de seguridad
    if (!epayco.verificarFirmaWebhook(datos)) {
      console.error('❌ Firma ePayco inválida — posible fraude');
      return res.status(400).json({ error: 'Firma inválida' });
    }

    const { x_extra1: pedidoId, x_response_code_transaction: codigoRespuesta, x_ref_payco: refPayco, x_amount: monto } = datos;

    if (!pedidoId) {
      return res.status(400).json({ error: 'Pedido ID no encontrado en webhook' });
    }

    const { estado, descripcion, exitoso } = epayco.interpretarEstado(codigoRespuesta);

    console.log(`💳 ePayco — Pedido ${pedidoId}: ${descripcion} (código: ${codigoRespuesta})`);

    // Actualizar estado del pedido
    const pedidoActual = await pool.query('SELECT id, estado, usuario_id, total FROM pedido WHERE id = $1', [pedidoId]);

    if (pedidoActual.rows.length === 0) {
      console.error(`❌ Pedido ${pedidoId} no encontrado en webhook ePayco`);
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    const pedido = pedidoActual.rows[0];

    // Actualizar estado del pedido — el trigger registra en historial automáticamente
    await pool.query(
      'UPDATE pedido SET estado = $1, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = $2',
      [estado, pedidoId]
    );

    // Actualizar comentario del registro del trigger con info de ePayco
    await pool.query(
      `UPDATE pedido_historial SET comentario = $1
       WHERE id_pedido = $2 AND estado_nuevo = $3
       ORDER BY fecha_cambio DESC LIMIT 1`,
      [`ePayco: ${descripcion} — Ref: ${refPayco}`, pedidoId, estado]
    );

    // Actualizar estado del pago
    await pool.query(
      `UPDATE pago SET estado = $1, referencia_transaccion = $2 WHERE id_pedido = $3`,
      [exitoso ? 'Aprobado' : 'Rechazado', refPayco, pedidoId]
    );

    if (exitoso) {
      // Notificar al cliente por WebSocket
      axios.post('http://gateway:3000/interno/emitir', {
        evento: 'pedido_actualizado',
        usuarioId: pedido.usuario_id,
        sala: 'admins',
        datos: { pedidoId, estado_nuevo: estado, total: pedido.total, usuario_id: pedido.usuario_id }
      }, { timeout: 2000 }).catch(() => {});

      // Actualizar total de compras del usuario
      axios.put('http://auth-service:3011/api/usuarios/total-compras', {
        nuevoTotal: parseFloat(pedido.total)
      }, {
        headers: { Authorization: `Bearer ${process.env.INTERNAL_TOKEN || ''}` },
        timeout: 3000
      }).catch(e => console.log('⚠️ No se pudo actualizar total compras:', e.message));

      console.log(`✅ Pago ePayco confirmado para pedido ${pedidoId}`);
    } else {
      console.log(`❌ Pago ePayco no exitoso para pedido ${pedidoId}: ${descripcion}`);
    }

    res.json({ ok: true, estado, pedido_id: pedidoId });
  } catch (error) {
    console.error('Error procesando webhook ePayco:', error.message);
    res.status(500).json({ error: 'Error procesando confirmación' });
  }
});

// Consultar estado de un pago por referencia ePayco
aplicacion.get('/api/pagos/epayco/consultar/:refPayco', autenticacion, async (req, res) => {
  try {
    const { refPayco } = req.params;

    if (!epayco.estaConfigurado()) {
      return res.status(503).json({ error: 'ePayco no configurado' });
    }

    const resultado = await epayco.consultarPago(refPayco);
    res.json(resultado);
  } catch (error) {
    res.status(500).json({ error: 'Error consultando pago' });
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