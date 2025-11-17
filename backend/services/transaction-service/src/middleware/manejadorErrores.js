const manejadorErrores = (error, req, res, next) => {
  console.error('❌ Error:', error);

  // Error de validación de Joi
  if (error.isJoi) {
    return res.status(400).json({
      error: 'Datos inválidos',
      detalles: error.details.map(detalle => detalle.message)
    });
  }

  // Error de base de datos
  if (error.code === '23505') {
    return res.status(409).json({
      error: 'El recurso ya existe'
    });
  }

  if (error.code === '23503') {
    return res.status(400).json({
      error: 'Referencia inválida'
    });
  }

  // Errores personalizados
  if (error.message === 'Producto no encontrado') {
    return res.status(404).json({
      error: error.message
    });
  }

  if (error.message === 'El producto no está disponible') {
    return res.status(400).json({
      error: error.message
    });
  }

  if (error.message === 'Carrito no encontrado') {
    return res.status(404).json({
      error: error.message
    });
  }

  if (error.message === 'Carrito vacío') {
    return res.status(400).json({
      error: error.message
    });
  }

  // Error genérico
  res.status(500).json({
    error: 'Error interno del servidor',
    ...(process.env.ENTORNO === 'desarrollo' && { detalle: error.message })
  });
};

module.exports = manejadorErrores;