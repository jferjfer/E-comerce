const express = require('express');
const router = express.Router();

// Simulación de carrito
let carritos = {};

router.get('/:usuarioId', (req, res) => {
  const { usuarioId } = req.params;
  const carrito = carritos[usuarioId] || { items: [], total: 0 };
  res.json(carrito);
});

router.post('/agregar', (req, res) => {
  const { usuarioId = 1, productoId, cantidad = 1 } = req.body;
  
  if (!carritos[usuarioId]) {
    carritos[usuarioId] = { items: [], total: 0 };
  }
  
  const item = {
    productoId,
    cantidad,
    precio: 29.99,
    total: 29.99 * cantidad
  };
  
  carritos[usuarioId].items.push(item);
  carritos[usuarioId].total += item.total;
  
  res.json({
    mensaje: 'Producto agregado al carrito',
    carrito: carritos[usuarioId]
  });
});

module.exports = router;