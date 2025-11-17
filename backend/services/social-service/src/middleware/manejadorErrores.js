const manejadorErrores = (error, req, res, next) => {
  console.error('❌ Error:', error);

  if (error.isJoi) {
    return res.status(400).json({
      error: 'Datos inválidos',
      detalles: error.details.map(detalle => detalle.message)
    });
  }

  if (error.message === 'Reseña no encontrada') {
    return res.status(404).json({
      error: error.message
    });
  }

  if (error.message === 'ID de reseña inválido') {
    return res.status(400).json({
      error: error.message
    });
  }

  res.status(500).json({
    error: 'Error interno del servidor',
    ...(process.env.ENTORNO === 'desarrollo' && { detalle: error.message })
  });
};

module.exports = manejadorErrores;