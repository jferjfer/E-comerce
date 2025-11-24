const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const rutasCarrito = require('./rutas/rutasCarrito');
const rutasPedido = require('./rutas/rutasPedido');
const rutasPago = require('./rutas/rutasPago');
// const autenticacion = require('./middleware/autenticacion');
const manejadorErrores = require('./middleware/manejadorErrores');
const pool = require('./config/baseDatos');

const aplicacion = express();
const puerto = process.env.PUERTO || 3003;

// Middleware de seguridad
aplicacion.use(helmet());
aplicacion.use(cors({
  origin: ['http://localhost:3005', 'http://localhost:3000'],
  credentials: true
}));
aplicacion.use(express.json({ limit: '10mb' }));

// Logging middleware
aplicacion.use((req, res, next) => {
  console.log(`🛒 ${req.method} ${req.url} - ${new Date().toLocaleTimeString()}`);
  next();
});

// Rutas
// aplicacion.use('/api/carrito', rutasCarrito);
// aplicacion.use('/api/pedidos', rutasPedido);
// aplicacion.use('/api/pagos', rutasPago);

// Funciones de base de datos
async function obtenerCarrito(usuarioId) {
  const consulta = 'SELECT * FROM carrito WHERE usuario_id = $1';
  const resultado = await pool.query(consulta, [usuarioId]);
  return resultado.rows[0] || { productos: [], total: 0 };
}

async function guardarCarrito(usuarioId, carrito) {
  const consulta = `
    INSERT INTO carrito (usuario_id, productos, total, fecha_actualizacion)
    VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
    ON CONFLICT (usuario_id) 
    DO UPDATE SET productos = $2, total = $3, fecha_actualizacion = CURRENT_TIMESTAMP
  `;
  await pool.query(consulta, [usuarioId, JSON.stringify(carrito.productos), carrito.total]);
}

// Middleware de autenticación simple
const autenticacion = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  req.usuario = { id: '1', nombre: 'Usuario Demo', email: 'demo@estilomoda.com' };
  next();
};

// Endpoints directos para desarrollo
aplicacion.get('/api/carrito', autenticacion, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const carrito = await obtenerCarrito(usuarioId);
    
    console.log(`🛒 Obteniendo carrito para usuario ${usuarioId}`);
    res.json({ datos: carrito });
  } catch (error) {
    console.error('Error obteniendo carrito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

aplicacion.post('/api/carrito', autenticacion, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { id_producto, cantidad = 1 } = req.body;
    
    console.log(`🛒 Agregando producto ${id_producto} (cantidad: ${cantidad}) al carrito del usuario ${usuarioId}`);
    
    // Obtener carrito actual
    let carrito = await obtenerCarrito(usuarioId);
    if (typeof carrito.productos === 'string') {
      carrito.productos = JSON.parse(carrito.productos);
    }
    if (!Array.isArray(carrito.productos)) {
      carrito.productos = [];
    }
    
    // Buscar si el producto ya existe
    const productoExistente = carrito.productos.find(p => p.id === id_producto);
    
    if (productoExistente) {
      productoExistente.cantidad += cantidad;
    } else {
      // Simular datos del producto
      const nuevoProducto = {
        id: id_producto,
        nombre: `Producto ${id_producto}`,
        precio: Math.floor(Math.random() * 10000) + 2000,
        cantidad: cantidad,
        imagen: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=500&fit=crop'
      };
      carrito.productos.push(nuevoProducto);
    }
    
    // Recalcular total
    carrito.total = carrito.productos.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
    
    // Guardar carrito
    await guardarCarrito(usuarioId, carrito);
    
    res.json({
      mensaje: 'Producto agregado al carrito exitosamente',
      datos: { id_producto, cantidad, total_items: carrito.productos.length }
    });
  } catch (error) {
    console.error('Error agregando al carrito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

aplicacion.delete('/api/carrito/:productoId', autenticacion, (req, res) => {
  const usuarioId = req.usuario.id;
  const productoId = req.params.productoId;
  
  console.log(`🗑️ Eliminando producto ${productoId} del carrito del usuario ${usuarioId}`);
  
  let carrito = carritosPorUsuario.get(usuarioId) || { productos: [], total: 0 };
  carrito.productos = carrito.productos.filter(p => p.id !== productoId);
  carrito.total = carrito.productos.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
  
  carritosPorUsuario.set(usuarioId, carrito);
  
  res.json({ mensaje: 'Producto eliminado del carrito' });
});

aplicacion.post('/api/checkout', autenticacion, (req, res) => {
  const usuarioId = req.usuario.id;
  const { metodo_pago, direccion_envio } = req.body;
  
  console.log(`💳 Procesando checkout para usuario ${usuarioId}`);
  
  const carrito = carritosPorUsuario.get(usuarioId) || { productos: [], total: 0 };
  
  if (carrito.productos.length === 0) {
    return res.status(400).json({ error: 'El carrito está vacío' });
  }
  
  // Simular procesamiento de pago
  const pedido = {
    id: `pedido_${Date.now()}`,
    usuario_id: usuarioId,
    productos: carrito.productos,
    total: carrito.total,
    metodo_pago,
    direccion_envio,
    estado: 'procesando',
    fecha_creacion: new Date().toISOString()
  };
  
  // Limpiar carrito
  carritosPorUsuario.set(usuarioId, { productos: [], total: 0 });
  
  res.json({
    mensaje: 'Pedido creado exitosamente',
    pedido: pedido
  });
});

// Ruta de salud
aplicacion.get('/salud', (req, res) => {
  res.json({
    estado: 'activo',
    servicio: 'transacciones',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    carritos_activos: carritosPorUsuario.size
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