const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();
const pool = require('./config/baseDatos');

const aplicacion = express();
const puerto = process.env.PUERTO || 3006;

// Middleware
aplicacion.use(helmet());

const ALLOWED_ORIGINS = [
  'https://egoscolombia.com.co',
  'http://149.130.182.9:3005',
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
aplicacion.use(express.json());

// Logging middleware
aplicacion.use((req, res, next) => {
  console.log(`📢 ${req.method} ${req.url} - ${new Date().toLocaleTimeString()}`);
  next();
});

// Inicializar tablas si no existen
async function inicializarDB() {
  try {
    // Verificar si las tablas existen, si no, crearlas
    const fs = require('fs');
    const path = require('path');
    const sqlPath = path.join(__dirname, '../sql/crear-tablas.sql');
    
    if (fs.existsSync(sqlPath)) {
      const sql = fs.readFileSync(sqlPath, 'utf8');
      await pool.query(sql);
      console.log('✅ Marketing Service - Tablas verificadas/creadas');
    }
  } catch (error) {
    console.error('❌ Error inicializando BD Marketing:', error);
  }
}

inicializarDB();

// Funciones de base de datos
async function obtenerCupones() {
  const consulta = 'SELECT * FROM cupon WHERE activo = true ORDER BY fecha_creacion DESC';
  const resultado = await pool.query(consulta);
  return resultado.rows;
}

async function validarCupon(codigo) {
  const consulta = 'SELECT * FROM cupon WHERE codigo = $1 AND activo = true';
  const resultado = await pool.query(consulta, [codigo]);
  return resultado.rows[0];
}

async function obtenerFidelizacion(usuarioId) {
  const consulta = 'SELECT * FROM fidelizacion WHERE usuario_id = $1';
  const resultado = await pool.query(consulta, [usuarioId]);
  return resultado.rows[0] || { puntos_acumulados: 0, nivel: 'bronce' };
}

// Base de datos simulada (mantener para compatibilidad)
const cuponesDB = [
  {
    id: 'BIENVENIDA20',
    nombre: 'Bienvenida 20%',
    descripcion: 'Descuento del 20% para nuevos usuarios',
    tipo: 'porcentaje',
    valor: 20,
    minimo_compra: 50000,
    maximo_descuento: 50000,
    fecha_inicio: '2024-01-01',
    fecha_fin: '2024-12-31',
    usos_maximos: 1000,
    usos_actuales: 245,
    activo: true
  },
  {
    id: 'VERANO2024',
    nombre: 'Verano 2024',
    descripcion: 'Descuento especial de temporada',
    tipo: 'porcentaje',
    valor: 15,
    minimo_compra: 80000,
    maximo_descuento: 30000,
    fecha_inicio: '2024-06-01',
    fecha_fin: '2024-08-31',
    usos_maximos: 500,
    usos_actuales: 89,
    activo: true
  },
  {
    id: 'ENVIOGRATIS',
    nombre: 'Envío Gratis',
    descripcion: 'Envío gratuito en compras superiores a $100.000',
    tipo: 'envio_gratis',
    valor: 0,
    minimo_compra: 100000,
    fecha_inicio: '2024-01-01',
    fecha_fin: '2024-12-31',
    usos_maximos: -1, // Ilimitado
    usos_actuales: 1250,
    activo: true
  }
];

const campanasDB = [
  {
    id: '1',
    nombre: 'Campaña de Primavera',
    descripcion: 'Promoción de productos de temporada primaveral',
    tipo: 'estacional',
    fecha_inicio: '2024-03-01',
    fecha_fin: '2024-05-31',
    presupuesto: 500000,
    gasto_actual: 125000,
    productos_incluidos: ['1', '2', '5'],
    metricas: {
      impresiones: 45000,
      clics: 2250,
      conversiones: 180,
      ctr: 5.0,
      conversion_rate: 8.0
    },
    activa: true
  },
  {
    id: '2',
    nombre: 'Black Friday 2024',
    descripcion: 'Mega descuentos para Black Friday',
    tipo: 'evento_especial',
    fecha_inicio: '2024-11-25',
    fecha_fin: '2024-11-29',
    presupuesto: 1000000,
    gasto_actual: 0,
    productos_incluidos: ['1', '2', '3', '4'],
    metricas: {
      impresiones: 0,
      clics: 0,
      conversiones: 0,
      ctr: 0,
      conversion_rate: 0
    },
    activa: false
  }
];

const fidelizacionDB = new Map(); // usuarioId -> puntos

// Middleware de autenticación JWT real
const jwt = require('jsonwebtoken');
const autenticacion = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  try {
    const JWT_SECRETO = process.env.JWT_SECRETO;
    if (!JWT_SECRETO) return res.status(500).json({ error: 'Error de configuración' });
    const decoded = jwt.verify(token, JWT_SECRETO);
    req.usuario = { id: String(decoded.id), nombre: decoded.nombre || 'Usuario', email: decoded.email, rol: decoded.rol };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

// Endpoints de cupones
aplicacion.get('/api/cupones', async (req, res) => {
  try {
    console.log('🎫 Obteniendo cupones disponibles');
    
    const cupones = await obtenerCupones();
    
    res.json({
      cupones: cupones,
      total: cupones.length
    });
  } catch (error) {
    console.error('Error obteniendo cupones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

aplicacion.post('/api/cupones/validar', async (req, res) => {
  try {
    const { codigo, monto_compra, total_compra } = req.body;
    const montoCompra = monto_compra || total_compra || 0;
    
    console.log(`🎫 Validando cupón: ${codigo} para compra de $${montoCompra}`);
    
    const cupon = await validarCupon(codigo);
    
    if (!cupon) {
      return res.status(404).json({ error: 'Cupón no válido o expirado' });
    }
    
    if (cupon.minimo_compra && montoCompra < cupon.minimo_compra) {
      return res.status(400).json({ 
        error: `Compra mínima requerida: $${cupon.minimo_compra}` 
      });
    }
    
    if (cupon.usos_maximos > 0 && cupon.usos_actuales >= cupon.usos_maximos) {
      return res.status(400).json({ error: 'Cupón agotado' });
    }
    
    let descuento = 0;
    
    if (cupon.tipo === 'porcentaje') {
      descuento = (montoCompra * cupon.valor) / 100;
    } else if (cupon.tipo === 'monto_fijo') {
      descuento = cupon.valor;
    }
    
    res.json({
      valido: true,
      cupon: {
        codigo: cupon.codigo,
        descripcion: cupon.descripcion,
        tipo: cupon.tipo,
        valor: cupon.valor,
        descuento: Math.round(descuento * 100) / 100,
        total_con_descuento: Math.max(0, montoCompra - Math.round(descuento * 100) / 100)
      }
    });
  } catch (error) {
    console.error('Error validando cupón:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

aplicacion.post('/api/cupones/aplicar', autenticacion, (req, res) => {
  const { codigo } = req.body;
  
  console.log(`🎫 Aplicando cupón: ${codigo}`);
  
  const cupon = cuponesDB.find(c => c.id === codigo);
  if (cupon) {
    cupon.usos_actuales += 1;
  }
  
  res.json({
    mensaje: 'Cupón aplicado exitosamente',
    codigo: codigo
  });
});

// Endpoints de campañas
aplicacion.get('/api/campanas', async (req, res) => {
  try {
    console.log('📢 Obteniendo campañas de marketing');
    
    const consulta = 'SELECT * FROM campana ORDER BY fecha_creacion DESC';
    const resultado = await pool.query(consulta);
    
    res.json({
      campanas: resultado.rows,
      total: resultado.rows.length
    });
  } catch (error) {
    console.error('Error obteniendo campañas:', error);
    res.json({ campanas: campanasDB, total: campanasDB.length });
  }
});

aplicacion.post('/api/campanas', async (req, res) => {
  const { nombre, descripcion, tipo, presupuesto } = req.body;
  
  console.log(`📢 Creando campaña: ${nombre}`);
  
  try {
    const consulta = `
      INSERT INTO campana (nombre, descripcion, tipo, presupuesto, estado)
      VALUES ($1, $2, $3, $4, 'Activa')
      RETURNING *
    `;
    const resultado = await pool.query(consulta, [nombre, descripcion, tipo || 'general', presupuesto || 0]);
    
    res.status(201).json({
      mensaje: 'Campaña creada exitosamente',
      campana: resultado.rows[0]
    });
  } catch (error) {
    console.error('Error creando campaña:', error);
    res.status(500).json({ error: 'Error creando campaña' });
  }
});

aplicacion.put('/api/campanas/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, tipo, presupuesto, activa } = req.body;
  
  try {
    const consulta = `
      UPDATE campana 
      SET nombre = COALESCE($1, nombre),
          descripcion = COALESCE($2, descripcion),
          tipo = COALESCE($3, tipo),
          presupuesto = COALESCE($4, presupuesto),
          estado = COALESCE($5, estado)
      WHERE id = $6
      RETURNING *
    `;
    const resultado = await pool.query(consulta, [nombre, descripcion, tipo, presupuesto, activa ? 'Activa' : 'Pausada', id]);
    
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Campaña no encontrada' });
    }
    
    res.json({
      mensaje: 'Campaña actualizada',
      campana: resultado.rows[0]
    });
  } catch (error) {
    console.error('Error actualizando campaña:', error);
    res.status(500).json({ error: 'Error actualizando campaña' });
  }
});

aplicacion.delete('/api/campanas/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const consulta = 'DELETE FROM campana WHERE id = $1 RETURNING *';
    const resultado = await pool.query(consulta, [id]);
    
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Campaña no encontrada' });
    }
    
    res.json({
      mensaje: 'Campaña eliminada exitosamente',
      campana: resultado.rows[0]
    });
  } catch (error) {
    console.error('Error eliminando campaña:', error);
    res.status(500).json({ error: 'Error eliminando campaña' });
  }
});

aplicacion.get('/api/campanas/:id/metricas', (req, res) => {
  const campanId = req.params.id;
  
  console.log(`📊 Obteniendo métricas de campaña ${campanId}`);
  
  const campana = campanasDB.find(c => c.id === campanId);
  
  if (!campana) {
    return res.status(404).json({ error: 'Campaña no encontrada' });
  }
  
  res.json({
    campana: campana.nombre,
    metricas: campana.metricas,
    presupuesto: {
      total: campana.presupuesto,
      gastado: campana.gasto_actual,
      restante: campana.presupuesto - campana.gasto_actual
    }
  });
});

// Endpoints de fidelización
aplicacion.get('/api/fidelizacion/puntos', autenticacion, (req, res) => {
  const usuarioId = req.usuario.id;
  
  console.log(`⭐ Obteniendo puntos de fidelización para usuario ${usuarioId}`);
  
  const puntos = fidelizacionDB.get(usuarioId) || 0;
  
  res.json({
    puntos_actuales: puntos,
    nivel: puntos >= 1000 ? 'Gold' : puntos >= 500 ? 'Silver' : 'Bronze',
    beneficios: {
      descuento_disponible: Math.floor(puntos / 100) * 5, // 5% por cada 100 puntos
      envio_gratis: puntos >= 500
    }
  });
});

aplicacion.post('/api/fidelizacion/agregar-puntos', autenticacion, (req, res) => {
  const usuarioId = req.usuario.id;
  const { puntos, razon } = req.body;
  
  console.log(`⭐ Agregando ${puntos} puntos al usuario ${usuarioId} por: ${razon}`);
  
  const puntosActuales = fidelizacionDB.get(usuarioId) || 0;
  const nuevosPuntos = puntosActuales + puntos;
  
  fidelizacionDB.set(usuarioId, nuevosPuntos);
  
  res.json({
    mensaje: 'Puntos agregados exitosamente',
    puntos_anteriores: puntosActuales,
    puntos_agregados: puntos,
    puntos_totales: nuevosPuntos,
    razon: razon
  });
});

aplicacion.post('/api/fidelizacion/canjear', autenticacion, (req, res) => {
  const usuarioId = req.usuario.id;
  const { puntos_a_canjear, tipo_recompensa } = req.body;
  
  console.log(`🎁 Usuario ${usuarioId} canjeando ${puntos_a_canjear} puntos por ${tipo_recompensa}`);
  
  const puntosActuales = fidelizacionDB.get(usuarioId) || 0;
  
  if (puntosActuales < puntos_a_canjear) {
    return res.status(400).json({ error: 'Puntos insuficientes' });
  }
  
  const nuevoPuntaje = puntosActuales - puntos_a_canjear;
  fidelizacionDB.set(usuarioId, nuevoPuntaje);
  
  let recompensa = '';
  if (tipo_recompensa === 'descuento') {
    recompensa = `Descuento del ${Math.floor(puntos_a_canjear / 100) * 5}%`;
  } else if (tipo_recompensa === 'envio_gratis') {
    recompensa = 'Envío gratis en próxima compra';
  }
  
  res.json({
    mensaje: 'Puntos canjeados exitosamente',
    recompensa: recompensa,
    puntos_canjeados: puntos_a_canjear,
    puntos_restantes: nuevoPuntaje
  });
});

// Endpoints de análisis
aplicacion.get('/api/analytics/resumen', (req, res) => {
  console.log('📊 Obteniendo resumen de analytics de marketing');
  
  const totalCupones = cuponesDB.length;
  const cuponesActivos = cuponesDB.filter(c => c.activo).length;
  const totalUsosCupones = cuponesDB.reduce((sum, c) => sum + c.usos_actuales, 0);
  
  const campanasActivas = campanasDB.filter(c => c.activa).length;
  const presupuestoTotal = campanasDB.reduce((sum, c) => sum + c.presupuesto, 0);
  const gastoTotal = campanasDB.reduce((sum, c) => sum + c.gasto_actual, 0);
  
  res.json({
    cupones: {
      total: totalCupones,
      activos: cuponesActivos,
      usos_totales: totalUsosCupones
    },
    campanas: {
      total: campanasDB.length,
      activas: campanasActivas,
      presupuesto_total: presupuestoTotal,
      gasto_total: gastoTotal,
      eficiencia: gastoTotal > 0 ? ((presupuestoTotal - gastoTotal) / presupuestoTotal * 100).toFixed(2) : 100
    },
    fidelizacion: {
      usuarios_activos: fidelizacionDB.size,
      puntos_totales_emitidos: Array.from(fidelizacionDB.values()).reduce((sum, p) => sum + p, 0)
    }
  });
});

// Ruta de salud
aplicacion.get('/salud', (req, res) => {
  res.json({
    estado: 'activo',
    servicio: 'marketing',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    estadisticas: {
      cupones_activos: cuponesDB.filter(c => c.activo).length,
      campanas_activas: campanasDB.filter(c => c.activa).length,
      usuarios_fidelizacion: fidelizacionDB.size
    }
  });
});

// Manejador de errores
aplicacion.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

aplicacion.listen(puerto, () => {
  console.log(`🚀 Marketing Service v2.0 ejecutándose en puerto ${puerto}`);
  console.log(`📋 Endpoints disponibles:`);
  console.log(`   • GET /api/cupones`);
  console.log(`   • POST /api/cupones/validar`);
  console.log(`   • GET /api/fidelizacion/puntos`);
});

module.exports = aplicacion;