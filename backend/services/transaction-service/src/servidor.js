const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();
const pool = require('./config/baseDatos');
const manejadorErrores = require('./middleware/manejadorErrores');

const aplicacion = express();
const puerto = process.env.PUERTO || 3003;

aplicacion.use(helmet());
aplicacion.use(cors({
  origin: ['http://localhost:3005', 'http://localhost:3000'],
  credentials: true
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
const JWT_SECRET = process.env.JWT_SECRET || 'clave-secreta-estilo-moda-2024';

const autenticacion = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Token requerido' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    req.usuario = { id: decoded.id, email: decoded.email, rol: decoded.rol };
    next();
  } catch (error) {
    console.error('Error autenticación:', error.message);
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// Endpoints directos para desarrollo
aplicacion.get('/api/carrito', autenticacion, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    
    // Obtener carrito y sus productos
    const consultaCarrito = `
      SELECT c.id, c.id_usuario, c.fecha_creacion, c.fecha_actualizacion,
             COALESCE(json_agg(
               json_build_object(
                 'id', cp.id_producto,
                 'cantidad', cp.cantidad,
                 'precio', cp.precio_unitario,
                 'nombre', 'Producto ' || cp.id_producto,
                 'imagen', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=500&fit=crop'
               )
             ) FILTER (WHERE cp.id IS NOT NULL), '[]') as productos
      FROM carrito c
      LEFT JOIN carrito_producto cp ON c.id = cp.id_carrito
      WHERE c.id_usuario = $1::integer
      GROUP BY c.id, c.id_usuario, c.fecha_creacion, c.fecha_actualizacion
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

    // Crear o obtener carrito
    const consultaCarrito = `
      INSERT INTO carrito (id_usuario, fecha_actualizacion)
      VALUES ($1::integer, CURRENT_TIMESTAMP)
      ON CONFLICT (id_usuario) 
      DO UPDATE SET fecha_actualizacion = CURRENT_TIMESTAMP
      RETURNING id
    `;
    const resultadoCarrito = await pool.query(consultaCarrito, [parseInt(usuarioId)]);
    const carritoId = resultadoCarrito.rows[0].id;

    // Verificar si el producto ya existe en el carrito
    const consultaProductoExistente = `
      SELECT * FROM carrito_producto 
      WHERE id_carrito = $1 AND id_producto = $2
    `;
    const productoExistente = await pool.query(consultaProductoExistente, [carritoId, id_producto]);

    const precio = Math.floor(Math.random() * 10000) + 2000; // Precio simulado

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
        INSERT INTO carrito_producto (id_carrito, id_producto, cantidad, precio_unitario)
        VALUES ($1, $2, $3, $4)
      `, [carritoId, id_producto, cantidad, precio]);
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
    const consultaCarrito = 'SELECT id FROM carrito WHERE id_usuario = $1::integer';
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
      WHERE c.id_usuario = $1::integer
      GROUP BY c.id
    `;
    
    const resultadoCarrito = await pool.query(consultaCarrito, [parseInt(usuarioId)]);
    
    if (resultadoCarrito.rows.length === 0 || !resultadoCarrito.rows[0].productos[0].id) {
      return res.status(400).json({ error: 'El carrito está vacío' });
    }
    
    const carrito = resultadoCarrito.rows[0];
    const carritoId = carrito.id;

    // Crear pedido
    const consultaPedido = `
      INSERT INTO pedido (id_usuario, estado, total)
      VALUES ($1::integer, 'Creado', $2)
      RETURNING id
    `;
    const resultadoPedido = await pool.query(consultaPedido, [parseInt(usuarioId), carrito.total]);
    const pedidoId = resultadoPedido.rows[0].id;

    // Copiar productos del carrito al pedido
    for (const producto of carrito.productos) {
      await pool.query(`
        INSERT INTO pedido_producto (id_pedido, id_producto, cantidad, precio_unitario, subtotal)
        VALUES ($1, $2, $3, $4, $5)
      `, [pedidoId, producto.id, producto.cantidad, producto.precio, producto.cantidad * producto.precio]);
    }

    // Limpiar carrito
    await pool.query('DELETE FROM carrito_producto WHERE id_carrito = $1', [carritoId]);

    const pedido = {
      id: pedidoId,
      usuario_id: usuarioId,
      productos: carrito.productos,
      total: carrito.total,
      metodo_pago,
      direccion_envio,
      estado: 'procesando',
      fecha_creacion: new Date().toISOString()
    };

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

aplicacion.listen(puerto, () => {
  console.log(`🚀 Transaction Service v2.0 ejecutándose en puerto ${puerto}`);
  console.log(`📋 Endpoints disponibles:`);
  console.log(`   • GET /api/carrito`);
  console.log(`   • POST /api/carrito`);
  console.log(`   • POST /api/checkout`);
});

module.exports = aplicacion;