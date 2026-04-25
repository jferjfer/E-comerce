const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();
const dbManager = require('./config/baseDatos');

// Datos en memoria como fallback solo para preguntas
const preguntasDB = [];

const aplicacion = express();
const puerto = process.env.PUERTO || 3004;

// Middleware
aplicacion.use(helmet());
aplicacion.use(cors({
  origin: ['https://egoscolombia.com.co', 'http://localhost:3000'],
  credentials: true
}));
aplicacion.use(express.json());

// Logging middleware
aplicacion.use((req, res, next) => {
  console.log(`👥 ${req.method} ${req.url} - ${new Date().toLocaleTimeString()}`);
  next();
});

// Inicializar conexión a MongoDB
let db;

async function inicializarDB() {
  try {
    db = await dbManager.conectar();
    console.log('✅ Social Service conectado a MongoDB');
    
    // Inicializar datos si no existen
    const resenasCount = await db.collection('resenas').countDocuments();
    if (resenasCount === 0) {
      await db.collection('resenas').insertMany([
        {
          id: '1', producto_id: '1', usuario_id: '1', usuario_nombre: 'Ana García',
          calificacion: 5, comentario: 'Excelente vestido, muy cómodo y elegante. Lo recomiendo 100%.',
          fecha: '2024-01-15T10:30:00Z', verificado: true
        }
      ]);
      console.log('✅ Datos iniciales insertados en MongoDB');
    }
  } catch (error) {
    console.error('❌ Error conectando Social Service:', error);
  }
}

inicializarDB();

const axios = require('axios');
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3011';

