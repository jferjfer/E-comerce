const Joi = require('joi');

// VULN-006 FIX: Sanitización de HTML para prevenir XSS almacenado
const sanitizarTexto = (texto) => {
  if (!texto) return texto;
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/`/g, '&#x60;')
    .replace(/=/g, '&#x3D;')
    .replace(/\{\{/g, '&#123;&#123;')   // SSTI
    .replace(/\$\{/g, '&#36;&#123;')    // Template injection
    .trim();
};

const esquemaResena = Joi.object({
  id_producto: Joi.string().required().messages({
    'any.required': 'El ID del producto es requerido'
  }),
  calificacion: Joi.number().integer().min(1).max(5).required().messages({
    'number.min': 'La calificación debe ser entre 1 y 5',
    'number.max': 'La calificación debe ser entre 1 y 5',
    'any.required': 'La calificación es requerida'
  }),
  // VULN-006 FIX: Sanitizar comentario antes de guardar
  comentario: Joi.string().max(1000).optional().custom((value) => sanitizarTexto(value)).messages({
    'string.max': 'El comentario no puede exceder 1000 caracteres'
  }),
  imagenes: Joi.array().items(Joi.string().uri()).max(5).optional().messages({
    'array.max': 'Máximo 5 imágenes permitidas'
  })
});

const esquemaPregunta = Joi.object({
  id_producto: Joi.string().required().messages({
    'any.required': 'El ID del producto es requerido'
  }),
  // VULN-006 FIX: Sanitizar pregunta
  texto_pregunta: Joi.string().min(10).max(500).required().custom((value) => sanitizarTexto(value)).messages({
    'string.min': 'La pregunta debe tener al menos 10 caracteres',
    'string.max': 'La pregunta no puede exceder 500 caracteres',
    'any.required': 'El texto de la pregunta es requerido'
  })
});

const esquemaRespuesta = Joi.object({
  // VULN-006 FIX: Sanitizar respuesta
  texto_respuesta: Joi.string().min(5).max(1000).required().custom((value) => sanitizarTexto(value)).messages({
    'string.min': 'La respuesta debe tener al menos 5 caracteres',
    'string.max': 'La respuesta no puede exceder 1000 caracteres',
    'any.required': 'El texto de la respuesta es requerido'
  })
});

const validarResena = (datos) => {
  return esquemaResena.validate(datos, { abortEarly: false });
};

const validarPregunta = (datos) => {
  return esquemaPregunta.validate(datos, { abortEarly: false });
};

const validarRespuesta = (datos) => {
  return esquemaRespuesta.validate(datos, { abortEarly: false });
};

module.exports = {
  validarResena,
  validarPregunta,
  validarRespuesta
};