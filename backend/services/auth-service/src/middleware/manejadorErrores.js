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
  if (error.code === '23505') { // Violación de restricción única
    return res.status(409).json({
      error: 'El recurso ya existe'
    });
  }

  if (error.code === '23503') { // Violación de clave foránea
    return res.status(400).json({
      error: 'Referencia inválida'
    });
  }

  // Errores personalizados
  if (error.message === 'El usuario ya existe con este email') {
    return res.status(409).json({
      error: error.message
    });
  }

  if (error.message === 'Credenciales inválidas') {
    return res.status(401).json({
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