// Middleware de autenticación JWT real
const jwt = require('jsonwebtoken');
const autenticacion = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  try {
    const JWT_SECRETO = process.env.JWT_SECRETO;
    if (!JWT_SECRETO) return res.status(500).json({ error: 'Error de configuración' });
    const decoded = jwt.verify(token, JWT_SECRETO);
    // Obtener nombre real desde auth-service
    let nombreReal = decoded.nombre || 'Usuario';
    try {
      const resUser = await axios.get(`${AUTH_SERVICE_URL}/api/usuarios/${decoded.id}`, { timeout: 2000 });
      nombreReal = resUser.data.usuario?.nombre || nombreReal;
    } catch (e) {}
    req.usuario = { id: String(decoded.id), nombre: nombreReal, email: decoded.email, rol: decoded.rol };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

// Endpoints de reseñas
aplicacion.get('/api/resenas/:productoId', async (req, res) => {
  try {
    const productoId = req.params.productoId;
    console.log(`⭐ Obteniendo reseñas para producto ${productoId}`);
    
    const resenas = await db.collection('resenas').find({ producto_id: productoId }).toArray();
    const promedioCalificacion = resenas.length > 0 
      ? resenas.reduce((sum, r) => sum + r.calificacion, 0) / resenas.length 
      : 0;
    
    res.json({
      resenas,
      total: resenas.length,
      promedio_calificacion: Math.round(promedioCalificacion * 10) / 10
    });
  } catch (error) {
    console.error('Error obteniendo reseñas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

aplicacion.post('/api/resenas', autenticacion, async (req, res) => {
  try {
    const { producto_id, calificacion, comentario } = req.body;
    const usuario = req.usuario;
    
    console.log(`⭐ Nueva reseña de ${usuario.nombre} para producto ${producto_id}`);
    
    const nuevaResena = {
      id: String(Date.now()),
      producto_id,
      usuario_id: usuario.id,
      usuario_nombre: usuario.nombre,
      calificacion,
      comentario,
      fecha: new Date().toISOString(),
      verificado: false
    };
    
    await db.collection('resenas').insertOne(nuevaResena);
    
    res.status(201).json({
      mensaje: 'Reseña agregada exitosamente',
      resena: nuevaResena
    });
  } catch (error) {
    console.error('Error agregando reseña:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoints de preguntas — persistidas en MongoDB
aplicacion.get('/api/preguntas/:productoId', async (req, res) => {
  const productoId = req.params.productoId;
  try {
    const preguntas = await db.collection('preguntas').find({ producto_id: productoId }).sort({ fecha_pregunta: -1 }).toArray();
    res.json({ preguntas, total: preguntas.length });
  } catch {
    res.json({ preguntas: [], total: 0 });
  }
});

aplicacion.post('/api/preguntas', autenticacion, async (req, res) => {
  const { producto_id, pregunta } = req.body;
  const usuario = req.usuario;
  if (!producto_id || !pregunta)
    return res.status(400).json({ error: 'producto_id y pregunta son requeridos' });
  try {
    const nueva = {
      id: String(Date.now()),
      producto_id,
      usuario_id: usuario.id,
      usuario_nombre: usuario.nombre,
      pregunta,
      respuesta: null,
      fecha_pregunta: new Date().toISOString(),
      fecha_respuesta: null
    };
    await db.collection('preguntas').insertOne(nueva);
    res.status(201).json({ mensaje: 'Pregunta enviada exitosamente', pregunta: nueva });
  } catch {
    res.status(500).json({ error: 'Error guardando pregunta' });
  }
});

aplicacion.put('/api/preguntas/:id/responder', autenticacion, async (req, res) => {
  const { id } = req.params;
  const { respuesta } = req.body;
  const rolesPermitidos = ['ceo', 'product_manager', 'seller_premium', 'seller_standard', 'support_agent', 'customer_success'];
  if (!rolesPermitidos.includes(req.usuario.rol))
    return res.status(403).json({ error: 'Sin permisos para responder preguntas' });
  if (!respuesta)
    return res.status(400).json({ error: 'La respuesta es requerida' });
  try {
    const resultado = await db.collection('preguntas').findOneAndUpdate(
      { id },
      { $set: { respuesta, fecha_respuesta: new Date().toISOString() } },
      { returnDocument: 'after' }
    );
    if (!resultado) return res.status(404).json({ error: 'Pregunta no encontrada' });
    res.json({ mensaje: 'Pregunta respondida exitosamente', pregunta: resultado });
  } catch {
    res.status(500).json({ error: 'Error respondiendo pregunta' });
  }
});

// Endpoints de listas de deseos — persistidas en MongoDB
aplicacion.get('/api/listas-deseos', autenticacion, async (req, res) => {
  const usuarioId = req.usuario.id;
  try {
    const lista = await db.collection('listas_deseos').findOne({ usuario_id: usuarioId });
    const productos = lista?.productos || [];
    res.json({ productos, total: productos.length });
  } catch {
    res.json({ productos: [], total: 0 });
  }
});

aplicacion.post('/api/listas-deseos', autenticacion, async (req, res) => {
  const { producto_id } = req.body;
  const usuarioId = req.usuario.id;
  try {
    await db.collection('listas_deseos').updateOne(
      { usuario_id: usuarioId },
      { $addToSet: { productos: producto_id }, $set: { fecha_actualizacion: new Date() } },
      { upsert: true }
    );
    const lista = await db.collection('listas_deseos').findOne({ usuario_id: usuarioId });
    res.json({ mensaje: 'Producto agregado a lista de deseos', total_items: lista?.productos?.length || 0 });
  } catch {
    res.status(500).json({ error: 'Error guardando favorito' });
  }
});

aplicacion.delete('/api/listas-deseos/:productoId', autenticacion, async (req, res) => {
  const productoId = req.params.productoId;
  const usuarioId = req.usuario.id;
  try {
    await db.collection('listas_deseos').updateOne(
      { usuario_id: usuarioId },
      { $pull: { productos: productoId }, $set: { fecha_actualizacion: new Date() } }
    );
    res.json({ mensaje: 'Producto eliminado de lista de deseos' });
  } catch {
    res.status(500).json({ error: 'Error eliminando favorito' });
  }
});

// Ruta de salud
aplicacion.get('/salud', async (req, res) => {
  let totalResenas = 0, totalPreguntas = 0, totalWishlists = 0;
  try {
    totalResenas = await db.collection('resenas').countDocuments();
    totalPreguntas = await db.collection('preguntas').countDocuments();
    totalWishlists = await db.collection('listas_deseos').countDocuments();
  } catch {}
  res.json({
    estado: 'activo',
    servicio: 'social',
    version: '2.2.0',
    timestamp: new Date().toISOString(),
    estadisticas: { total_resenas: totalResenas, total_preguntas: totalPreguntas, listas_deseos_activas: totalWishlists }
  });
});

// Manejador de errores
aplicacion.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

aplicacion.listen(puerto, () => {
  console.log(`🚀 Social Service v2.0 ejecutándose en puerto ${puerto}`);
  console.log(`📋 Endpoints disponibles:`);
  console.log(`   • GET /api/resenas/:productoId`);
  console.log(`   • POST /api/resenas`);
  console.log(`   • GET /api/listas-deseos`);
});

module.exports = aplicacion;