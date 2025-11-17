const express = require('express');
const router = express.Router();

// Simulación de reseñas
const resenas = [
  {
    id: 1,
    productoId: 'prod_001',
    usuario: 'María García',
    puntuacion: 5,
    comentario: 'Excelente producto, muy recomendado',
    fecha: new Date().toISOString()
  },
  {
    id: 2,
    productoId: 'prod_002',
    usuario: 'Juan Pérez',
    puntuacion: 4,
    comentario: 'Buena calidad, llegó rápido',
    fecha: new Date().toISOString()
  }
];

router.get('/:productoId', (req, res) => {
  const { productoId } = req.params;
  const resenasProducto = resenas.filter(r => r.productoId === productoId);
  res.json({ resenas: resenasProducto });
});

router.post('/', (req, res) => {
  const { productoId, puntuacion, comentario } = req.body;
  const nuevaResena = {
    id: resenas.length + 1,
    productoId,
    usuario: 'Usuario Anónimo',
    puntuacion,
    comentario,
    fecha: new Date().toISOString()
  };
  
  resenas.push(nuevaResena);
  res.json({ mensaje: 'Reseña agregada', resena: nuevaResena });
});

module.exports = router;