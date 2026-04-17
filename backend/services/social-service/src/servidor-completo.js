const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();
const dbManager = require('./config/baseDatos');

// Datos en memoria como fallback
const preguntasDB = [];
const listasDeseosDB = new Map();

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

// Endpoints de preguntas
aplicacion.get('/api/preguntas/:productoId', (req, res) => {
  const productoId = req.params.productoId;
  console.log(`❓ Obteniendo preguntas para producto ${productoId}`);
  
  const preguntas = preguntasDB.filter(p => p.producto_id === productoId);
  
  res.json({
    preguntas,
    total: preguntas.length
  });
});

aplicacion.post('/api/preguntas', autenticacion, async (req, res) => {
  const { producto_id, pregunta } = req.body;
  const usuario = req.usuario;

  if (!producto_id || !pregunta) {
    return res.status(400).json({ error: 'producto_id y pregunta son requeridos' });
  }

  console.log(`❓ Nueva pregunta de ${usuario.nombre} para producto ${producto_id}`);

  const nuevaPregunta = {
    id: String(Date.now()),
    producto_id,
    usuario_id: usuario.id,
    usuario_nombre: usuario.nombre,
    pregunta,
    respuesta: null,
    fecha_pregunta: new Date().toISOString(),
    fecha_respuesta: null
  };

  preguntasDB.push(nuevaPregunta);

  res.status(201).json({
    mensaje: 'Pregunta enviada exitosamente',
    pregunta: nuevaPregunta
  });
});

// Responder pregunta (solo roles admin/seller)
aplicacion.put('/api/preguntas/:id/responder', autenticacion, (req, res) => {
  const { id } = req.params;
  const { respuesta } = req.body;
  const rolesPermitidos = ['ceo', 'product_manager', 'seller_premium', 'seller_standard', 'support_agent', 'customer_success'];

  if (!rolesPermitidos.includes(req.usuario.rol)) {
    return res.status(403).json({ error: 'Sin permisos para responder preguntas' });
  }

  if (!respuesta) {
    return res.status(400).json({ error: 'La respuesta es requerida' });
  }

  const pregunta = preguntasDB.find(p => p.id === id);
  if (!pregunta) {
    return res.status(404).json({ error: 'Pregunta no encontrada' });
  }

  pregunta.respuesta = respuesta;
  pregunta.fecha_respuesta = new Date().toISOString();

  res.json({ mensaje: 'Pregunta respondida exitosamente', pregunta });
});

// Endpoints de listas de deseos
aplicacion.get('/api/listas-deseos', autenticacion, (req, res) => {
  const usuarioId = req.usuario.id;
  console.log(`💖 Obteniendo lista de deseos para usuario ${usuarioId}`);
  
  const listaDeseos = listasDeseosDB.get(usuarioId) || [];
  
  res.json({
    productos: listaDeseos,
    total: listaDeseos.length
  });
});

aplicacion.post('/api/listas-deseos', autenticacion, (req, res) => {
  const { producto_id } = req.body;
  const usuarioId = req.usuario.id;
  
  console.log(`💖 Agregando producto ${producto_id} a lista de deseos del usuario ${usuarioId}`);
  
  let listaDeseos = listasDeseosDB.get(usuarioId) || [];
  
  if (!listaDeseos.includes(producto_id)) {
    listaDeseos.push(producto_id);
    listasDeseosDB.set(usuarioId, listaDeseos);
  }
  
  res.json({
    mensaje: 'Producto agregado a lista de deseos',
    total_items: listaDeseos.length
  });
});

aplicacion.delete('/api/listas-deseos/:productoId', autenticacion, (req, res) => {
  const productoId = req.params.productoId;
  const usuarioId = req.usuario.id;
  
  console.log(`🗑️ Eliminando producto ${productoId} de lista de deseos del usuario ${usuarioId}`);
  
  let listaDeseos = listasDeseosDB.get(usuarioId) || [];
  listaDeseos = listaDeseos.filter(id => id !== productoId);
  listasDeseosDB.set(usuarioId, listaDeseos);
  
  res.json({
    mensaje: 'Producto eliminado de lista de deseos'
  });
});

// Ruta de salud
aplicacion.get('/salud', (req, res) => {
  res.json({
    estado: 'activo',
    servicio: 'social',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    estadisticas: {
      total_resenas: 0,
      total_preguntas: preguntasDB.length,
      listas_deseos_activas: listasDeseosDB.size
    }
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